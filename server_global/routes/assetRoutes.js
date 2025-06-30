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

// @route   POST /api/assets/upload
// @desc    上传新素材
// @access  Private
router.post('/upload', uploadAsset);

// @route   GET /api/assets/stats
// @desc    获取素材统计信息
// @access  Private
router.get('/stats', getAssetStats);

// @route   POST /api/assets/batch
// @desc    批量操作素材
// @access  Private
router.post('/batch', batchOperateAssets);

// @route   GET /api/assets
// @desc    获取素材列表
// @access  Private
router.get('/', getAssets);

// @route   GET /api/assets/:id
// @desc    获取单个素材详情
// @access  Private
router.get('/:id', getAssetById);

// @route   PUT /api/assets/:id
// @desc    更新素材信息
// @access  Private
router.put('/:id', updateAsset);

// @route   DELETE /api/assets/:id
// @desc    删除素材
// @access  Private
router.delete('/:id', deleteAsset);

module.exports = router;