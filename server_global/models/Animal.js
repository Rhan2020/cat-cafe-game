const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AnimalSchema = new Schema({
  // res.t('auto.e59fbae7')
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  species: { type: String, required: true }, // "cat", "dog", "hamster"
  breedId: { type: String, required: true }, // e.g., "cat_001"
  name: { type: String, required: true },
  
  // res.t('auto.e7ad89e7')
  level: { type: Number, default: 1 },
  exp: { type: Number, default: 0 },
  
  // res.t('auto.e78ab6e6')
  status: { 
    type: String, 
    default: 'idle', 
    enum: ['idle', 'working', 'fishing', 'delivery'] 
  },
  assignedPost: { type: String, default: '' },
  
  // res.t('auto.e68a80e8')
  skills: [{ type: String }],
  
  // res.t('auto.e5b19ee6')
  attributes: {
    speed: { type: Number, default: 5 },
    luck: { type: Number, default: 1 },
    cooking: { type: Number, default: 3 },
    charm: { type: Number, default: 2 },
    stamina: { type: Number, default: 10 }
  },

  // res.t('auto.e78ab6e6')
  fatigue: { type: Number, default: 0, min: 0, max: 100 },
  mood: { type: Number, default: 100, min: 0, max: 100 },

  // res.t('auto.e5a496e8')
  outfit: { type: String, default: '' },

  // res.t('auto.e5a591e7')（res.t('auto.e5a5bde5')）
  contractInfo: {
    fromFriend: { type: String },
    contractType: { type: String },
    createdAt: { type: Date }
  },

  // res.t('auto.e8b49fe9')
  debuffs: { type: Object, default: {} },

  // res.t('auto.e68b9be5')
  recruitedFrom: { 
    type: String, 
    default: 'initial',
    enum: ['initial', 'single', 'ten_pull', 'event', 'friend_contract']
  },

  // res.t('auto.e697b6e9')
  createdAt: { type: Date, default: Date.now },
  lastWorkedAt: { type: Date },
  
  // res.t('auto.e7bb9fe8')
  statistics: {
    totalWorkTime: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    deliveriesCompleted: { type: Number, default: 0 },
    fishingSessionsCompleted: { type: Number, default: 0 }
  }
});

// res.t('auto.e6b7bbe5')
AnimalSchema.index({ ownerId: 1 });
AnimalSchema.index({ ownerId: 1, status: 1 });
AnimalSchema.index({ ownerId: 1, species: 1 });
AnimalSchema.index({ createdAt: -1 });

// res.t('auto.e8999ae6')：res.t('auto.e698afe5')
AnimalSchema.virtual('canWork').get(function() {
  return this.status === 'idle' && this.fatigue < 90;
});

// res.t('auto.e8999ae6')：res.t('auto.e680bbe6')
AnimalSchema.virtual('totalPower').get(function() {
  return this.attributes.speed + this.attributes.luck + 
         this.attributes.cooking + this.attributes.charm + 
         this.attributes.stamina;
});

// res.t('auto.e5ae9ee4')：res.t('auto.e58d87e7')
AnimalSchema.methods.levelUp = function(expGain) {
  this.exp += expGain;
  // res.t('auto.e58d87e7')
  return this.save();
};

// res.t('auto.e5ae9ee4')：res.t('auto.e681a2e5')
AnimalSchema.methods.rest = function(restTime) {
  const fatigueReduction = Math.min(this.fatigue, Math.floor(restTime / 60000)); // res.t('auto.e6af8fe5')1res.t('auto.e782b9e7')
  this.fatigue = Math.max(0, this.fatigue - fatigueReduction);
  this.mood = Math.min(100, this.mood + Math.floor(fatigueReduction / 2)); // res.t('auto.e4bc91e6')
  return this.save();
};

const Animal = mongoose.model('Animal', AnimalSchema);

module.exports = Animal; 