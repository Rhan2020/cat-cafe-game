const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SocialActionSchema = new Schema({
  // 用户信息
  fromUserId: { type: String, required: true }, // 发起用户ID
  toUserId: { type: String, required: true },   // 目标用户ID
  
  // 行为类型
  actionType: { 
    type: String, 
    required: true,
    enum: ['help_delivery', 'hire_animal', 'gift_item', 'fishing_invitation', 'friend_contract']
  },
  
  // 关联对象
  relatedId: { type: String, required: true }, // 关联的对象ID
  
  // 状态
  status: { 
    type: String, 
    required: true,
    enum: ['pending', 'completed', 'expired', 'rejected']
  },
  
  // 奖励信息
  reward: {
    gold: { type: Number, default: 0 },
    gems: { type: Number, default: 0 },
    items: [{ 
      itemId: String, 
      count: Number 
    }],
    experience: { type: Number, default: 0 }
  },
  
  // 时间信息
  createdAt: { type: Date, default: Date.now },
  expiredAt: { type: Date },
  completedAt: { type: Date },
  
  // 结果
  result: { type: Object },
  
  // 额外数据
  metadata: { type: Object, default: {} }
});

// 添加索引
SocialActionSchema.index({ fromUserId: 1 });
SocialActionSchema.index({ toUserId: 1 });
SocialActionSchema.index({ toUserId: 1, status: 1 });
SocialActionSchema.index({ createdAt: -1 });
SocialActionSchema.index({ expiredAt: 1 });

// 虚拟字段：是否过期
SocialActionSchema.virtual('isExpired').get(function() {
  return this.status === 'pending' && 
         this.expiredAt && 
         new Date() > this.expiredAt;
});

const SocialAction = mongoose.model('SocialAction', SocialActionSchema);

module.exports = SocialAction;