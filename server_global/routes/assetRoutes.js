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
// @desc    上传新素材
// @access  Private (需要编辑权限)
router.post('/upload', authenticateToken, requireEditor, uploadAsset);

// @route   GET /api/assets/stats
// @desc    获取素材统计信息
// @access  Private (需要认证)
router.get('/stats', authenticateToken, getAssetStats);

// @route   POST /api/assets/batch
// @desc    批量操作素材
// @access  Private (需要管理员权限)
router.post('/batch', authenticateToken, requireAdmin, batchOperateAssets);

// @route   GET /api/assets
// @desc    获取素材列表
// @access  Private (需要认证)
router.get('/', authenticateToken, getAssets);

// @route   GET /api/assets/:id
// @desc    获取单个素材详情
// @access  Private (需要认证)
router.get('/:id', authenticateToken, getAssetById);

// @route   PUT /api/assets/:id
// @desc    更新素材信息
// @access  Private (需要编辑权限)
router.put('/:id', authenticateToken, requireEditor, updateAsset);

// @route   DELETE /api/assets/:id
// @desc    删除素材
// @access  Private (需要管理员权限)
router.delete('/:id', authenticateToken, requireAdmin, deleteAsset);

module.exports = router;