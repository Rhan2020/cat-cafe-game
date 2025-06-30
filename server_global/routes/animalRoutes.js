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

// 所有动物路由都需要认证
router.use(protect);

router.get('/', getAnimals);
router.get('/:id', getAnimal);
router.put('/:id/name', updateAnimalName);
router.put('/:id/assign', assignAnimalToPost);
router.put('/:id/unassign', unassignAnimal);

module.exports = router;