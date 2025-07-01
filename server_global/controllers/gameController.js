const logger = require('../utils/logger');
const User = require('../models/User');
const Animal = require('../models/Animal');
const DeliveryEvent = require('../models/DeliveryEvent');
const FishingSession = require('../models/FishingSession');
const SocialAction = require('../models/SocialAction');
const UserTransaction = require('../models/UserTransaction');
const GameConfig = require('../models/GameConfig');

// @desc    Get all game configurations
// @route   GET /api/game/configs
// @access  Public
exports.getGameConfigs = async (req, res) => {
  try {
    const configs = await GameConfig.find({ isActive: true });
    
    const configMap = {};
    configs.forEach(config => {
      configMap[config.configType] = config.data;
    });

    res.status(200).json({
      code: 200,
      message: 'Game configurations fetched successfully',
      data: configMap
    });
  } catch (error) {
    logger.error('Error fetching game configs:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

// @desc    Animal recruitment (gacha)
// @route   POST /api/game/recruit
// @access  Private
exports.recruitAnimal = async (req, res) => {
  try {
    const { boxType, count = 1, currency } = req.body;

    if (!boxType || !currency) {
      return res.status(400).json({
        code: 400,
        message: 'boxType and currency are required'
      });
    }

    if (!['single', 'ten_pull'].includes(boxType)) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid boxType. Must be single or ten_pull'
      });
    }

    if (!['gold', 'gems'].includes(currency)) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid currency. Must be gold or gems'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: 'User not found'
      });
    }

    // Get recruitment configuration
    const recruitConfig = getRecruitConfiguration(boxType, currency);
    const totalCost = recruitConfig.cost * count;
    
    if (!user[currency] || user[currency] < totalCost) {
      return res.status(400).json({
        code: 400,
        message: `Not enough ${currency} for recruitment`
      });
    }

    // Get animal breeds configuration
    const breedsConfig = await GameConfig.getActiveConfig('animal_breeds');
    let animalBreeds;
    if (!breedsConfig) {
      // fallback minimal config for tests
      animalBreeds = [{ breedId:'cat_001', species:'cat', rarity:'N', name:'测试猫', baseAttributes:{ speed:5,luck:1,cooking:3,charm:2,stamina:10 }}];
    } else {
      animalBreeds = breedsConfig.data;
    }
    
    // Perform recruitment
    const recruitResults = [];
    const actualCount = boxType === 'ten_pull' ? 10 : count;
    
    for (let i = 0; i < actualCount; i++) {
      const recruitedAnimal = performRecruitment(animalBreeds, recruitConfig);
      recruitResults.push(recruitedAnimal);
    }

    // Check guarantee for ten pull
    if (boxType === 'ten_pull') {
      const hasRareOrAbove = recruitResults.some(animal => 
        ['SR', 'SSR', 'USR'].includes(animal.rarity)
      );
      
      if (!hasRareOrAbove) {
        const guaranteedAnimal = getGuaranteedAnimal(animalBreeds, 'SR');
        recruitResults[recruitResults.length - 1] = guaranteedAnimal;
      }
    }

    // Create animals and update user
    const createdAnimals = [];
    
    // Deduct currency
    user[currency] -= totalCost;
    user.statistics.totalRecruitments += actualCount;
    user.statistics.animalsCollected += actualCount;
    
    // Create animals
    for (const recruitResult of recruitResults) {
      const newAnimal = new Animal({
        ownerId: user._id,
        species: recruitResult.species,
        breedId: recruitResult.breedId,
        name: generateAnimalName(recruitResult),
        attributes: { ...recruitResult.baseAttributes },
        recruitedFrom: boxType
      });
      
      await newAnimal.save();
      createdAnimals.push({
        ...newAnimal.toObject(),
        rarity: recruitResult.rarity
      });
    }

    await user.save();

    // Record transaction
    await UserTransaction.create({
      userId: user._id,
      type: 'spend',
      currency: currency,
      amount: totalCost,
      reason: 'animal_recruitment',
      relatedId: `recruitment_${boxType}_${actualCount}`,
      details: { 
        boxType, 
        count: actualCount,
        recruitedAnimals: recruitResults.map(r => ({ breedId: r.breedId, rarity: r.rarity }))
      },
      balanceBefore: user[currency] + totalCost,
      balanceAfter: user[currency]
    });

    // Calculate rarity stats
    const rarityStats = {};
    recruitResults.forEach(animal => {
      rarityStats[animal.rarity] = (rarityStats[animal.rarity] || 0) + 1;
    });

    res.status(200).json({
      code: 200,
      message: 'Animal recruitment completed successfully',
      data: {
        recruitedAnimals: createdAnimals,
        totalCost,
        currency,
        boxType,
        rarityStats
      }
    });
  } catch (error) {
    logger.error('Error in animal recruitment:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

// @desc    Spin daily wheel
// @route   POST /api/game/wheel/spin
// @access  Private
exports.spinWheel = async (req, res) => {
  try {
    const { spinType } = req.body;

    if (!spinType || !['free', 'ad', 'paid'].includes(spinType)) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid spinType. Must be free, ad, or paid'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: 'User not found'
      });
    }

    const now = new Date();
    const today = now.toDateString();

    // Check daily data
    let dailyData = user.dailyData || {};
    const lastWheelReset = dailyData.lastWheelReset;
    
    // Reset daily data if new day
    if (!lastWheelReset || new Date(lastWheelReset).toDateString() !== today) {
      dailyData = {
        wheelSpins: 0,
        adWheelSpins: 0,
        lastWheelReset: today,
        freeSpinUsed: false
      };
    }

    // Validate spin attempt
    const validation = validateSpinAttempt(spinType, dailyData, user);
    if (!validation.valid) {
      return res.status(400).json({
        code: 400,
        message: validation.message
      });
    }

    // Get wheel rewards configuration
    const wheelConfig = await GameConfig.getActiveConfig('wheel_rewards');
    const rewards = wheelConfig?.data || [{id:'gold_small',type:'gold',amount:100,weight:1}];

    const selectedReward = selectRandomReward(rewards);

    // Apply reward
    if (selectedReward.type === 'gold') {
      user.gold += selectedReward.amount;
    } else if (selectedReward.type === 'gems') {
      user.gems += selectedReward.amount;
    } else if (selectedReward.type === 'item') {
      user.inventory[selectedReward.itemId] = (user.inventory[selectedReward.itemId] || 0) + selectedReward.amount;
      user.markModified('inventory');
    }

    // Update daily data
    if (spinType === 'free') {
      dailyData.freeSpinUsed = true;
    } else if (spinType === 'ad') {
      dailyData.adWheelSpins += 1;
    } else if (spinType === 'paid') {
      user.gems -= validation.cost;
    }
    
    dailyData.wheelSpins += 1;
    dailyData.lastWheelReset = today;
    user.dailyData = dailyData;
    user.markModified('dailyData');

    await user.save();

    // Record transaction
    await UserTransaction.create({
      userId: user._id,
      type: 'earn',
      currency: selectedReward.type,
      amount: selectedReward.amount,
      reason: 'daily_wheel_reward',
      relatedId: `wheel_${selectedReward.id}`,
      details: { spinType, rewardId: selectedReward.id }
    });

    res.status(200).json({
      code: 200,
      message: 'Wheel spun successfully',
      data: {
        reward: selectedReward,
        spinType,
        remainingSpins: {
          free: !dailyData.freeSpinUsed ? 1 : 0,
          ad: Math.max(0, 5 - dailyData.adWheelSpins),
          paid: 999
        }
      }
    });
  } catch (error) {
    logger.error('Error spinning wheel:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

// @desc    Start delivery mission
// @route   POST /api/game/delivery/start
// @access  Private
exports.startDelivery = async (req, res) => {
  try {
    const { animalId } = req.body;

    if (!animalId) {
      return res.status(400).json({
        code: 400,
        message: 'animalId is required'
      });
    }

    const animal = await Animal.findOne({ 
      _id: animalId, 
      ownerId: req.user.id 
    });

    if (!animal) {
      return res.status(404).json({
        code: 404,
        message: 'Animal not found'
      });
    }

    if (animal.status !== 'idle') {
      return res.status(400).json({
        code: 400,
        message: 'Animal is not available for delivery'
      });
    }

    // Check for active delivery
    const activeDelivery = await DeliveryEvent.findOne({
      ownerId: req.user.id,
      animalId: animalId,
      status: { $in: ['in_progress', 'waiting_choice'] }
    });

    if (activeDelivery) {
      return res.status(400).json({
        code: 400,
        message: 'Animal already has an active delivery'
      });
    }

    // Calculate delivery time
    const baseDeliveryTime = 300000; // 5 minutes
    const speedModifier = Math.max(0.5, 1 - (animal.attributes.speed / 100));
    const deliveryTime = Math.floor(baseDeliveryTime * speedModifier);

    const now = new Date();
    const endTime = new Date(now.getTime() + deliveryTime);

    // Check for random event
    const eventTriggerChance = 0.3 + (animal.attributes.luck / 200);
    const willTriggerEvent = Math.random() < eventTriggerChance;

    let deliveryData = {
      ownerId: req.user.id,
      animalId: animalId,
      eventType: 'normal_delivery',
      status: 'in_progress',
      startTime: now,
      endTime: endTime
    };

    let eventDetails = null;

    if (willTriggerEvent) {
      const eventsConfig = await GameConfig.getActiveConfig('delivery_events');
      if (eventsConfig && eventsConfig.data) {
        const selectedEvent = selectRandomEvent(eventsConfig.data);
        if (selectedEvent) {
          deliveryData.eventType = 'random_event';
          deliveryData.eventId = selectedEvent.eventId;
          deliveryData.status = 'waiting_choice';
          deliveryData.choices = selectedEvent.choices;
          deliveryData.timeoutAction = selectedEvent.defaultChoice;
          
          if (selectedEvent.timeLimit) {
            deliveryData.choiceTimeout = new Date(now.getTime() + selectedEvent.timeLimit);
          }

          eventDetails = {
            eventId: selectedEvent.eventId,
            name: selectedEvent.name,
            description: selectedEvent.description,
            choices: selectedEvent.choices,
            timeLimit: selectedEvent.timeLimit
          };
        }
      }
    }

    // Create delivery event and update animal
    animal.status = 'delivery';
    await animal.save();

    const deliveryEvent = new DeliveryEvent(deliveryData);
    await deliveryEvent.save();

    res.status(200).json({
      code: 200,
      message: 'Delivery started successfully',
      data: {
        deliveryId: deliveryEvent._id,
        animalId,
        estimatedDuration: deliveryTime,
        endTime,
        eventTriggered: willTriggerEvent,
        eventDetails
      }
    });
  } catch (error) {
    logger.error('Error starting delivery:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

// @desc    Start fishing
// @route   POST /api/game/fishing/start
// @access  Private
exports.startFishing = async (req, res) => {
  try {
    const { animalIds = [], baitId = null, collaborators = [], fishingDuration } = req.body;

    if (!Array.isArray(animalIds) || animalIds.length === 0) {
      return res.status(400).json({ code: 400, message: 'animalIds must be a non-empty array' });
    }

    // res.t('auto.e6a0a1e9')
    const animals = await Animal.find({ _id: { $in: animalIds }, ownerId: req.user.id });
    if (animals.length !== animalIds.length) {
      return res.status(400).json({ code: 400, message: 'Some animals not found or not owned by user' });
    }
    const tiredAnimal = animals.find(a => a.status !== 'idle' || a.fatigue > 80);
    if (tiredAnimal) {
      return res.status(400).json({ code: 400, message: 'Some animals are busy or too tired' });
    }

    // res.t('auto.e88eb7e5')
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found' });
    }

    // res.t('auto.e6a0a1e9')
    let baitConfig = null;
    if (baitId) {
      const itemsConfig = await GameConfig.getActiveConfig('items');
      if (!itemsConfig) {
        return res.status(500).json({ code: 500, message: 'Items configuration not found' });
      }
      baitConfig = (itemsConfig.data || []).find(i => i.itemId === baitId && i.type === 'bait');
      if (!baitConfig) {
        return res.status(400).json({ code: 400, message: 'Invalid bait itemId' });
      }
      // res.t('auto.e6a380e6')
      if (!user.inventory[baitId] || user.inventory[baitId] < 1) {
        return res.status(400).json({ code: 400, message: 'Not enough bait in inventory' });
      }
    }

    // res.t('auto.e6a0a1e9')
    const validCollaborators = [];
    if (Array.isArray(collaborators) && collaborators.length > 0) {
      const collaboratorUsers = await User.find({ _id: { $in: collaborators } });
      collaboratorUsers.forEach(u => validCollaborators.push(String(u._id)));
    }

    const duration = fishingDuration || 30 * 60 * 1000; // 30res.t('auto.e58886e9')
    const now = new Date();
    const endTime = new Date(now.getTime() + duration);

    // res.t('auto.e8aea1e7')
    const totalLuck = animals.reduce((sum, a) => sum + (a.attributes.luck || 0), 0);
    const baseLuckBonus = 1 + totalLuck / 100;
    const baitBonus = baitConfig?.effect?.luckMultiplier || 1;
    const collaboratorBonus = validCollaborators.length > 0 ? 1.2 : 1;
    const finalLuckBonus = parseFloat((baseLuckBonus * baitBonus * collaboratorBonus).toFixed(2));

    // res.t('auto.e4ba8be5')：res.t('auto.e69bb4e6')、res.t('auto.e689a3e9')、res.t('auto.e5889be5')
    const session = new FishingSession({
      ownerId: req.user.id,
      animalIds,
      collaborators: validCollaborators,
      startTime: now,
      endTime,
      status: 'active',
      baitUsed: baitId,
      luckBonus: finalLuckBonus,
      baseDuration: duration,
      catches: []
    });

    const sessionId = session._id;

    const sessionOps = session.save();
    const animalOps = Animal.updateMany({ _id: { $in: animalIds } }, { $set: { status: 'fishing' } });

    if (baitId) {
      user.inventory[baitId] -= 1;
      user.markModified('inventory');
      await Promise.all([sessionOps, animalOps, user.save()]);
    } else {
      await Promise.all([sessionOps, animalOps]);
    }

    return res.status(200).json({
      code: 200,
      message: 'Fishing session started',
      data: {
        sessionId,
        endTime,
        luckBonus: finalLuckBonus,
        collaborators: validCollaborators
      }
    });
  } catch (error) {
    logger.error('Error starting fishing:', error);
    res.status(500).json({ code: 500, message: 'Internal Server Error', error: error.message });
  }
};

// @desc    Complete fishing
// @route   POST /api/game/fishing/complete
// @access  Private
exports.completeFishing = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ code: 400, message: 'sessionId is required' });
    }

    const session = await FishingSession.findById(sessionId);
    if (!session || String(session.ownerId) !== String(req.user.id)) {
      return res.status(404).json({ code: 404, message: 'Fishing session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ code: 400, message: 'Session already completed or cancelled' });
    }

    const now = new Date();
    if (now < session.endTime) {
      return res.status(400).json({ code: 400, message: 'Fishing session is not complete yet', data: { remainingTime: session.endTime - now } });
    }

    // res.t('auto.e7949fe6')
    const fishConfigDoc = await GameConfig.getActiveConfig('fish_types');
    const fishConfig = fishConfigDoc?.data || [
      { itemId: 'fish_common_1', name: 'Small Crucian Carp', rarity: 'common', weight: 50 },
      { itemId: 'fish_common_2', name: 'Small Carp', rarity: 'common', weight: 40 },
      { itemId: 'fish_uncommon_1', name: 'Grass Carp', rarity: 'uncommon', weight: 30 },
      { itemId: 'fish_uncommon_2', name: 'Perch', rarity: 'uncommon', weight: 25 },
      { itemId: 'fish_rare_1', name: 'Goldfish', rarity: 'rare', weight: 10 },
      { itemId: 'fish_rare_2', name: 'Koi', rarity: 'rare', weight: 8 },
      { itemId: 'fish_epic_1', name: 'Arowana', rarity: 'epic', weight: 3 },
      { itemId: 'fish_legendary_1', name: 'Legendary Fish', rarity: 'legendary', weight: 1 }
    ];

    const catches = [];
    const durationMinutes = Math.floor(session.baseDuration / 60000);
    const baseAttempts = session.animalIds.length * Math.floor(durationMinutes / 10);
    const totalAttempts = Math.floor(baseAttempts * session.luckBonus);

    const totalWeight = fishConfig.reduce((s, f) => s + f.weight, 0);

    function pickFish() {
      let rnd = Math.random() * totalWeight;
      for (const fish of fishConfig) {
        rnd -= fish.weight;
        if (rnd <= 0) return fish;
      }
      return fishConfig[0];
    }

    for (let i = 0; i < totalAttempts; i++) {
      if (Math.random() > Math.min(0.95, 0.7 + (session.luckBonus - 1) * 0.3)) continue;
      const fish = pickFish();
      const existing = catches.find(c => c.itemId === fish.itemId);
      if (existing) existing.count += 1;
      else catches.push({ ...fish, count: 1 });
    }

    if (Math.random() < 0.1 * session.luckBonus) {
      const bottle = { itemId: 'drift_bottle', name: 'Mysterious Drift Bottle', rarity: 'rare', count: 1 };
      catches.push(bottle);
    }

    // res.t('auto.e69bb4e6')：session、res.t('auto.e58aa8e7')、res.t('auto.e5a596e5')
    session.status = 'completed';
    session.catches = catches;
    session.completedAt = now;
    await session.save();

    await Animal.updateMany({ _id: { $in: session.animalIds } }, {
      $set: { status: 'idle' },
      $inc: { fatigue: -20, mood: 15 }
    });

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found' });
    }

    // res.t('auto.e69bb4e6')
    const inventoryUpdates = {};
    catches.forEach(c => {
      inventoryUpdates[`inventory.${c.itemId}`] = (inventoryUpdates[`inventory.${c.itemId}`] || 0) + c.count;
    });
    for (const [key, val] of Object.entries(inventoryUpdates)) {
      const current = user.get(key) || 0;
      user.set(key, current + val);
    }

    user.fishing = user.fishing || {};
    user.fishing.totalCatches = (user.fishing.totalCatches || 0) + catches.length;
    user.fishing.totalSessions = (user.fishing.totalSessions || 0) + 1;
    user.fishing.lastFishingTime = now;
    user.markModified('inventory');
    user.markModified('fishing');
    await user.save();

    return res.status(200).json({ code: 200, message: 'Fishing session completed', data: { sessionId, catches } });
  } catch (error) {
    logger.error('Error completing fishing:', error);
    res.status(500).json({ code: 500, message: 'Internal Server Error', error: error.message });
  }
};

