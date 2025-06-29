const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  // We won't use the OpenID as the _id here for a global system.
  // A standard MongoDB ObjectId is more appropriate.
  authProviderId: { type: String, required: true, unique: true }, // e.g., Google ID, Apple ID
  
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: Date.now },
  
  nickname: { type: String, required: true },
  avatarUrl: { type: String, default: '' },
  
  gold: { type: Number, default: 1000 },
  gems: { type: Number, default: 100 },
  
  inventory: { type: Object, default: {} },
  settings: { type: Object, default: { music: 1, sound: 1 } },

  // The debut concept can be carried over
  debut: {
    type: { type: String, default: 'N' },
    debt: { type: Number, default: 5000 }
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = User; 