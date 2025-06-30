const Animal = require('../models/Animal');
const User = require('../models/User');
const UserTransaction = require('../models/UserTransaction');
const GameConfig = require('../models/GameConfig');

// @desc    Get all animals for a user
// @route   GET /api/animals
// @access  Private
exports.getAnimals = async (req, res) => {
  try {
    const animals = await Animal.find({ ownerId: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      code: 200,
      message: 'Animals fetched successfully',
      data: animals
    });
  } catch (error) {
    logger.error('Error fetching animals:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

// @desc    Get specific animal details
// @route   GET /api/animals/:id
// @access  Private
exports.getAnimal = async (req, res) => {
  try {
    const animal = await Animal.findOne({ 
      _id: req.params.id, 
      ownerId: req.user.id 
    });

    if (!animal) {
      return res.status(404).json({
        code: 404,
        message: 'Animal not found'
      });
    }

    res.status(200).json({
      code: 200,
      message: 'Animal fetched successfully',
      data: animal
    });
  } catch (error) {
    logger.error('Error fetching animal:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

// @desc    Update animal name
// @route   PUT /api/animals/:id/name
// @access  Private
exports.updateAnimalName = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        code: 400,
        message: 'Valid name is required'
      });
    }

    if (name.length > 15) {
      return res.status(400).json({
        code: 400,
        message: 'Name must be 15 characters or less'
      });
    }

    const animal = await Animal.findOne({ 
      _id: req.params.id, 
      ownerId: req.user.id 
    });

    if (!animal) {
      return res.status(404).json({
        code: 404,
        message: 'Animal not found'
      });
    }

    animal.name = name.trim();
    await animal.save();

    res.status(200).json({
      code: 200,
      message: 'Animal name updated successfully',
      data: { name: animal.name }
    });
  } catch (error) {
    logger.error('Error updating animal name:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

// @desc    Assign animal to work post
// @route   PUT /api/animals/:id/assign
// @access  Private
exports.assignAnimalToPost = async (req, res) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({
        code: 400,
        message: 'postId is required'
      });
    }

    const animal = await Animal.findOne({ 
      _id: req.params.id, 
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
        message: 'Animal is not available for assignment'
      });
    }

    if (animal.fatigue > 80) {
      return res.status(400).json({
        code: 400,
        message: 'Animal is too tired to work'
      });
    }

    // Validate post configuration
    const postsConfig = await GameConfig.getActiveConfig('posts');
    const posts = postsConfig ? postsConfig.data : [];
    const post = posts.find(p => p.postId === postId);

    if (!post) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid post ID'
      });
    }

    // Check if animal species is allowed for this post
    if (post.requiredSpecies && !post.requiredSpecies.includes(animal.species)) {
      return res.status(400).json({
        code: 400,
        message: `This post requires ${post.requiredSpecies.join(' or ')} species`
      });
    }

    // Remove any other animal from this post
    await Animal.updateMany(
      { ownerId: req.user.id, assignedPost: postId },
      { $set: { status: 'idle', assignedPost: '' } }
    );

    // Assign this animal to the post
    animal.status = 'working';
    animal.assignedPost = postId;
    animal.lastWorkedAt = new Date();
    await animal.save();

    res.status(200).json({
      code: 200,
      message: 'Animal assigned successfully',
      data: { animalId: animal._id, postId }
    });
  } catch (error) {
    logger.error('Error assigning animal:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

// @desc    Remove animal from work post
// @route   PUT /api/animals/:id/unassign
// @access  Private
exports.unassignAnimal = async (req, res) => {
  try {
    const animal = await Animal.findOne({ 
      _id: req.params.id, 
      ownerId: req.user.id 
    });

    if (!animal) {
      return res.status(404).json({
        code: 404,
        message: 'Animal not found'
      });
    }

    if (animal.status !== 'working') {
      return res.status(400).json({
        code: 400,
        message: 'Animal is not currently working'
      });
    }

    animal.status = 'idle';
    animal.assignedPost = '';
    await animal.save();

    res.status(200).json({
      code: 200,
      message: 'Animal unassigned successfully',
      data: { animalId: animal._id }
    });
  } catch (error) {
    logger.error('Error unassigning animal:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

// @desc    Upgrade animal (add experience)
// @route   POST /api/animals/:id/upgrade
// @access  Private
exports.upgradeAnimal = async (req, res) => {
  try {
    const { expToAdd, useItems } = req.body;

    if (!expToAdd && !useItems) {
      return res.status(400).json({
        code: 400,
        message: 'Either expToAdd or useItems is required'
      });
    }

    const animal = await Animal.findOne({ 
      _id: req.params.id, 
      ownerId: req.user.id 
    });

    if (!animal) {
      return res.status(404).json({
        code: 404,
        message: 'Animal not found'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: 'User not found'
      });
    }

    // Get level up experience configuration
    const levelUpConfig = await GameConfig.getActiveConfig('level_up_exp');
    const levelUpExps = levelUpConfig ? levelUpConfig.data : [100, 250, 500, 1000, 2000];

    let totalExpToAdd = expToAdd || 0;
    let itemsUsed = [];

    // Process item usage
    if (useItems && useItems.length > 0) {
      const itemsConfig = await GameConfig.getActiveConfig('items');
      const items = itemsConfig ? itemsConfig.data : [];
      const itemMap = new Map(items.map(item => [item.itemId, item]));

      for (const useItem of useItems) {
        const { itemId, count } = useItem;
        const itemConfig = itemMap.get(itemId);

        if (!itemConfig || itemConfig.effect?.action !== 'add_exp') {
          return res.status(400).json({
            code: 400,
            message: `Invalid item: ${itemId}`
          });
        }

        if (!user.inventory[itemId] || user.inventory[itemId] < count) {
          return res.status(400).json({
            code: 400,
            message: `Not enough ${itemId} in inventory`
          });
        }

        totalExpToAdd += itemConfig.effect.value * count;
        itemsUsed.push({ itemId, count, expValue: itemConfig.effect.value });
      }
    }

    // Calculate level up
    const upgradeResult = calculateLevelUp(animal.level, animal.exp, totalExpToAdd, levelUpExps);

    // Apply upgrade
    animal.level = upgradeResult.newLevel;
    animal.exp = upgradeResult.newExp;
    animal.attributes = upgradeResult.newAttributes;
    await animal.save();

    // Consume items
    if (itemsUsed.length > 0) {
      for (const usedItem of itemsUsed) {
        user.inventory[usedItem.itemId] -= usedItem.count;
        if (user.inventory[usedItem.itemId] <= 0) {
          delete user.inventory[usedItem.itemId];
        }
      }
      user.markModified('inventory');
      await user.save();

      // Record transaction
      await UserTransaction.create({
        userId: user._id,
        type: 'spend',
        currency: 'items',
        amount: itemsUsed.length,
        reason: 'animal_upgrade',
        relatedId: animal._id.toString(),
        details: { itemsUsed }
      });
    }

    res.status(200).json({
      code: 200,
      message: 'Animal upgraded successfully',
      data: {
        animalId: animal._id,
        levelsBefore: upgradeResult.levelsBefore,
        levelsAfter: upgradeResult.newLevel,
        expAdded: totalExpToAdd,
        itemsUsed,
        newAttributes: upgradeResult.newAttributes,
        skillSlotsUnlocked: upgradeResult.skillSlotsUnlocked
      }
    });
  } catch (error) {
    logger.error('Error upgrading animal:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

// @desc    Rest animal (reduce fatigue)
// @route   POST /api/animals/:id/rest
// @access  Private
exports.restAnimal = async (req, res) => {
  try {
    const { duration = 3600000 } = req.body; // Default 1 hour

    const animal = await Animal.findOne({ 
      _id: req.params.id, 
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
        message: 'Animal must be idle to rest'
      });
    }

    const fatigueBefore = animal.fatigue;
    await animal.rest(duration);

    res.status(200).json({
      code: 200,
      message: 'Animal rested successfully',
      data: {
        animalId: animal._id,
        fatigueBefore,
        fatigueAfter: animal.fatigue,
        moodAfter: animal.mood
      }
    });
  } catch (error) {
    logger.error('Error resting animal:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

// Helper function to calculate level up
function calculateLevelUp(currentLevel, currentExp, expToAdd, levelUpExps) {
  let newLevel = currentLevel;
  let newExp = currentExp + expToAdd;
  let skillSlotsUnlocked = [];

  // Calculate new level
  while (newLevel < levelUpExps.length && newExp >= levelUpExps[newLevel - 1]) {
    newExp -= levelUpExps[newLevel - 1];
    newLevel++;
    
    // Every 5 levels unlock a skill slot
    if (newLevel % 5 === 0) {
      skillSlotsUnlocked.push(newLevel);
    }
  }

  // Calculate new attributes (each level increases all attributes)
  const levelGrowth = newLevel - currentLevel;
  const newAttributes = {
    speed: 5 + Math.floor(newLevel * 0.5),
    luck: 1 + Math.floor(newLevel * 0.3),
    cooking: 3 + Math.floor(newLevel * 0.7),
    charm: 2 + Math.floor(newLevel * 0.4),
    stamina: 10 + Math.floor(newLevel * 1.2)
  };

  return {
    levelsBefore: currentLevel,
    newLevel,
    newExp,
    newAttributes,
    skillSlotsUnlocked,
    levelsGained: levelGrowth
  };
}