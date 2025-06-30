const logger = require('../utils/logger');
const SpecialVisitorEvent = require('../models/SpecialVisitorEvent');
const GameConfig = require('../models/GameConfig');
const User = require('../models/User');

// res.t('auto.e88eb7e5')（res.t('auto.e88ba5e6')）
exports.getPendingVisitor = async (req, res) => {
  try {
    const event = await SpecialVisitorEvent.findOne({ ownerId: req.user.id, status: 'pending' })
      .sort({ triggeredAt: 1 });
    if (!event) {
      return res.status(204).json({ code: 204, message: 'No pending visitor' });
    }
    res.status(200).json({ code: 200, message: 'Pending visitor fetched', data: event });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Internal Server Error', error: err.message });
  }
};

// res.t('auto.e78ea9e5')
exports.chooseVisitorOption = async (req, res) => {
  try {
    const { eventId, choiceId } = req.body;
    if (!eventId || !choiceId) {
      return res.status(400).json({ code: 400, message: 'eventId and choiceId are required' });
    }

    const event = await SpecialVisitorEvent.findById(eventId);
    if (!event || String(event.ownerId) !== req.user.id) {
      return res.status(404).json({ code: 404, message: 'Visitor event not found' });
    }
    if (event.status !== 'pending') {
      return res.status(400).json({ code: 400, message: 'Event already resolved' });
    }

    const choice = event.choices.find(c => c.id === choiceId);
    if (!choice) {
      return res.status(400).json({ code: 400, message: 'Invalid choiceId' });
    }

    // res.t('auto.e8aea1e7')
    const result = selectOutcome(choice.outcomes);
    const user = await User.findById(req.user.id);

    // res.t('auto.e5ba94e7') / res.t('auto.e683a9e7')
    if (result.itemReward) {
      user.inventory[result.itemReward] = (user.inventory[result.itemReward] || 0) + 1;
      user.markModified('inventory');
    }
    if (result.goldReward) user.gold += result.goldReward;
    if (result.goldLoss) user.gold = Math.max(0, user.gold - result.goldLoss);

    await user.save();

    event.status = 'completed';
    event.selectedChoice = choiceId;
    event.result = result;
    event.rewards = { ...result };
    event.completedAt = new Date();
    await event.save();

    res.status(200).json({ code: 200, message: 'Visitor choice applied', data: { eventId, result } });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Internal Server Error', error: err.message });
  }
};

// res.t('auto.e5908ee5')（res.t('auto.e7a4bae4')，res.t('auto.e58fafe5') cron res.t('auto.e8b083e7')）
exports.triggerRandomVisitor = async (userId) => {
  const visitorConfigDoc = await GameConfig.getActiveConfig('special_visitors');
  if (!visitorConfigDoc) return null;
  const visitors = visitorConfigDoc.data;
  if (!visitors || visitors.length === 0) return null;

  const userEventsCount = await SpecialVisitorEvent.countDocuments({ ownerId: userId, status: 'pending' });
  if (userEventsCount > 0) return null; // res.t('auto.e5b7b2e6')

  const selected = selectVisitor(visitors);
  const now = new Date();
  const expiredAt = new Date(now.getTime() + (selected.expireIn || 86400000)); // res.t('auto.e9bb98e8')

  const event = await SpecialVisitorEvent.create({
    ownerId: userId,
    visitorId: selected.visitorId,
    name: selected.name,
    description: selected.description,
    status: 'pending',
    triggeredAt: now,
    expiredAt,
    choices: selected.choices
  });
  return event;
};

function selectOutcome(outcomes) {
  if (!outcomes || outcomes.length === 0) return { message: 'res.t('auto.e5b9b3e5')' };
  const rand = Math.random();
  let cum = 0;
  for (const o of outcomes) {
    cum += o.probability;
    if (rand <= cum) return o.result;
  }
  return outcomes[outcomes.length - 1].result;
}

function selectVisitor(visitors) {
  const totalWeight = visitors.reduce((s, v) => s + (v.weight || 1), 0);
  let rnd = Math.random() * totalWeight;
  for (const v of visitors) {
    rnd -= (v.weight || 1);
    if (rnd <= 0) return v;
  }
  return visitors[0];
}