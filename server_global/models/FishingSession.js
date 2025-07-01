const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FishingSessionSchema = new Schema({
  // res.t('auto.e59fbae7')
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  animalIds: [{ type: Schema.Types.ObjectId, ref: 'Animal', required: true }],
  
  // res.t('auto.e58d8fe4')
  collaborators: [{ type: String }], // res.t('auto.e5a5bde5')IDres.t('auto.e58897e8')
  
  // res.t('auto.e697b6e9')
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  completedAt: { type: Date },
  baseDuration: { type: Number, required: true }, // res.t('auto.e59fbae7')（res.t('auto.e6afabe7')）
  
  // res.t('auto.e78ab6e6')
  status: { 
    type: String, 
    required: true,
    enum: ['active', 'completed', 'cancelled']
  },
  
  // res.t('auto.e99293e9')
  baitUsed: { type: String }, // res.t('auto.e4bdbfe7')ID
  luckBonus: { type: Number, default: 1.0 }, // res.t('auto.e5b9b8e8')
  
  // res.t('auto.e694b6e8')
  catches: [{
    itemId: { type: String, required: true },
    name: { type: String, required: true },
    rarity: { type: String, required: true },
    count: { type: Number, required: true }
  }],
  
  // res.t('auto.e5889be5')
  createdAt: { type: Date, default: Date.now }
});

// res.t('auto.e6b7bbe5')
FishingSessionSchema.index({ ownerId: 1 });
FishingSessionSchema.index({ ownerId: 1, status: 1 });
FishingSessionSchema.index({ collaborators: 1 });
FishingSessionSchema.index({ createdAt: -1 });
FishingSessionSchema.index({ endTime: 1 });

// res.t('auto.e8999ae6')：res.t('auto.e698afe5')
FishingSessionSchema.virtual('canCollect').get(function() {
  return this.status === 'active' && new Date() >= this.endTime;
});

// res.t('auto.e8999ae6')：res.t('auto.e589a9e4')
FishingSessionSchema.virtual('remainingTime').get(function() {
  if (this.status !== 'active') return 0;
  const remaining = this.endTime.getTime() - Date.now();
  return Math.max(0, remaining);
});

const FishingSession = mongoose.model('FishingSession', FishingSessionSchema);

module.exports = FishingSession;