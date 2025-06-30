const express = require('express');
const router = express.Router();
const {
  uploadAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  getAssetStats,
  batchOperateAssets
} = require('../controllers/assetController');
const { validateAssetUpload, validateAssetUpdate } = require('../middleware/validation');
const { authenticateToken, requireEditor, requireAdmin } = require('../middleware/auth');

// @route   POST /api/assets/upload
// @desc    res.t('auto.e4b88ae4')
// @access  Private (res.t('auto.e99c80e8'))
router.post('/upload', authenticateToken, requireEditor, uploadAsset);

// @route   GET /api/assets/stats
// @desc    res.t('auto.e88eb7e5')
// @access  Private (res.t('auto.e99c80e8'))
router.get('/stats', authenticateToken, getAssetStats);

// @route   POST /api/assets/batch
// @desc    res.t('auto.e689b9e9')
// @access  Private (res.t('auto.e99c80e8'))
router.post('/batch', authenticateToken, requireAdmin, batchOperateAssets);

// @route   GET /api/assets
// @desc    res.t('auto.e88eb7e5')
// @access  Private (res.t('auto.e99c80e8'))
router.get('/', authenticateToken, getAssets);

// @route   GET /api/assets/:id
// @desc    res.t('auto.e88eb7e5')
// @access  Private (res.t('auto.e99c80e8'))
router.get('/:id', authenticateToken, getAssetById);

// @route   PUT /api/assets/:id
// @desc    res.t('auto.e69bb4e6')
// @access  Private (res.t('auto.e99c80e8'))
router.put('/:id', authenticateToken, requireEditor, updateAsset);

// @route   DELETE /api/assets/:id
// @desc    res.t('auto.e588a0e9')
// @access  Private (res.t('auto.e99c80e8'))
router.delete('/:id', authenticateToken, requireAdmin, deleteAsset);

module.exports = router;