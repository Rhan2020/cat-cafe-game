const Asset = require('../models/Asset');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const sharp = require('sharp');
const { logger } = require('../middleware/logging');

// 配置文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${fileExtension}`);
  }
});

const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'video/mp4': '.mp4',
    'application/json': '.json' // 动画配置文件
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB限制
  }
});

// 计算文件哈希
const calculateFileHash = async (filePath) => {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
};

// 获取图片元数据
const getImageMetadata = async (filePath) => {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      colorDepth: metadata.channels
    };
  } catch (error) {
    logger.error('获取图片元数据失败:', error);
    return {};
  }
};

// 生成缩略图
const generateThumbnail = async (originalPath, thumbnailPath) => {
  try {
    await sharp(originalPath)
      .resize(200, 200, { 
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    return true;
  } catch (error) {
    logger.error('生成缩略图失败:', error);
    return false;
  }
};

// @desc    上传素材
// @route   POST /api/assets/upload
// @access  Private
exports.uploadAsset = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: '请选择要上传的文件' });
      }

      const { name, description, category, tags } = req.body;
      const filePath = req.file.path;
      
      // 验证必填字段
      if (!name || !category) {
        await fs.unlink(filePath); // 删除已上传的文件
        return res.status(400).json({ message: '名称和分类为必填项' });
      }

      // 计算文件哈希
      const fileHash = await calculateFileHash(filePath);
      
      // 检查是否已存在相同文件
      const existingAsset = await Asset.findByHash(fileHash);
      if (existingAsset) {
        await fs.unlink(filePath); // 删除重复文件
        return res.status(409).json({ 
          message: '文件已存在',
          existingAsset: existingAsset._id
        });
      }

      // 获取文件元数据
      let metadata = {};
      if (req.file.mimetype.startsWith('image/')) {
        metadata = await getImageMetadata(filePath);
        
        // 生成缩略图 - 使用path模块安全处理文件路径
        const thumbnailPath = path.join(
          path.dirname(filePath),
          path.basename(filePath, path.extname(filePath)) + '_thumb' + path.extname(filePath)
        );
        await generateThumbnail(filePath, thumbnailPath);
      }

      // 创建素材记录
      const asset = new Asset({
        name,
        description: description || '',
        category,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileExtension: path.extname(req.file.originalname),
        fileHash,
        originalUrl: `/uploads/${req.file.filename}`,
        thumbnailUrl: req.file.mimetype.startsWith('image/') ? 
          `/uploads/${path.basename(req.file.filename, path.extname(req.file.filename))}_thumb${path.extname(req.file.filename)}` : null,
        metadata,
        createdBy: req.user?.id || 'system',
        status: 'active'
      });

      await asset.save();

      logger.info(`素材上传成功: ${asset._id}`, {
        userId: req.user?.id,
        fileName: req.file.originalname,
        fileSize: req.file.size
      });

      res.status(201).json({
        message: '素材上传成功',
        data: asset
      });

    } catch (error) {
      logger.error('素材上传失败:', error);
      
      // 清理文件
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          logger.error('清理文件失败:', cleanupError);
        }
      }

      res.status(500).json({ message: '素材上传失败' });
    }
  }
];

// @desc    获取素材列表
// @route   GET /api/assets
// @access  Private
exports.getAssets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      status = 'active',
      search,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // 构建查询条件
    const query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    // 分页参数
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // 排序参数
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // 执行查询
    const [assets, total] = await Promise.all([
      Asset.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .select('-fileHash'),
      Asset.countDocuments(query)
    ]);

    res.json({
      data: assets,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });

  } catch (error) {
    logger.error('获取素材列表失败:', error);
    res.status(500).json({ message: '获取素材列表失败' });
  }
};

// @desc    获取单个素材详情
// @route   GET /api/assets/:id
// @access  Private
exports.getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('parentAssetId', 'name version')
      .select('-fileHash');

    if (!asset) {
      return res.status(404).json({ message: '素材不存在' });
    }

    // 标记为已使用
    await asset.markAsUsed();

    res.json({ data: asset });

  } catch (error) {
    logger.error('获取素材详情失败:', error);
    res.status(500).json({ message: '获取素材详情失败' });
  }
};

