const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AnimalSchema = new Schema({
  // 基础信息
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  species: { type: String, required: true }, // "cat", "dog", "hamster"
  breedId: { type: String, required: true }, // e.g., "cat_001"
  name: { type: String, required: true },
  
  // 等级和经验
  level: { type: Number, default: 1 },
  exp: { type: Number, default: 0 },
  
  // 状态信息
  status: { 
    type: String, 
    default: 'idle', 
    enum: ['idle', 'working', 'fishing', 'delivery'] 
  },
  assignedPost: { type: String, default: '' },
  
  // 技能系统
  skills: [{ type: String }],
  
  // 属性系统
  attributes: {
    speed: { type: Number, default: 5 },
    luck: { type: Number, default: 1 },
    cooking: { type: Number, default: 3 },
    charm: { type: Number, default: 2 },
    stamina: { type: Number, default: 10 }
  },

  // 状态值
  fatigue: { type: Number, default: 0, min: 0, max: 100 },
  mood: { type: Number, default: 100, min: 0, max: 100 },

  // 外观
  outfit: { type: String, default: '' },

  // 契约信息（好友邀请获得的动物）
  contractInfo: {
    fromFriend: { type: String },
    contractType: { type: String },
    createdAt: { type: Date }
  },

  // 负面效果
  debuffs: { type: Object, default: {} },

  // 招募信息
  recruitedFrom: { 
    type: String, 
    default: 'initial',
    enum: ['initial', 'single', 'ten_pull', 'event', 'friend_contract']
  },

  // 时间戳
  createdAt: { type: Date, default: Date.now },
  lastWorkedAt: { type: Date },
  
  // 统计数据
  statistics: {
    totalWorkTime: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    deliveriesCompleted: { type: Number, default: 0 },
    fishingSessionsCompleted: { type: Number, default: 0 }
  }
});

// 添加索引
AnimalSchema.index({ ownerId: 1 });
AnimalSchema.index({ ownerId: 1, status: 1 });
AnimalSchema.index({ ownerId: 1, species: 1 });
AnimalSchema.index({ createdAt: -1 });

// 虚拟字段：是否可以工作
AnimalSchema.virtual('canWork').get(function() {
  return this.status === 'idle' && this.fatigue < 90;
});

// 虚拟字段：总战力
AnimalSchema.virtual('totalPower').get(function() {
  return this.attributes.speed + this.attributes.luck + 
         this.attributes.cooking + this.attributes.charm + 
         this.attributes.stamina;
});

// 实例方法：升级
AnimalSchema.methods.levelUp = function(expGain) {
  this.exp += expGain;
  // 升级逻辑可以在这里实现
  return this.save();
};

// 实例方法：恢复疲劳
AnimalSchema.methods.rest = function(restTime) {
  const fatigueReduction = Math.min(this.fatigue, Math.floor(restTime / 60000)); // 每分钟恢复1点疲劳
  this.fatigue = Math.max(0, this.fatigue - fatigueReduction);
  this.mood = Math.min(100, this.mood + Math.floor(fatigueReduction / 2)); // 休息时恢复心情
  return this.save();
};

const Animal = mongoose.model('Animal', AnimalSchema);

module.exports = Animal; 