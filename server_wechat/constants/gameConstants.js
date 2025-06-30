// 游戏核心常量定义
module.exports = {
  // 时间相关常量
  TIME: {
    MAX_UPDATE_INTERVAL_SECONDS: 300, // 最大更新间隔：5分钟
    MAX_OFFLINE_HOURS: 24, // 最大离线收益时间：24小时
    SAVE_INTERVAL_SECONDS: 30, // 自动保存间隔：30秒
  },

  // 收益相关常量
  EARNINGS: {
    MAX_SPEED_PER_SECOND: 100, // 每秒最大收益速度：100金币
    MAX_OFFLINE_GOLD: 1000000, // 最大离线收益：100万金币
    GOLD_TOLERANCE_PERCENT: 0.01, // 金币验证容错率：1%
    MIN_GOLD_TOLERANCE: 10, // 最小金币容错值：10金币
  },

  // 用户相关常量
  USER: {
    INITIAL_GOLD: 1000, // 新用户初始金币
    INITIAL_GEMS: 100, // 新用户初始钻石
    INITIAL_DEBT: 5000, // 地狱开局初始债务
    MAX_NICKNAME_LENGTH: 50, // 昵称最大长度
  },

  // 动物相关常量
  ANIMAL: {
    MAX_LEVEL: 100, // 动物最大等级
    VALID_POSTS: ['post_kitchen', 'post_bar', 'post_delivery', 'post_reception', 'post_security'], // 有效岗位列表
    VALID_STATUSES: ['idle', 'working', 'fishing'], // 有效状态列表
  },

  // 文件上传常量
  UPLOAD: {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 最大文件大小：50MB
    THUMBNAIL_SIZE: 200, // 缩略图尺寸：200px
    THUMBNAIL_QUALITY: 80, // 缩略图质量：80%
  },

  // 缓存相关常量
  CACHE: {
    MAX_ASSET_CACHE_SIZE: 100 * 1024 * 1024, // 最大素材缓存：100MB
    DEFAULT_AUDIO_SAMPLE_RATE: 44100, // 默认音频采样率
    AUDIO_CHANNELS: 2, // 音频声道数
    AUDIO_BIT_DEPTH: 2, // 音频位深度（字节）
  },

  // 验证相关常量
  VALIDATION: {
    MAX_POST_ID_LENGTH: 50, // 岗位ID最大长度
    MIN_ASSET_NAME_LENGTH: 1, // 素材名称最小长度
    MAX_ASSET_NAME_LENGTH: 100, // 素材名称最大长度
  },

  // 错误代码
  ERROR_CODES: {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
  }
};