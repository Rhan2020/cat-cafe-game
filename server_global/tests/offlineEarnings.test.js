const { calculateOfflineEarnings } = require('../utils/offlineEarnings');
const User = require('../models/User');

describe('Offline Earnings', () => {
  it('calculates positive earnings including facility bonus', async () => {
    const user = await User.create({
      authProviderId:'u1', authProvider:'local', nickname:'Test',
      lastActiveAt:new Date(Date.now()-3600_000), // 1h offline
      shop:{ level:1, facilities:{ coffee_machine:1 }}
    });
    const gold = await calculateOfflineEarnings(user);
    expect(gold).toBeGreaterThan(0);
  });
});