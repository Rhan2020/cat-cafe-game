const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * SpecialVisitorEvent - 寓言化社会访客随机事件
 * 参考 GDD 第 4.8 节
 */
const SpecialVisitorEventSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  // 配置中的 visitorId
  visitorId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },

  // 访客状态
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'expired']
  },

  // 触发时间 & 过期时间
  triggeredAt: { type: Date, required: true },
  expiredAt: { type: Date, required: true },
  completedAt: { type: Date },

  // 选择信息
  choices: [{
    id: String,
    text: String,
    outcomes: [{ probability: Number, result: Object }]
  }],
  selectedChoice: String,
  result: Object,

  // 记录奖励/纪念品等
  rewards: Object,

  createdAt: { type: Date, default: Date.now }
});

SpecialVisitorEventSchema.index({ ownerId: 1, status: 1 });
SpecialVisitorEventSchema.index({ expiredAt: 1 });

module.exports = mongoose.model('SpecialVisitorEvent', SpecialVisitorEventSchema);