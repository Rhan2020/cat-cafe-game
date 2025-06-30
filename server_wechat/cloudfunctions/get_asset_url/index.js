const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

/**
 * 获取素材URL，支持按分类、标签等筛选
 * 返回CDN URL用于客户端加载
 * 
 * @param {Object} event - 事件参数
 * @param {string} event.category - 素材分类 (可选)
 * @param {string} event.tags - 标签列表，逗号分隔 (可选)
 * @param {string} event.assetId - 特定素材ID (可选)
 * @param {string} event.configType - 配置类型，如 'animal_breeds' (可选)
 * @param {string} event.configId - 配置ID (可选)
 * @returns {Promise<Object>} - 包含素材信息的结果对象
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    return { code: 401, message: 'User not authenticated.' };
  }

  const { category, tags, assetId, configType, configId } = event;

  try {
    let query = db.collection('assets').where({
      status: 'active',
      visibility: db.command.in(['public', 'internal'])
    });

    // 根据不同参数构建查询
    if (assetId) {
      // 获取特定素材
      const result = await query.where({ _id: assetId }).get();
      
      if (result.data.length === 0) {
        return { code: 404, message: 'Asset not found.' };
      }

      const asset = result.data[0];
      
      // 增加使用计数
      await db.collection('assets').doc(assetId).update({
        data: {
          usageCount: db.command.inc(1),
          lastUsedAt: new Date()
        }
      });

      return {
        code: 200,
        data: {
          _id: asset._id,
          name: asset.name,
          category: asset.category,
          originalUrl: asset.originalUrl,
          cdnUrl: asset.cdnUrl,
          thumbnailUrl: asset.thumbnailUrl,
          compressedUrl: asset.compressedUrl,
          metadata: asset.metadata,
          tags: asset.tags
        }
      };
    }

    // 按分类筛选
    if (category) {
      query = query.where({ category });
    }

    // 按标签筛选
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query = query.where({
        tags: db.command.in(tagArray)
      });
    }

    // 按配置关联筛选
    if (configType) {
      query = query.where({
        'gameConfigReferences.configType': configType
      });
      
      if (configId) {
        query = query.where({
          'gameConfigReferences.configId': configId
        });
      }
    }

    // 执行查询，按创建时间排序
    const result = await query
      .orderBy('createdAt', 'desc')
      .limit(50) // 限制返回数量，避免数据过大
      .get();

    // 格式化返回数据，只返回客户端需要的字段
    const assets = result.data.map(asset => ({
      _id: asset._id,
      name: asset.name,
      category: asset.category,
      originalUrl: asset.originalUrl,
      cdnUrl: asset.cdnUrl,
      thumbnailUrl: asset.thumbnailUrl,
      compressedUrl: asset.compressedUrl,
      metadata: asset.metadata,
      tags: asset.tags
    }));

    return {
      code: 200,
      data: assets,
      total: result.data.length
    };

  } catch (error) {
    logger.error('Error getting asset URLs:', error);
    return {
      code: 500,
      message: 'Internal server error.'
    };
  }
};