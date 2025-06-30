const crypto = require('crypto');
const redis = require('redis');

// redis client (optional). If REDIS_URL not set, fallback to in-memory map
let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = redis.createClient({ url: process.env.REDIS_URL });
  redisClient.connect().catch(console.error);
}

// fallback map with TTL 10 min
const localNonceStore = new Map();
function isReplay(nonce) {
  const now = Date.now();
  // clean expired
  for (const [n, ts] of localNonceStore) {
    if (now - ts > 10 * 60 * 1000) localNonceStore.delete(n);
  }
  if (localNonceStore.has(nonce)) return true;
  localNonceStore.set(nonce, now);
  return false;
}

module.exports = function verifyHmac(req, res, next) {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  const nonce = req.headers['x-nonce'];

  if (!signature || !timestamp || !nonce) {
    return res.status(400).json({ code: 400, message: 'Missing signature headers' });
  }
  const tsInt = parseInt(timestamp, 10);
  if (isNaN(tsInt) || Math.abs(Date.now() - tsInt) > 5 * 60 * 1000) {
    return res.status(400).json({ code: 400, message: 'Timestamp invalid or expired' });
  }

  // anti-replay check
  const checkNonce = async () => {
    if (redisClient) {
      const exists = await redisClient.exists(`nonce:${nonce}`);
      if (exists) return true;
      await redisClient.set(`nonce:${nonce}`, '1', { EX: 600 });
      return false;
    }
    return isReplay(nonce);
  };

  checkNonce().then(replayed => {
    if (replayed) {
      return res.status(400).json({ code: 400, message: 'Replay attack detected' });
    }

    const secret = process.env.API_HMAC_SECRET || 'default-secret';
    const bodyString = JSON.stringify(req.body || {});
    const baseString = `${timestamp}\n${nonce}\n${bodyString}`;
    const computed = crypto.createHmac('sha256', secret).update(baseString).digest('hex');
    if (computed !== signature) {
      return res.status(403).json({ code: 403, message: 'Invalid signature' });
    }
    next();
  }).catch(err => {
    console.error('HMAC verify error', err);
    return res.status(500).json({ code: 500, message: 'Internal error' });
  });
};