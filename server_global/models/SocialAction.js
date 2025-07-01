const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SocialActionSchema = new Schema({
  // res.t('auto.e794a8e6')
  fromUserId: { type: String, required: true }, // res.t('auto.e58f91e8')ID
  toUserId: { type: String, required: true },   // res.t('auto.e79baee6')ID
  
  // res.t('auto.e8a18ce4')
  actionType: { 
    type: String, 
    required: true,
    enum: ['help_delivery', 'hire_animal', 'gift_item', 'fishing_invitation', 'friend_contract']
  },
  
  // res.t('auto.e585b3e8')
  relatedId: { type: String, required: true }, // res.t('auto.e585b3e8')ID
  
  // res.t('auto.e78ab6e6')
  status: { 
    type: String, 
    required: true,
    enum: ['pending', 'completed', 'expired', 'rejected']
  },
  
  // res.t('auto.e5a596e5')
  reward: {
    gold: { type: Number, default: 0 },
    gems: { type: Number, default: 0 },
    items: [{ 
      itemId: String, 
      count: Number 
    }],
    experience: { type: Number, default: 0 }
  },
  
  // res.t('auto.e697b6e9')
  createdAt: { type: Date, default: Date.now },
  expiredAt: { type: Date },
  completedAt: { type: Date },
  
  // res.t('auto.e7bb93e6')
  result: { type: Object },
  
  // res.t('auto.e9a29de5')
  metadata: { type: Object, default: {} }
});

// res.t('auto.e6b7bbe5')
SocialActionSchema.index({ fromUserId: 1 });
SocialActionSchema.index({ toUserId: 1 });
SocialActionSchema.index({ toUserId: 1, status: 1 });
SocialActionSchema.index({ createdAt: -1 });
SocialActionSchema.index({ expiredAt: 1 });

// res.t('auto.e8999ae6')：res.t('auto.e698afe5')
SocialActionSchema.virtual('isExpired').get(function() {
  return this.status === 'pending' && 
         this.expiredAt && 
         new Date() > this.expiredAt;
});

const SocialAction = mongoose.model('SocialAction', SocialActionSchema);

module.exports = SocialAction;