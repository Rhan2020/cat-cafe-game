const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DeliveryEventSchema = new Schema({
  // 基础信息
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  animalId: { type: Schema.Types.ObjectId, ref: 'Animal', required: true },
  
  // 事件类型
  eventType: { 
    type: String, 
    required: true,
    enum: ['normal_delivery', 'random_event']
  },
  eventId: { type: String }, // 具体事件ID（配置表中的事件）
  
  // 状态
  status: { 
    type: String, 
    required: true,
    enum: ['in_progress', 'waiting_choice', 'completed', 'failed']
  },
  
  // 时间信息
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  completedAt: { type: Date },
  
  // 选择相关（随机事件）
  choices: [{ 
    id: String,
    text: String,
    outcomes: [{
      probability: Number,
      result: Object
    }]
  }],
  selectedChoice: { type: String },
  choiceTimeout: { type: Date },
  timeoutAction: { type: String },
  
  // 结果
  result: {
    method: String, // 'completed', 'friend_help', 'timeout', etc.
    goldReward: { type: Number, default: 0 },
    goldLoss: { type: Number, default: 0 },
    itemReward: String,
    message: String,
    experience: { type: Number, default: 0 }
  },
  
  // 创建时间
  createdAt: { type: Date, default: Date.now }
});

// 添加索引
DeliveryEventSchema.index({ ownerId: 1 });
DeliveryEventSchema.index({ ownerId: 1, status: 1 });
DeliveryEventSchema.index({ animalId: 1 });
DeliveryEventSchema.index({ createdAt: -1 });
DeliveryEventSchema.index({ endTime: 1 });

// 虚拟字段：是否过期
DeliveryEventSchema.virtual('isExpired').get(function() {
  return this.status === 'waiting_choice' && 
         this.choiceTimeout && 
         new Date() > this.choiceTimeout;
});

// 虚拟字段：是否完成
DeliveryEventSchema.virtual('isCompleted').get(function() {
  return ['completed', 'failed'].includes(this.status);
});

const DeliveryEvent = mongoose.model('DeliveryEvent', DeliveryEventSchema);

module.exports = DeliveryEvent;