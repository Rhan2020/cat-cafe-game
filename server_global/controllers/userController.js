const User = require('../models/User');
const Animal = require('../models/Animal');
const UserTransaction = require('../models/UserTransaction');
const GameConfig = require('../models/GameConfig');

// @desc    Login or register a user
// @route   POST /api/users/login
// @access  Public
exports.login = async (req, res) => {
  const { authProviderId, authProvider, nickname, avatarUrl } = req.body;

  if (!authProviderId || !authProvider || !nickname) {
    return res.status(400).json({ 
      code: 400,
      message: 'authProviderId, authProvider, and nickname are required.' 
    });
  }

  try {
    let user = await User.findOne({ authProviderId, authProvider });

    if (user) {
      // User exists, handle login and calculate offline earnings
      const lastLoginDate = new Date(user.lastLoginAt);
      const now = new Date();
      const offlineSeconds = Math.floor((now - lastLoginDate) / 1000);

      let earnedGold = 0;
      let workingAnimals = [];

      if (offlineSeconds > 5) {
        workingAnimals = await Animal.find({ 
          ownerId: user._id, 
          status: 'working' 
        });
        
        if (workingAnimals.length > 0) {
          // Get animal breeds configuration
          const breedsConfig = await GameConfig.getActiveConfig('animal_breeds');
          const breeds = breedsConfig ? breedsConfig.data : [];
          const breedMap = new Map(breeds.map(b => [b.breedId, b]));

          // Calculate Gold based on animal attributes
          const totalSpeed = workingAnimals.reduce((speed, animal) => {
            const breed = breedMap.get(animal.breedId);
            return speed + (breed?.baseAttributes?.speed || animal.attributes.speed || 1);
          }, 0);

          earnedGold = Math.floor(totalSpeed * offlineSeconds * 0.1); // 0.1 gold per second per speed point

          // Update animal experience
          const earnedExp = offlineSeconds * 0.5; // 0.5 exp per second
          const animalUpdatePromises = workingAnimals.map(animal => 
            Animal.updateOne(
              { _id: animal._id }, 
              { 
                $inc: { 
                  exp: earnedExp,
                  fatigue: Math.floor(offlineSeconds / 60), // 1 fatigue per minute
                  'statistics.totalWorkTime': offlineSeconds
                }
              }
            )
          );
          await Promise.all(animalUpdatePromises);
        }
      }

      // Update user data
      user.lastLoginAt = now;
      if (earnedGold > 0) {
        user.gold += earnedGold;
        user.statistics.totalEarnings += earnedGold;
      }
      
      // Update avatar if provided
      if (avatarUrl && avatarUrl !== user.avatarUrl) {
        user.avatarUrl = avatarUrl;
      }

      await user.save();

      // Record transaction if earned gold
      if (earnedGold > 0) {
        await UserTransaction.create({
          userId: user._id,
          type: 'earn',
          currency: 'gold',
          amount: earnedGold,
          reason: 'offline_earnings',
          balanceBefore: user.gold - earnedGold,
          balanceAfter: user.gold,
          details: {
            offlineSeconds,
            animalCount: workingAnimals.length
          }
        });
      }
      
      res.status(200).json({
        code: 200,
        message: 'Login successful',
        data: {
          user,
          offlineEarnings: {
            gold: earnedGold,
            duration: offlineSeconds,
            animalCount: workingAnimals.length
          }
        }
      });
    } else {
      // User does not exist, create a new user
      user = new User({
        authProviderId,
        authProvider,
        nickname,
        avatarUrl: avatarUrl || ''
      });
      await user.save();
      
      res.status(201).json({
        code: 201,
        message: 'User created successfully',
        data: {
          user,
          offlineEarnings: { gold: 0, duration: 0, animalCount: 0 }
        }
      });
    }
  } catch (error) {
    logger.error('Error in user login:', error);
    res.status(500).json({ 
      code: 500,
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

// @desc    Get user profile and animals
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: 'User not found'
      });
    }

    const animals = await Animal.find({ ownerId: user._id });

    res.status(200).json({
      code: 200,
      message: 'Profile fetched successfully',
      data: {
        profile: user,
        animals
      }
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

// @desc    Update user settings
// @route   PUT /api/users/settings
// @access  Private
exports.updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        code: 400,
        message: 'Invalid settings object'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: 'User not found'
      });
    }

    // Merge settings
    user.settings = { ...user.settings, ...settings };
    await user.save();

    res.status(200).json({
      code: 200,
      message: 'Settings updated successfully',
      data: { settings: user.settings }
    });
  } catch (error) {
    logger.error('Error updating user settings:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

// @desc    Update user nickname
// @route   PUT /api/users/nickname
// @access  Private
exports.updateNickname = async (req, res) => {
  try {
    const { nickname } = req.body;
    
    if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
      return res.status(400).json({
        code: 400,
        message: 'Valid nickname is required'
      });
    }

    if (nickname.length > 20) {
      return res.status(400).json({
        code: 400,
        message: 'Nickname must be 20 characters or less'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: 'User not found'
      });
    }

    user.nickname = nickname.trim();
    await user.save();

    res.status(200).json({
      code: 200,
      message: 'Nickname updated successfully',
      data: { nickname: user.nickname }
    });
  } catch (error) {
    logger.error('Error updating nickname:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

// @desc    Get user transaction history
// @route   GET /api/users/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, currency, reason } = req.query;
    
    const filter = { userId: req.user.id };
    if (currency) filter.currency = currency;
    if (reason) filter.reason = reason;

    const transactions = await UserTransaction.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await UserTransaction.countDocuments(filter);

    res.status(200).json({
      code: 200,
      message: 'Transactions fetched successfully',
      data: {
        transactions,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: transactions.length,
          totalRecords: total
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching transactions:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: 'User not found'
      });
    }

    // Soft delete - deactivate account
    user.isActive = false;
    user.nickname = `[res.t('auto.e5b7b2e5')]${user.nickname}`;
    await user.save();

    // Optional: Clean up related data
    await Animal.updateMany(
      { ownerId: user._id },
      { status: 'idle' }
    );

    res.status(200).json({
      code: 200,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    logger.error('Error deleting account:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};
