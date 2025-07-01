const request = require('supertest');
const app = require('../index');
const { generateToken } = require('../middleware/auth');
const User = require('../models/User');

describe('Facility Upgrade', ()=>{
  it('upgrades coffee machine to level 1', async ()=>{
    const user = await User.create({authProviderId:'u2',authProvider:'local',nickname:'FUser',gold:1000});
    const token = generateToken(user._id);
    const res = await request(app)
      .post('/api/facilities/coffee_machine/upgrade')
      .set('Authorization',`Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.level).toBe(1);
  });
});