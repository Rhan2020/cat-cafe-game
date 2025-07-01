// 使用 CommonJS 版本，避免在 Jest 环境中解析 ESM
const { customAlphabet } = require('nanoid');
const ContractInvite = require('../models/ContractInvite');
const GameConfig = require('../models/GameConfig');
const User = require('../models/User');
const Animal = require('../models/Animal');
const SocialAction = require('../models/SocialAction');

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

// res.t('auto.e5889be5')
exports.createInvite = async (req, res) => {
  try {
    const { contractType } = req.body;
    if (!contractType) {
      return res.status(400).json({ code: 400, message: 'contractType is required' });
    }

    // res.t('auto.e6a0a1e9')
    const templatesConfig = await GameConfig.getActiveConfig('contract_templates');
    if (!templatesConfig) {
      return res.status(500).json({ code: 500, message: 'Contract templates config missing' });
    }
    const template = templatesConfig.data.find(t => t.id === contractType);
    if (!template) {
      return res.status(400).json({ code: 400, message: 'Invalid contractType' });
    }

    // res.t('auto.e998b2e5')：res.t('auto.e4b880e5')5res.t('auto.e4b8aae9')
    const dayStart = new Date(); dayStart.setHours(0,0,0,0);
    const invitesToday = await ContractInvite.countDocuments({ inviterId: req.user.id, createdAt: { $gte: dayStart } });
    if (invitesToday >= 5) {
      return res.status(429).json({ code: 429, message: 'Invite limit reached for today' });
    }

    // res.t('auto.e7949fe6')code
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

    // res.t('auto.e5889be5')
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
    logger.error('Error creating contract invite:', err);
    res.status(500).json({ code: 500, message: 'Internal Server Error', error: err.message });
  }
};

// res.t('auto.e68ea5e5')
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

    // res.t('auto.e6a380e6')
    const existingContractAnimal = await Animal.findOne({ ownerId: req.user.id, 'contractInfo.fromFriend': String(invite.inviterId) });
    if (existingContractAnimal) {
      return res.status(400).json({ code: 400, message: 'Already accepted invite from this player' });
    }

    // res.t('auto.e5889be5') & res.t('auto.e5a596e5')
    const templatesConfig = await GameConfig.getActiveConfig('contract_templates');
    const template = templatesConfig?.data.find(t => t.id === invite.contractType);
    if (!template) {
      return res.status(500).json({ code: 500, message: 'Template missing' });
    }

    // res.t('auto.e5889be5')
    const animal = new Animal({
      ownerId: req.user.id,
      species: template.species,
      breedId: template.breedId,
      name: template.defaultName,
      level: 1,
      attributes: { ...template.baseAttributes },
      contractInfo: { fromFriend: String(invite.inviterId), contractType: invite.contractType, createdAt: new Date() }
    });

    // res.t('auto.e58f8ce6')
    await Promise.all([
      animal.save(),
      User.updateOne({ _id: req.user.id }, { $addToSet: { friends: String(invite.inviterId) } }),
      User.updateOne({ _id: invite.inviterId }, { $addToSet: { friends: req.user.id } })
    ]);

    invite.status = 'accepted';
    invite.acceptedBy = req.user.id;
    invite.acceptedAt = new Date();
    await invite.save();

    // res.t('auto.e69bb4e6') SocialAction res.t('auto.e78ab6e6')
    await SocialAction.updateOne({ relatedId: invite._id, actionType: 'friend_contract' }, { $set: { toUserId: req.user.id, status: 'completed', completedAt: new Date() } });

    res.status(200).json({ code: 200, message: 'Invite accepted', data: { animal } });
  } catch (err) {
    logger.error('Error accepting invite:', err);
    res.status(500).json({ code: 500, message: 'Internal Server Error', error: err.message });
  }
};