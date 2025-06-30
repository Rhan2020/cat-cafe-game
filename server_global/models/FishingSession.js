const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FishingSessionSchema = new Schema({
  // 基础信息
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  animalIds: [{ type: Schema.Types.ObjectId, ref: 'Animal', required: true }],
  
  // 协作者
  collaborators: [{ type: String }], // 好友ID列表
  
  // 时间信息
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  completedAt: { type: Date },
  baseDuration: { type: Number, required: true }, // 基础钓鱼时长（毫秒）
  
  // 状态
  status: { 
    type: String, 
    required: true,
    enum: ['active', 'completed', 'cancelled']
  },
  
  // 钓鱼配置
  baitUsed: { type: String }, // 使用的鱼饵ID
  luckBonus: { type: Number, default: 1.0 }, // 幸运加成
  
  // 收获
  catches: [{
    itemId: { type: String, required: true },
    name: { type: String, required: true },
    rarity: { type: String, required: true },
    count: { type: Number, required: true }
  }],
  
  // 创建时间
  createdAt: { type: Date, default: Date.now }
});

// 添加索引
FishingSessionSchema.index({ ownerId: 1 });
FishingSessionSchema.index({ ownerId: 1, status: 1 });
FishingSessionSchema.index({ collaborators: 1 });
FishingSessionSchema.index({ createdAt: -1 });
FishingSessionSchema.index({ endTime: 1 });

// 虚拟字段：是否可以收取
FishingSessionSchema.virtual('canCollect').get(function() {
  return this.status === 'active' && new Date() >= this.endTime;
});

// 虚拟字段：剩余时间
FishingSessionSchema.virtual('remainingTime').get(function() {
  if (this.status !== 'active') return 0;
  const remaining = this.endTime.getTime() - Date.now();
  return Math.max(0, remaining);
});

const FishingSession = mongoose.model('FishingSession', FishingSessionSchema);

module.exports = FishingSession;