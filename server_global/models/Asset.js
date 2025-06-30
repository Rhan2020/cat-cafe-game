const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AssetSchema = new Schema({
  // 基本信息
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: '', maxlength: 500 },
  category: { 
    type: String, 
    required: true,
    enum: ['image', 'audio', 'video', 'animation', 'ui', 'icon', 'background', 'character', 'effect']
  },
  tags: [{ type: String, maxlength: 50 }],
  
  // 文件信息
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true, min: 0 },
  mimeType: { type: String, required: true },
  fileExtension: { type: String, required: true },
  fileHash: { type: String, required: true, unique: true }, // SHA-256 hash for deduplication
  
  // 存储信息
  originalUrl: { type: String, required: true }, // 原始文件URL
  cdnUrl: { type: String }, // CDN URL
  thumbnailUrl: { type: String }, // 缩略图URL
  compressedUrl: { type: String }, // 压缩版本URL
  
  // 版本控制
  version: { type: String, default: '1.0.0' },
  parentAssetId: { type: Schema.Types.ObjectId, ref: 'Asset' }, // 父版本引用
  isLatestVersion: { type: Boolean, default: true },
  
  // 元数据（根据素材类型不同）
  metadata: {
    // 图片素材
    width: { type: Number },
    height: { type: Number },
    format: { type: String },
    colorDepth: { type: Number },
    
    // 音频素材
    duration: { type: Number }, // 秒
    bitrate: { type: Number },
    sampleRate: { type: Number },
    channels: { type: Number },
    
    // 动画素材
    frameCount: { type: Number },
    fps: { type: Number },
    loopable: { type: Boolean, default: false }
  },
  
  // 状态和权限
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
  
  // 使用统计
  usageCount: { type: Number, default: 0 },
  downloadCount: { type: Number, default: 0 },
  lastUsedAt: { type: Date },
  
  // 配置关联
  gameConfigReferences: [{
    configType: { type: String }, // 如 'animal_breeds', 'items'
    configId: { type: String },
    fieldPath: { type: String } // 在配置中的字段路径，如 'icon', 'avatar'
  }],
  
  // 审核信息
  approvedBy: { type: String },
  approvedAt: { type: Date },
  reviewNotes: { type: String },
  
  // 创建和更新信息
  createdBy: { type: String, required: true },
  updatedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 索引
AssetSchema.index({ category: 1, status: 1 });
AssetSchema.index({ tags: 1 });
AssetSchema.index({ fileHash: 1 }, { unique: true });
AssetSchema.index({ createdAt: -1 });
AssetSchema.index({ 'gameConfigReferences.configType': 1 });

// 虚拟字段：获取完整的CDN URL
AssetSchema.virtual('fullCdnUrl').get(function() {
  if (this.cdnUrl) {
    return process.env.CDN_BASE_URL ? `${process.env.CDN_BASE_URL}${this.cdnUrl}` : this.cdnUrl;
  }
  return this.originalUrl;
});

// 预处理：更新 updatedAt
AssetSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 静态方法：根据文件hash查找重复
AssetSchema.statics.findByHash = function(hash) {
  return this.findOne({ fileHash: hash });
};

// 静态方法：获取某个配置相关的所有素材
AssetSchema.statics.findByConfigReference = function(configType, configId) {
  return this.find({
    'gameConfigReferences.configType': configType,
    'gameConfigReferences.configId': configId,
    status: 'active'
  });
};

// 实例方法：标记为已使用
AssetSchema.methods.markAsUsed = function() {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  return this.save();
};

// 实例方法：创建新版本
AssetSchema.methods.createNewVersion = async function(newVersionData) {
  // 将当前版本标记为非最新
  this.isLatestVersion = false;
  await this.save();
  
  // 创建新版本
  const Asset = this.constructor;
  const newVersion = new Asset({
    ...newVersionData,
    parentAssetId: this._id,
    version: this.incrementVersion(),
    isLatestVersion: true
  });
  
  return newVersion.save();
};

// 实例方法：版本号递增
AssetSchema.methods.incrementVersion = function() {
  const [major, minor, patch] = this.version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
};

const Asset = mongoose.model('Asset', AssetSchema);

module.exports = Asset;