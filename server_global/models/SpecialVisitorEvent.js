const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * SpecialVisitorEvent - res.t('auto.e5af93e8')
 * res.t('auto.e58f82e8') GDD 第 4.8 节
 */
const SpecialVisitorEventSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  // res.t('auto.e9858de7') visitorId
  visitorId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },

  // res.t('auto.e8aebfe5')
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'expired']
  },

  // res.t('auto.e8a7a6e5') & res.t('auto.e8bf87e6')
  triggeredAt: { type: Date, required: true },
  expiredAt: { type: Date, required: true },
  completedAt: { type: Date },

  // res.t('auto.e98089e6')
  choices: [{
    id: String,
    text: String,
    outcomes: [{ probability: Number, result: Object }]
  }],
  selectedChoice: String,
  result: Object,

  // res.t('auto.e8aeb0e5')/res.t('auto.e7baaae5')
  rewards: Object,

  createdAt: { type: Date, default: Date.now }
});

SpecialVisitorEventSchema.index({ ownerId: 1, status: 1 });
SpecialVisitorEventSchema.index({ expiredAt: 1 });

module.exports = mongoose.model('SpecialVisitorEvent', SpecialVisitorEventSchema);