// @desc    更新素材信息
// @route   PUT /api/assets/:id
// @access  Private
exports.updateAsset = async (req, res) => {
  try {
    const { name, description, category, tags, status, visibility } = req.body;
    
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: '素材不存在' });
    }

    // 更新字段
    if (name !== undefined) asset.name = name;
    if (description !== undefined) asset.description = description;
    if (category !== undefined) asset.category = category;
    if (tags !== undefined) {
      asset.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    }
    if (status !== undefined) asset.status = status;
    if (visibility !== undefined) asset.visibility = visibility;
    
    asset.updatedBy = req.user?.id || 'system';

    await asset.save();

    logger.info(`素材信息更新: ${asset._id}`, {
      userId: req.user?.id,
      changes: req.body
    });

    res.json({
      message: '素材信息更新成功',
      data: asset
    });

  } catch (error) {
    logger.error('更新素材信息失败:', error);
    res.status(500).json({ message: '更新素材信息失败' });
  }
};

// @desc    删除素材
// @route   DELETE /api/assets/:id
// @access  Private
exports.deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: '素材不存在' });
    }

    // 检查是否被游戏配置引用
    if (asset.gameConfigReferences && asset.gameConfigReferences.length > 0) {
      return res.status(400).json({ 
        message: '素材正在被游戏配置使用，无法删除',
        references: asset.gameConfigReferences
      });
    }

    // 软删除：标记为已删除
    asset.status = 'deleted';
    asset.updatedBy = req.user?.id || 'system';
    await asset.save();

    logger.info(`素材删除: ${asset._id}`, {
      userId: req.user?.id,
      fileName: asset.fileName
    });

    res.json({ message: '素材删除成功' });

  } catch (error) {
    logger.error('删除素材失败:', error);
    res.status(500).json({ message: '删除素材失败' });
  }
};

// @desc    获取素材统计信息
// @route   GET /api/assets/stats
// @access  Private
exports.getAssetStats = async (req, res) => {
  try {
    const stats = await Asset.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
          avgSize: { $avg: '$fileSize' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalStats = await Asset.aggregate([
      {
        $group: {
          _id: null,
          totalAssets: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
          totalUsage: { $sum: '$usageCount' }
        }
      }
    ]);

    res.json({
      data: {
        byCategory: stats,
        total: totalStats[0] || { totalAssets: 0, totalSize: 0, totalUsage: 0 }
      }
    });

  } catch (error) {
    logger.error('获取素材统计失败:', error);
    res.status(500).json({ message: '获取素材统计失败' });
  }
};

// @desc    批量操作素材
// @route   POST /api/assets/batch
// @access  Private
exports.batchOperateAssets = async (req, res) => {
  try {
    const { assetIds, operation, data } = req.body;
    
    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return res.status(400).json({ message: '请选择要操作的素材' });
    }

    let result;
    
    switch (operation) {
      case 'updateStatus':
        result = await Asset.updateMany(
          { _id: { $in: assetIds } },
          { 
            status: data.status, 
            updatedBy: req.user?.id || 'system' 
          }
        );
        break;
        
      case 'updateCategory':
        result = await Asset.updateMany(
          { _id: { $in: assetIds } },
          { 
            category: data.category, 
            updatedBy: req.user?.id || 'system' 
          }
        );
        break;
        
      case 'addTags':
        result = await Asset.updateMany(
          { _id: { $in: assetIds } },
          { 
            $addToSet: { tags: { $each: data.tags } },
            updatedBy: req.user?.id || 'system'
          }
        );
        break;
        
      default:
        return res.status(400).json({ message: '不支持的操作' });
    }

    logger.info(`批量操作素材: ${operation}`, {
      userId: req.user?.id,
      assetCount: assetIds.length,
      operation,
      data
    });

    res.json({
      message: '批量操作完成',
      affectedCount: result.modifiedCount
    });

  } catch (error) {
    logger.error('批量操作素材失败:', error);
    res.status(500).json({ message: '批量操作失败' });
  }
};

module.exports = {
  uploadAsset: exports.uploadAsset,
  getAssets: exports.getAssets,
  getAssetById: exports.getAssetById,
  updateAsset: exports.updateAsset,
  deleteAsset: exports.deleteAsset,
  getAssetStats: exports.getAssetStats,
  batchOperateAssets: exports.batchOperateAssets
};