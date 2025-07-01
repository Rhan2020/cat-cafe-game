const Asset = require('../models/Asset');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const sharp = require('sharp');
const FileType = require('file-type');
const { logger } = require('../middleware/logging');
const promClient = require('prom-client');

const uploadSizeHistogram = new promClient.Histogram({
  name: 'asset_upload_size_bytes',
  help: '单次资产上传文件大小',
  buckets: [1024, 10*1024, 100*1024, 1024*1024, 5*1024*1024, 20*1024*1024, 50*1024*1024]
});

// res.t('auto.e9858de7')
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
  // res.t('auto.e58581e8')
  const allowedTypes = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'video/mp4': '.mp4',
    'application/json': '.json' // res.t('auto.e58aa8e7')
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`res.t('auto.e4b88de6'): ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MBres.t('auto.e99990e5')
  }
});

// res.t('auto.e8aea1e7')
const calculateFileHash = async (filePath) => {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
};

// res.t('auto.e88eb7e5')
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
    logger.error('res.t('auto.e88eb7e5'):', error);
    return {};
  }
};

// res.t('auto.e7949fe6')
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
    logger.error('res.t('auto.e7949fe6'):', error);
    return false;
  }
};

// @desc    res.t('auto.e4b88ae4')
// @route   POST /api/assets/upload
// @access  Private
exports.uploadAsset = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'res.t('auto.e8afb7e9')' });
      }

      const { name, description, category, tags } = req.body;
      const filePath = req.file.path;
      
      // res.t('auto.e9aa8ce8')
      if (!name || !category) {
        await fs.unlink(filePath); // res.t('auto.e588a0e9')
        return res.status(400).json({ message: 'res.t('auto.e5908de7')' });
      }

      // 二次 MIME 检测防伪造
      const detected = await FileType.fromFile(filePath);
      if (detected && detected.mime !== req.file.mimetype) {
        await fs.unlink(filePath);
        return res.status(400).json({ message:`文件内容与声明类型不匹配 (${detected.mime} ≠ ${req.file.mimetype})` });
      }

      // 计算文件哈希
      const fileHash = await calculateFileHash(filePath);
      
      // res.t('auto.e6a380e6')
      const existingAsset = await Asset.findByHash(fileHash);
      if (existingAsset) {
        await fs.unlink(filePath); // res.t('auto.e588a0e9')
        return res.status(409).json({ 
          message: 'res.t('auto.e69687e4')',
          existingAsset: existingAsset._id
        });
      }

      // res.t('auto.e88eb7e5')
      let metadata = {};
      if (req.file.mimetype.startsWith('image/')) {
        metadata = await getImageMetadata(filePath);
        
        // res.t('auto.e7949fe6') - res.t('auto.e4bdbfe7')pathres.t('auto.e6a8a1e5')
        const thumbnailPath = path.join(
          path.dirname(filePath),
          path.basename(filePath, path.extname(filePath)) + '_thumb' + path.extname(filePath)
        );
        await generateThumbnail(filePath, thumbnailPath);
      }

      // res.t('auto.e5889be5')
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

      uploadSizeHistogram.observe(req.file.size);

      logger.info(`素材上传成功: ${asset._id}`, {
        userId: req.user?.id,
        fileName: req.file.originalname,
        fileSize: req.file.size
      });

      res.status(201).json({
        message: 'res.t('auto.e7b4a0e6')',
        data: asset
      });

    } catch (error) {
      logger.error('res.t('auto.e7b4a0e6'):', error);
      
      // res.t('auto.e6b885e7')
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          logger.error('res.t('auto.e6b885e7'):', cleanupError);
        }
      }

      res.status(500).json({ message: 'res.t('auto.e7b4a0e6')' });
    }
  }
];

// @desc    res.t('auto.e88eb7e5')
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

    // res.t('auto.e69e84e5')
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

    // res.t('auto.e58886e9')
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // res.t('auto.e68e92e5')
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // res.t('auto.e689a7e8')
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
    logger.error('res.t('auto.e88eb7e5'):', error);
    res.status(500).json({ message: 'res.t('auto.e88eb7e5')' });
  }
};

// @desc    res.t('auto.e88eb7e5')
// @route   GET /api/assets/:id
// @access  Private
exports.getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('parentAssetId', 'name version')
      .select('-fileHash');

    if (!asset) {
      return res.status(404).json({ message: 'res.t('auto.e7b4a0e6')' });
    }

    // res.t('auto.e6a087e8')
    await asset.markAsUsed();

    res.json({ data: asset });

  } catch (error) {
    logger.error('res.t('auto.e88eb7e5'):', error);
    res.status(500).json({ message: 'res.t('auto.e88eb7e5')' });
  }
};

// @desc    res.t('auto.e69bb4e6')
// @route   PUT /api/assets/:id
// @access  Private
exports.updateAsset = async (req, res) => {
  try {
    const { name, description, category, tags, status, visibility } = req.body;
    
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'res.t('auto.e7b4a0e6')' });
    }

    // res.t('auto.e69bb4e6')
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

    logger.info(`res.t('auto.e7b4a0e6'): ${asset._id}`, {
      userId: req.user?.id,
      changes: req.body
    });

    res.json({
      message: 'res.t('auto.e7b4a0e6')',
      data: asset
    });

  } catch (error) {
    logger.error('res.t('auto.e69bb4e6'):', error);
    res.status(500).json({ message: 'res.t('auto.e69bb4e6')' });
  }
};

// @desc    res.t('auto.e588a0e9')
// @route   DELETE /api/assets/:id
// @access  Private
exports.deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'res.t('auto.e7b4a0e6')' });
    }

    // res.t('auto.e6a380e6')
    if (asset.gameConfigReferences && asset.gameConfigReferences.length > 0) {
      return res.status(400).json({ 
        message: 'res.t('auto.e7b4a0e6')，res.t('auto.e697a0e6')',
        references: asset.gameConfigReferences
      });
    }

    // res.t('auto.e8bdafe5')：res.t('auto.e6a087e8')
    asset.status = 'deleted';
    asset.updatedBy = req.user?.id || 'system';
    await asset.save();

    logger.info(`res.t('auto.e7b4a0e6'): ${asset._id}`, {
      userId: req.user?.id,
      fileName: asset.fileName
    });

    res.json({ message: 'res.t('auto.e7b4a0e6')' });

  } catch (error) {
    logger.error('res.t('auto.e588a0e9'):', error);
    res.status(500).json({ message: 'res.t('auto.e588a0e9')' });
  }
};

// @desc    res.t('auto.e88eb7e5')
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
    logger.error('res.t('auto.e88eb7e5'):', error);
    res.status(500).json({ message: 'res.t('auto.e88eb7e5')' });
  }
};

// @desc    res.t('auto.e689b9e9')
// @route   POST /api/assets/batch
// @access  Private
exports.batchOperateAssets = async (req, res) => {
  try {
    const { assetIds, operation, data } = req.body;
    
    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return res.status(400).json({ message: 'res.t('auto.e8afb7e9')' });
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
        return res.status(400).json({ message: 'res.t('auto.e4b88de6')' });
    }

    logger.info(`res.t('auto.e689b9e9'): ${operation}`, {
      userId: req.user?.id,
      assetCount: assetIds.length,
      operation,
      data
    });

    res.json({
      message: 'res.t('auto.e689b9e9')',
      affectedCount: result.modifiedCount
    });

  } catch (error) {
    logger.error('res.t('auto.e689b9e9'):', error);
    res.status(500).json({ message: 'res.t('auto.e689b9e9')' });
  }
};

// ---------------- 文件分片上传 -----------------
const chunkDirRoot = path.join(__dirname, '../uploads/chunks');

// 保存切片
exports.uploadChunk = [
  multer({ storage, limits:{fileSize: 10*1024*1024}}).single('chunk'),
  async (req,res)=>{
    try{
      const { fileHash, chunkIndex } = req.body;
      if(!fileHash || chunkIndex===undefined) return res.status(400).json({ message:'fileHash 和 chunkIndex 必填'});
      const dir = path.join(chunkDirRoot, fileHash);
      await fs.mkdir(dir, { recursive:true });
      const chunkPath = path.join(dir, `${chunkIndex}`);
      await fs.rename(req.file.path, chunkPath);
      res.json({ message:'chunk uploaded' });
    }catch(err){
      logger.error('上传分片失败: %s', err.message);
      res.status(500).json({ message:'上传分片失败' });
    }
  }
];

// 合并切片
exports.mergeChunks = async (req,res)=>{
  try{
    const { fileHash, totalChunks, fileName } = req.body;
    if(!fileHash || !totalChunks || !fileName) return res.status(400).json({ message:'fileHash, totalChunks, fileName 必填'});
    const dir = path.join(chunkDirRoot, fileHash);
    const chunks = await fs.readdir(dir);
    if(chunks.length !== parseInt(totalChunks)) return res.status(400).json({ message:'缺少部分分片'});
    const ext = path.extname(fileName);
    const finalPath = path.join(__dirname, '../uploads', `${fileHash}${ext}`);
    const writeStream = require('fs').createWriteStream(finalPath);
    for(let i=0;i<totalChunks;i++){
      const chunkPath = path.join(dir, `${i}`);
      const data = await fs.readFile(chunkPath);
      writeStream.write(data);
    }
    writeStream.end();
    writeStream.on('finish', async ()=>{
      // 清理分片目录
      await fs.rm(dir, { recursive:true, force:true });
      res.json({ message:'文件合并完成', url:`/uploads/${path.basename(finalPath)}` });
    });
  }catch(err){
    logger.error('合并分片失败: %s', err.message);
    res.status(500).json({ message:'合并分片失败'});
  }
};

module.exports = {
  uploadAsset: exports.uploadAsset,
  getAssets: exports.getAssets,
  getAssetById: exports.getAssetById,
  updateAsset: exports.updateAsset,
  deleteAsset: exports.deleteAsset,
  getAssetStats: exports.getAssetStats,
  batchOperateAssets: exports.batchOperateAssets,
  uploadChunk: exports.uploadChunk,
  mergeChunks: exports.mergeChunks
};