const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAnimals,
  getAnimal,
  updateAnimalName,
  assignAnimalToPost,
  unassignAnimal,
  upgradeAnimal,
  restAnimal
} = require('../controllers/animalController');

// res.t('auto.e68980e6')
router.use(protect);

router.get('/', getAnimals);
router.get('/:id', getAnimal);
router.put('/:id/name', updateAnimalName);
router.put('/:id/assign', assignAnimalToPost);
router.put('/:id/unassign', unassignAnimal);
router.post('/:id/upgrade', upgradeAnimal);
router.post('/:id/rest', restAnimal);

module.exports = router;