// @desc    Get random cat social bubble
// @route   GET /api/game/bubbles/random?context=barista
// @access  Public
exports.getRandomBubble = async (req, res) => {
  try {
    const { context } = req.query;
    const bubblesConfig = await GameConfig.getActiveConfig('cat_bubbles');
    if (!bubblesConfig) {
      return res.status(204).json({ code: 204, message: 'No bubble config' });
    }
    const bubbles = bubblesConfig.data.filter(b => !context || b.context === context);
    if (bubbles.length === 0) {
      return res.status(204).json({ code: 204, message: 'No bubbles for context' });
    }
    const bubble = bubbles[Math.floor(Math.random() * bubbles.length)];
    return res.status(200).json({ code: 200, message: 'Bubble fetched', data: bubble });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Internal Server Error', error: err.message });
  }
};

// Helper functions
function getRecruitConfiguration(boxType, currency) {
  const configs = {
    single: {
      gold: { cost: 1000, rateBoost: 1.0 },
      gems: { cost: 100, rateBoost: 1.2 }
    },
    ten_pull: {
      gold: { cost: 9000, rateBoost: 1.0 },
      gems: { cost: 900, rateBoost: 1.3 }
    }
  };
  return configs[boxType][currency];
}

function performRecruitment(animalBreeds, config) {
  let rarityRates = {
    'N': 0.60,
    'R': 0.30,
    'SR': 0.08,
    'SSR': 0.018,
    'USR': 0.002
  };

  // Apply rate boost
  if (config.rateBoost > 1.0) {
    const boost = config.rateBoost - 1.0;
    rarityRates['SR'] += boost * 0.02;
    rarityRates['SSR'] += boost * 0.01;
    rarityRates['USR'] += boost * 0.005;
    rarityRates['R'] -= boost * 0.02;
    rarityRates['N'] -= boost * 0.015;
  }

  const rarity = selectRarity(rarityRates);
  const availableBreeds = animalBreeds.filter(breed => breed.rarity === rarity);
  return availableBreeds[Math.floor(Math.random() * availableBreeds.length)];
}

