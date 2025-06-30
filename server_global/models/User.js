const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  // 认证相关
  authProviderId: { type: String, required: true, unique: true }, // Google ID, Apple ID, etc.
  authProvider: { type: String, required: true }, // 'google', 'apple', 'twitter', etc.
  
  // 基础信息
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
  
  // 道具仓库
  inventory: { type: Object, default: {} },
  
  // 用户设置
  settings: { 
    type: Object, 
    default: { 
      music: 1, 
      sound: 1, 
      language: 'en',
      notifications: true 
    } 
  },

  // 开局信息
  debut: {
    scenarioId: { type: String, default: '' },
    type: { type: String, default: 'N' },
    description: { type: String, default: '' },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    rewards: { type: Object, default: {} }
  },

  // 店铺信息
  shop: {
    level: { type: Number, default: 1 },
    posts: [{ type: String }],
    facilities: { type: Object, default: {} }
  },

  // 渔场数据
  fishing: {
    level: { type: Number, default: 1 },
    totalSessions: { type: Number, default: 0 },
    totalCatches: { type: Number, default: 0 },
    lastFishingTime: { type: Date }
  },

  // 每日数据
  dailyData: {
    wheelSpins: { type: Number, default: 0 },
    adWheelSpins: { type: Number, default: 0 },
    freeSpinUsed: { type: Boolean, default: false },
    lastWheelReset: { type: String, default: '' }
  },

  // 好友列表
  friends: [{ type: String }],

  // 成就列表
  achievements: [{ type: String }],

  // 统计数据
  statistics: {
    totalEarnings: { type: Number, default: 0 },
    animalsCollected: { type: Number, default: 0 },
    totalRecruitments: { type: Number, default: 0 },
    deliveryEventsCompleted: { type: Number, default: 0 }
  },

  // 债务（地狱开局）
  debt: { type: Number, default: 0 },

  // 账户状态
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: '' }
});

// 添加索引
UserSchema.index({ authProviderId: 1, authProvider: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastLoginAt: -1 });
UserSchema.index({ lastActiveAt: -1 });

const User = mongoose.model('User', UserSchema);

module.exports = User; 