const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getCache, setCache } = require('../utils/cache');

const GameConfigSchema = new Schema({
  // 配置类型
  configType: { 
    type: String, 
    required: true,
    unique: true,
    enum: [
      'animal_breeds', 'posts', 'items', 'skills', 
      'delivery_events', 'level_up_exp', 'wheel_rewards', 
      'startup_scenarios', 'fish_types', 'global_settings'
    ]
  },
  
  // 配置版本
  version: { type: String, required: true },
  
  // 配置数据
  data: { type: Schema.Types.Mixed, required: true },
  
  // 生效时间
  effectiveFrom: { type: Date, default: Date.now },
  effectiveTo: { type: Date },
  
  // 状态
  isActive: { type: Boolean, default: true },
  
  // 创建和更新信息
  createdBy: { type: String, required: true }, // 管理员ID
  updatedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // 备注
  description: { type: String },
  changeLog: [{ 
    timestamp: { type: Date, default: Date.now },
    adminId: String,
    action: String,
    details: String
  }]
});

// 添加索引
GameConfigSchema.index({ configType: 1 });
GameConfigSchema.index({ isActive: 1 });
GameConfigSchema.index({ effectiveFrom: 1, effectiveTo: 1 });

// 静态方法：获取有效配置
GameConfigSchema.statics.getActiveConfig = async function(configType) {
  const cacheKey = `gameConfig:${configType}`;
  const cached = await getCache(cacheKey);
  if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached;

  const now = new Date();
  const doc = await this.findOne({
    configType,
    isActive: true,
    effectiveFrom: { $lte: now },
    $or: [
      { effectiveTo: { $exists: false } },
      { effectiveTo: null },
      { effectiveTo: { $gt: now } }
    ]
  });
  if (doc) await setCache(cacheKey, doc.toObject(), 300);
  return doc;
};

const GameConfig = mongoose.model('GameConfig', GameConfigSchema);

module.exports = GameConfig;