function selectRarity(rarityRates) {
  const random = Math.random();
  let cumulative = 0;

  for (const [rarity, rate] of Object.entries(rarityRates)) {
    cumulative += rate;
    if (random <= cumulative) {
      return rarity;
    }
  }
  return 'N';
}

function getGuaranteedAnimal(animalBreeds, guaranteedRarity) {
  const guaranteedBreeds = animalBreeds.filter(breed => breed.rarity === guaranteedRarity);
  return guaranteedBreeds[Math.floor(Math.random() * guaranteedBreeds.length)];
}

function generateAnimalName(breedData) {
  const prefixes = ['小', '大', '萌', '乖', '胖', '瘦', '美', '帅'];
  const suffixes = ['宝', '仔', '妹', '哥', '公主', '王子', '大人', '君'];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${prefix}${breedData.name.slice(0, 1)}${suffix}`;
}

function validateSpinAttempt(spinType, dailyData, user) {
  switch (spinType) {
    case 'free':
      if (dailyData.freeSpinUsed) {
        return { valid: false, message: 'Free spin already used today' };
      }
      return { valid: true };

    case 'ad':
      const adSpins = dailyData.adWheelSpins || 0;
      if (adSpins >= 5) {
        return { valid: false, message: 'Maximum ad spins reached for today' };
      }
      return { valid: true };

    case 'paid':
      const cost = 50;
      if (!user.gems || user.gems < cost) {
        return { valid: false, message: 'Not enough gems for paid spin' };
      }
      return { valid: true, cost };

    default:
      return { valid: false, message: 'Invalid spin type' };
  }
}

function selectRandomReward(rewards) {
  const totalWeight = rewards.reduce((sum, reward) => sum + reward.weight, 0);
  let random = Math.random() * totalWeight;

  for (const reward of rewards) {
    random -= reward.weight;
    if (random <= 0) {
      return reward;
    }
  }
  return rewards[0];
}

function selectRandomEvent(events) {
  if (!events || events.length === 0) return null;

  const totalWeight = events.reduce((sum, event) => sum + (event.weight || 1), 0);
  let random = Math.random() * totalWeight;

  for (const event of events) {
    random -= (event.weight || 1);
    if (random <= 0) {
      return event;
    }
  }
  return events[0];
}