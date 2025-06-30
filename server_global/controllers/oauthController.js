const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const googleClient = new OAuth2Client();

async function verifyGoogle(idToken) {
  const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  return {
    userId: payload.sub,
    nickname: payload.name || 'GoogleUser',
    avatar: payload.picture
  };
}

// Apple 验证可通过 apple-signin-auth，这里仅 stub
async function verifyApple(identityToken) {
  // TODO: implement real verification
  return {
    userId: identityToken, // fallback
    nickname: 'AppleUser',
    avatar: ''
  };
}

exports.oauthLogin = async (req, res) => {
  try {
    const { provider, idToken } = req.body;
    if (!provider || !idToken) {
      return res.status(400).json({ message: 'provider 和 idToken 为必填' });
    }

    let profile;
    switch (provider) {
      case 'google':
        profile = await verifyGoogle(idToken);
        break;
      case 'apple':
        profile = await verifyApple(idToken);
        break;
      default:
        return res.status(400).json({ message: '不支持的 provider' });
    }

    // 查找或创建用户
    let user = await User.findOne({ authProvider: provider, authProviderId: profile.userId });
    if (!user) {
      user = await User.create({
        authProvider: provider,
        authProviderId: profile.userId,
        nickname: profile.nickname,
        avatarUrl: profile.avatar
      });
    }

    // 更新最后登录
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({ message: '登录成功', data: { token, user } });
  } catch (err) {
    logger.error('OAuth 登录失败: %s', err.message);
    res.status(500).json({ message: 'OAuth 登录失败', error: err.message });
  }
};