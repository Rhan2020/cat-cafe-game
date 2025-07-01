const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AssetSchema = new Schema({
  // res.t('auto.e59fbae6')
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: '', maxlength: 500 },
  category: { 
    type: String, 
    required: true,
    enum: ['image', 'audio', 'video', 'animation', 'ui', 'icon', 'background', 'character', 'effect']
  },
  tags: [{ type: String, maxlength: 50 }],
  
  // res.t('auto.e69687e4')
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true, min: 0 },
  mimeType: { type: String, required: true },
  fileExtension: { type: String, required: true },
  fileHash: { type: String, required: true, unique: true }, // SHA-256 hash for deduplication
  
  // res.t('auto.e5ad98e5')
  originalUrl: { type: String, required: true }, // res.t('auto.e58e9fe5')URL
  cdnUrl: { type: String }, // CDN URL
  thumbnailUrl: { type: String }, // res.t('auto.e7bca9e7')URL
  compressedUrl: { type: String }, // res.t('auto.e58e8be7')URL
  
  // res.t('auto.e78988e6')
  version: { type: String, default: '1.0.0' },
  parentAssetId: { type: Schema.Types.ObjectId, ref: 'Asset' }, // res.t('auto.e788b6e7')
  isLatestVersion: { type: Boolean, default: true },
  
  // res.t('auto.e58583e6')（res.t('auto.e6a0b9e6')）
  metadata: {
    // res.t('auto.e59bbee7')
    width: { type: Number },
    height: { type: Number },
    format: { type: String },
    colorDepth: { type: Number },
    
    // res.t('auto.e99fb3e9')
    duration: { type: Number }, // 秒
    bitrate: { type: Number },
    sampleRate: { type: Number },
    channels: { type: Number },
    
    // res.t('auto.e58aa8e7')
    frameCount: { type: Number },
    fps: { type: Number },
    loopable: { type: Boolean, default: false }
  },
  
  // res.t('auto.e78ab6e6')
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'active', 'deprecated', 'deleted'],
    default: 'pending'
  },
  visibility: {
    type: String,
    enum: ['public', 'internal', 'private'],
    default: 'internal'
  },
  
  // res.t('auto.e4bdbfe7')
  usageCount: { type: Number, default: 0 },
  downloadCount: { type: Number, default: 0 },
  lastUsedAt: { type: Date },
  
  // res.t('auto.e9858de7')
  gameConfigReferences: [{
    configType: { type: String }, // 如 'animal_breeds', 'items'
    configId: { type: String },
    fieldPath: { type: String } // res.t('auto.e59ca8e9')，如 'icon', 'avatar'
  }],
  
  // res.t('auto.e5aea1e6')
  approvedBy: { type: String },
  approvedAt: { type: Date },
  reviewNotes: { type: String },
  
  // res.t('auto.e5889be5')
  createdBy: { type: String, required: true },
  updatedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// res.t('auto.e7b4a2e5')
AssetSchema.index({ category: 1, status: 1 });
AssetSchema.index({ tags: 1 });
AssetSchema.index({ fileHash: 1 }, { unique: true });
AssetSchema.index({ createdAt: -1 });
AssetSchema.index({ 'gameConfigReferences.configType': 1 });

// res.t('auto.e8999ae6')：res.t('auto.e88eb7e5')CDN URL
AssetSchema.virtual('fullCdnUrl').get(function() {
  if (this.cdnUrl) {
    return process.env.CDN_BASE_URL ? `${process.env.CDN_BASE_URL}${this.cdnUrl}` : this.cdnUrl;
  }
  return this.originalUrl;
});

// res.t('auto.e9a284e5')：res.t('auto.e69bb4e6') updatedAt
AssetSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// res.t('auto.e99d99e6')：res.t('auto.e6a0b9e6')hashres.t('auto.e69fa5e6')
AssetSchema.statics.findByHash = function(hash) {
  return this.findOne({ fileHash: hash });
};

// res.t('auto.e99d99e6')：res.t('auto.e88eb7e5')
AssetSchema.statics.findByConfigReference = function(configType, configId) {
  return this.find({
    'gameConfigReferences.configType': configType,
    'gameConfigReferences.configId': configId,
    status: 'active'
  });
};

// res.t('auto.e5ae9ee4')：res.t('auto.e6a087e8')
AssetSchema.methods.markAsUsed = function() {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  return this.save();
};

// res.t('auto.e5ae9ee4')：res.t('auto.e5889be5')
AssetSchema.methods.createNewVersion = async function(newVersionData) {
  // res.t('auto.e5b086e5')
  this.isLatestVersion = false;
  await this.save();
  
  // res.t('auto.e5889be5')
  const Asset = this.constructor;
  const newVersion = new Asset({
    ...newVersionData,
    parentAssetId: this._id,
    version: this.incrementVersion(),
    isLatestVersion: true
  });
  
  return newVersion.save();
};

// res.t('auto.e5ae9ee4')：res.t('auto.e78988e6')
AssetSchema.methods.incrementVersion = function() {
  const [major, minor, patch] = this.version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
};

const Asset = mongoose.model('Asset', AssetSchema);

module.exports = Asset;