const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  // res.t('auto.e8aea4e8')
  authProviderId: { type: String, required: true, unique: true }, // Google ID, Apple ID, etc.
  authProvider: { type: String, required: true }, // 'google', 'apple', 'twitter', etc.
  
  // res.t('auto.e59fbae7')
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: Date.now },
  nickname: { type: String, required: true },
  avatarUrl: { type: String, default: '' },
  
  // 离线相关
  lastActiveAt: { type: Date, default: Date.now }, // 上次活跃时间
  offlineEarnings: { type: Number, default: 0 },   // 累积离线收益（金币），待玩家领取
  
  // 游戏货币
  gold: { type: Number, default: 1000 },
  gems: { type: Number, default: 100 },
  
  // res.t('auto.e98193e5')
  inventory: { type: Object, default: {} },
  
  // res.t('auto.e794a8e6')
  settings: { 
    type: Object, 
    default: { 
      music: 1, 
      sound: 1, 
      language: 'en',
      notifications: true 
    } 
  },

  // res.t('auto.e5bc80e5')
  debut: {
    scenarioId: { type: String, default: '' },
    type: { type: String, default: 'N' },
    description: { type: String, default: '' },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    rewards: { type: Object, default: {} }
  },

  // res.t('auto.e5ba97e9')
  shop: {
    level: { type: Number, default: 1 },
    posts: [{ type: String }],
    facilities: { type: Object, default: {} }
  },

  // res.t('auto.e6b894e5')
  fishing: {
    level: { type: Number, default: 1 },
    totalSessions: { type: Number, default: 0 },
    totalCatches: { type: Number, default: 0 },
    lastFishingTime: { type: Date }
  },

  // res.t('auto.e6af8fe6')
  dailyData: {
    wheelSpins: { type: Number, default: 0 },
    adWheelSpins: { type: Number, default: 0 },
    freeSpinUsed: { type: Boolean, default: false },
    lastWheelReset: { type: String, default: '' }
  },

  // res.t('auto.e5a5bde5')
  friends: [{ type: String }],

  // res.t('auto.e68890e5')
  achievements: [{ type: String }],

  // res.t('auto.e7bb9fe8')
  statistics: {
    totalEarnings: { type: Number, default: 0 },
    animalsCollected: { type: Number, default: 0 },
    totalRecruitments: { type: Number, default: 0 },
    deliveryEventsCompleted: { type: Number, default: 0 }
  },

  // res.t('auto.e580bae5')（res.t('auto.e59cb0e7')）
  debt: { type: Number, default: 0 },

  // res.t('auto.e8b4a6e6')
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: '' }
});

// res.t('auto.e6b7bbe5')
UserSchema.index({ authProviderId: 1, authProvider: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastLoginAt: -1 });
UserSchema.index({ lastActiveAt: -1 });

const User = mongoose.model('User', UserSchema);

module.exports = User; 