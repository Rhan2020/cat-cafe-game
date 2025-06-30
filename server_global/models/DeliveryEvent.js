const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DeliveryEventSchema = new Schema({
  // res.t('auto.e59fbae7')
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  animalId: { type: Schema.Types.ObjectId, ref: 'Animal', required: true },
  
  // res.t('auto.e4ba8be4')
  eventType: { 
    type: String, 
    required: true,
    enum: ['normal_delivery', 'random_event']
  },
  eventId: { type: String }, // res.t('auto.e585b7e4')ID（res.t('auto.e9858de7')）
  
  // res.t('auto.e78ab6e6')
  status: { 
    type: String, 
    required: true,
    enum: ['in_progress', 'waiting_choice', 'completed', 'failed']
  },
  
  // res.t('auto.e697b6e9')
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  completedAt: { type: Date },
  
  // res.t('auto.e98089e6')（res.t('auto.e99a8fe6')）
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
  
  // res.t('auto.e7bb93e6')
  result: {
    method: String, // 'completed', 'friend_help', 'timeout', etc.
    goldReward: { type: Number, default: 0 },
    goldLoss: { type: Number, default: 0 },
    itemReward: String,
    message: String,
    experience: { type: Number, default: 0 }
  },
  
  // res.t('auto.e5889be5')
  createdAt: { type: Date, default: Date.now }
});

// res.t('auto.e6b7bbe5')
DeliveryEventSchema.index({ ownerId: 1 });
DeliveryEventSchema.index({ ownerId: 1, status: 1 });
DeliveryEventSchema.index({ animalId: 1 });
DeliveryEventSchema.index({ createdAt: -1 });
DeliveryEventSchema.index({ endTime: 1 });

// res.t('auto.e8999ae6')：res.t('auto.e698afe5')
DeliveryEventSchema.virtual('isExpired').get(function() {
  return this.status === 'waiting_choice' && 
         this.choiceTimeout && 
         new Date() > this.choiceTimeout;
});

// res.t('auto.e8999ae6')：res.t('auto.e698afe5')
DeliveryEventSchema.virtual('isCompleted').get(function() {
  return ['completed', 'failed'].includes(this.status);
});

const DeliveryEvent = mongoose.model('DeliveryEvent', DeliveryEventSchema);

module.exports = DeliveryEvent;