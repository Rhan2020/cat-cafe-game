const { customAlphabet } = require('nanoid');
const ContractInvite = require('../models/ContractInvite');
const GameConfig = require('../models/GameConfig');
const User = require('../models/User');
const Animal = require('../models/Animal');
const SocialAction = require('../models/SocialAction');

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

// 创建契约邀请
exports.createInvite = async (req, res) => {
  try {
    const { contractType } = req.body;
    if (!contractType) {
      return res.status(400).json({ code: 400, message: 'contractType is required' });
    }

    // 校验模板
    const templatesConfig = await GameConfig.getActiveConfig('contract_templates');
    if (!templatesConfig) {
      return res.status(500).json({ code: 500, message: 'Contract templates config missing' });
    }
    const template = templatesConfig.data.find(t => t.id === contractType);
    if (!template) {
      return res.status(400).json({ code: 400, message: 'Invalid contractType' });
    }

    // 防刷：一天最多创建5个邀请
    const dayStart = new Date(); dayStart.setHours(0,0,0,0);
    const invitesToday = await ContractInvite.countDocuments({ inviterId: req.user.id, createdAt: { $gte: dayStart } });
    if (invitesToday >= 5) {
      return res.status(429).json({ code: 429, message: 'Invite limit reached for today' });
    }

    // 生成唯一code
    let inviteCode;
    do { inviteCode = nanoid(); } while (await ContractInvite.findOne({ inviteCode }));

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天

    const invite = await ContractInvite.create({
      inviteCode,
      inviterId: req.user.id,
      contractType,
      status: 'pending',
      expiresAt
    });

    // 创建社交行为记录
    await SocialAction.create({
      fromUserId: req.user.id,
      toUserId: '',
      actionType: 'friend_contract',
      relatedId: invite._id,
      status: 'pending',
      reward: {},
      metadata: { contractType }
    });

    res.status(200).json({ code: 200, message: 'Invite created', data: { inviteCode, expiresAt, template } });
  } catch (err) {
    console.error('Error creating contract invite:', err);
    res.status(500).json({ code: 500, message: 'Internal Server Error', error: err.message });
  }
};

// 接受契约邀请
exports.acceptInvite = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ code: 400, message: 'inviteCode required' });
    }

    const invite = await ContractInvite.findOne({ inviteCode });
    if (!invite || invite.status !== 'pending') {
      return res.status(400).json({ code: 400, message: 'Invite not available' });
    }
    if (invite.expiresAt < new Date()) {
      invite.status = 'expired';
      await invite.save();
      return res.status(400).json({ code: 400, message: 'Invite expired' });
    }
    if (String(invite.inviterId) === req.user.id) {
      return res.status(400).json({ code: 400, message: 'Cannot accept own invite' });
    }

    // 检查是否已接受过该邀请者的契约
    const existingContractAnimal = await Animal.findOne({ ownerId: req.user.id, 'contractInfo.fromFriend': String(invite.inviterId) });
    if (existingContractAnimal) {
      return res.status(400).json({ code: 400, message: 'Already accepted invite from this player' });
    }

    // 创建动物 & 奖励双方
    const templatesConfig = await GameConfig.getActiveConfig('contract_templates');
    const template = templatesConfig?.data.find(t => t.id === invite.contractType);
    if (!template) {
      return res.status(500).json({ code: 500, message: 'Template missing' });
    }

    // 创建动物给受邀者
    const animal = new Animal({
      ownerId: req.user.id,
      species: template.species,
      breedId: template.breedId,
      name: template.defaultName,
      level: 1,
      attributes: { ...template.baseAttributes },
      contractInfo: { fromFriend: String(invite.inviterId), contractType: invite.contractType, createdAt: new Date() }
    });

    // 双方互加好友
    await Promise.all([
      animal.save(),
      User.updateOne({ _id: req.user.id }, { $addToSet: { friends: String(invite.inviterId) } }),
      User.updateOne({ _id: invite.inviterId }, { $addToSet: { friends: req.user.id } })
    ]);

    invite.status = 'accepted';
    invite.acceptedBy = req.user.id;
    invite.acceptedAt = new Date();
    await invite.save();

    // 更新 SocialAction 状态
    await SocialAction.updateOne({ relatedId: invite._id, actionType: 'friend_contract' }, { $set: { toUserId: req.user.id, status: 'completed', completedAt: new Date() } });

    res.status(200).json({ code: 200, message: 'Invite accepted', data: { animal } });
  } catch (err) {
    console.error('Error accepting invite:', err);
    res.status(500).json({ code: 500, message: 'Internal Server Error', error: err.message });
  }
};