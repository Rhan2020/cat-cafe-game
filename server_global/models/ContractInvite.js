const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * 好友契约邀请 - 玩家生成分享链接后等待好友接受
 */
const ContractInviteSchema = new Schema({
  inviteCode: { type: String, required: true, unique: true },
  inviterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  contractType: { type: String, required: true }, // 如 loyal_dog, sweet_hamster

  // 邀请状态
  status: {
    type: String,
    required: true,
    enum: ['pending', 'accepted', 'expired']
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  acceptedAt: { type: Date },
  acceptedBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

ContractInviteSchema.index({ inviteCode: 1 });
ContractInviteSchema.index({ inviterId: 1 });
ContractInviteSchema.index({ status: 1 });
ContractInviteSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('ContractInvite', ContractInviteSchema);