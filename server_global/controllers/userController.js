const User = require('../models/User');
const Animal = require('../models/Animal');

// In a real app, this would be fetched from a 'game_configs' collection
const MOCK_GAME_CONFIGS = {
  animal_breeds: [
    { breedId: 'cat_fast', baseAttributes: { speed: 5 } },
    { breedId: 'cat_normal', baseAttributes: { speed: 2 } },
  ],
  expPerSecond: 0.5,
};

// @desc    Login or register a user
// @route   POST /api/users/login
// @access  Public
exports.login = async (req, res) => {
  const { authProviderId, nickname } = req.body;

  if (!authProviderId || !nickname) {
    return res.status(400).json({ message: 'authProviderId and nickname are required.' });
  }

  try {
    let user = await User.findOne({ authProviderId });

    if (user) {
      // User exists, handle login and calculate offline earnings
      const lastLoginDate = new Date(user.lastLoginAt);
      const now = new Date();
      const offlineSeconds = Math.floor((now - lastLoginDate) / 1000);

      let earnedGold = 0;
      let workingAnimals = [];

      if (offlineSeconds > 5) {
        workingAnimals = await Animal.find({ ownerId: user._id, status: 'working' });
        
        if (workingAnimals.length > 0) {
          // Calculate Gold
          earnedGold = workingAnimals.reduce((total, animal) => {
            const breedInfo = MOCK_GAME_CONFIGS.animal_breeds.find(b => b.breedId === animal.breedId);
            const speed = breedInfo?.baseAttributes?.speed || 1;
            return total + (offlineSeconds * speed);
          }, 0);
          earnedGold = Math.floor(earnedGold);

          // Calculate and update EXP for each animal
          const earnedExp = offlineSeconds * MOCK_GAME_CONFIGS.expPerSecond;
          const expUpdatePromises = workingAnimals.map(animal => 
            Animal.updateOne({ _id: animal._id }, { $inc: { exp: earnedExp } })
          );
          await Promise.all(expUpdatePromises);
        }
      }

      user.lastLoginAt = now;
      user.gold += earnedGold;
      await user.save();
      
      res.status(200).json({
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
        nickname,
        // other fields will use defaults from the schema
      });
      await user.save();
      
      res.status(201).json({
        message: 'User created successfully',
        data: {
          user,
          offlineEarnings: { gold: 0, duration: 0, animalCount: 0 }
        }
      });
    }
  } catch (error) {
    console.error('Error in user login:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
