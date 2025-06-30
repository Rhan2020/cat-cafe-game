const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserTransactionSchema = new Schema({
  // 用户信息
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  // 交易类型
  type: { 
    type: String, 
    required: true,
    enum: ['earn', 'spend', 'purchase', 'refund', 'gift']
  },
  
  // 货币类型
  currency: { 
    type: String, 
    required: true,
    enum: ['gold', 'gems', 'items']
  },
  
  // 数量
  amount: { type: Number, required: true },
  
  // 交易原因
  reason: { 
    type: String, 
    required: true,
    enum: [
      'offline_earnings', 'animal_upgrade', 'delivery_event_result',
      'fishing_reward', 'fishing_collaboration_reward', 'friend_help_reward',
      'daily_wheel_reward', 'animal_recruitment', 'shop_purchase',
      'admin_grant', 'compensation'
    ]
  },
  
  // 关联对象
  relatedId: { type: String }, // 关联的对象ID
  
  // 交易前后余额
  balanceBefore: { type: Number },
  balanceAfter: { type: Number },
  
  // 详细信息
  details: { type: Object, default: {} },
  
  // 时间戳
  timestamp: { type: Date, default: Date.now },
  
  // 交易状态
  status: { 
    type: String, 
    default: 'completed',
    enum: ['pending', 'completed', 'failed', 'cancelled']
  },
  
  // 管理员相关
  adminId: { type: String }, // 如果是管理员操作
  notes: { type: String }    // 备注
});

// 添加索引
UserTransactionSchema.index({ userId: 1 });
UserTransactionSchema.index({ userId: 1, timestamp: -1 });
UserTransactionSchema.index({ userId: 1, currency: 1 });
UserTransactionSchema.index({ timestamp: -1 });
UserTransactionSchema.index({ reason: 1 });
UserTransactionSchema.index({ status: 1 });

const UserTransaction = mongoose.model('UserTransaction', UserTransactionSchema);

module.exports = UserTransaction;