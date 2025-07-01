const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getCache, setCache } = require('../utils/cache');

const GameConfigSchema = new Schema({
  // res.t('auto.e9858de7')
  configType: { 
    type: String, 
    required: true,
    unique: true,
    enum: [
      'animal_breeds', 'posts', 'items', 'skills', 
      'delivery_events', 'level_up_exp', 'wheel_rewards', 
      'startup_scenarios', 'fish_types', 'global_settings',
      'facility_upgrades'
    ]
  },
  
  // res.t('auto.e9858de7')
  version: { type: String, required: true },
  
  // res.t('auto.e9858de7')
  data: { type: Schema.Types.Mixed, required: true },
  
  // res.t('auto.e7949fe6')
  effectiveFrom: { type: Date, default: Date.now },
  effectiveTo: { type: Date },
  
  // res.t('auto.e78ab6e6')
  isActive: { type: Boolean, default: true },
  
  // res.t('auto.e5889be5')
  createdBy: { type: String, required: true }, // res.t('auto.e7aea1e7')ID
  updatedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // res.t('auto.e5a487e6')
  description: { type: String },
  changeLog: [{ 
    timestamp: { type: Date, default: Date.now },
    adminId: String,
    action: String,
    details: String
  }]
});

// res.t('auto.e6b7bbe5')
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