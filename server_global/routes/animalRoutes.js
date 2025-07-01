const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAnimals,
  getAnimal,
  updateAnimalName,
  assignAnimalToPost,
  unassignAnimal
} = require('../controllers/animalController');

// res.t('auto.e68980e6')
router.use(protect);

router.get('/', getAnimals);
router.get('/:id', getAnimal);
router.put('/:id/name', updateAnimalName);
router.put('/:id/assign', assignAnimalToPost);
router.put('/:id/unassign', unassignAnimal);

module.exports = router;