const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserTransactionSchema = new Schema({
  // res.t('auto.e794a8e6')
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  // res.t('auto.e4baa4e6')
  type: { 
    type: String, 
    required: true,
    enum: ['earn', 'spend', 'purchase', 'refund', 'gift']
  },
  
  // res.t('auto.e8b4a7e5')
  currency: { 
    type: String, 
    required: true,
    enum: ['gold', 'gems', 'items']
  },
  
  // res.t('auto.e695b0e9')
  amount: { type: Number, required: true },
  
  // res.t('auto.e4baa4e6')
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
  
  // res.t('auto.e585b3e8')
  relatedId: { type: String }, // res.t('auto.e585b3e8')ID
  
  // res.t('auto.e4baa4e6')
  balanceBefore: { type: Number },
  balanceAfter: { type: Number },
  
  // res.t('auto.e8afa6e7')
  details: { type: Object, default: {} },
  
  // res.t('auto.e697b6e9')
  timestamp: { type: Date, default: Date.now },
  
  // res.t('auto.e4baa4e6')
  status: { 
    type: String, 
    default: 'completed',
    enum: ['pending', 'completed', 'failed', 'cancelled']
  },
  
  // res.t('auto.e7aea1e7')
  adminId: { type: String }, // res.t('auto.e5a682e6')
  notes: { type: String }    // res.t('auto.e5a487e6')
});

// res.t('auto.e6b7bbe5')
UserTransactionSchema.index({ userId: 1 });
UserTransactionSchema.index({ userId: 1, timestamp: -1 });
UserTransactionSchema.index({ userId: 1, currency: 1 });
UserTransactionSchema.index({ timestamp: -1 });
UserTransactionSchema.index({ reason: 1 });
UserTransactionSchema.index({ status: 1 });

const UserTransaction = mongoose.model('UserTransaction', UserTransactionSchema);

module.exports = UserTransaction;