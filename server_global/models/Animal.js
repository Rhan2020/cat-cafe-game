const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AnimalSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  species: { type: String, required: true }, // "cat", "dog", etc.
  breedId: { type: String, required: true }, // e.g., "cat_001"
  
  name: { type: String, required: true },
  level: { type: Number, default: 1 },
  exp: { type: Number, default: 0 },
  
  status: { type: String, default: 'idle' }, // idle, working, fishing
  assignedPost: { type: String, default: '' },
  
  skills: [{ type: String }],
  
  attributes: {
    speed: { type: Number, default: 1 },
    luck: { type: Number, default: 1 },
    //... any other attributes
  }
});

const Animal = mongoose.model('Animal', AnimalSchema);

module.exports = Animal; 