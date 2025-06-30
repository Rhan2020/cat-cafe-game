/*
  Seed GameConfig collection with default delivery events and fish types.
  Usage: node scripts/seed_game_configs.js
*/

require('dotenv').config();
const mongoose = require('mongoose');
const GameConfig = require('../server_global/models/GameConfig');

(async () => {
  try {
    const dbURI = process.env.MONGODB_URI;
    if (!dbURI) throw new Error('MONGODB_URI not set');

    await mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const adminId = 'system_seed_script';

    // Delivery Events
    const deliveryEvents = [
      {
        eventId: 'help_or_ignore_cat',
        name: '扶不扶？',
        description: '外卖猫在路上遇到一只倒地呻吟的猫咪。',
        weight: 10,
        timeLimit: 5000,
        defaultChoice: 'ignore',
        choices: [
          {
            id: 'help',
            text: '扶它起来',
            outcomes: [
              { probability: 0.2, result: { goldReward: 300, message: '扶猫成功，获得感谢红包！' } },
              { probability: 0.8, result: { goldLoss: 200, debuff: 'framed', message: '被讹诈，损失金币...' } }
            ]
          },
          {
            id: 'ignore',
            text: '绕道而行',
            outcomes: [
              { probability: 0.8, result: { message: '平安无事' } },
              { probability: 0.2, result: { debuff: 'cold_title', goldLoss: 50, message: '被拍下冷漠猫，形象下滑' } }
            ]
          }
        ]
      },
      {
        eventId: 'bike_out_of_battery',
        name: '电瓶车没电',
        description: '送餐途中电瓶车突然没电了。',
        weight: 15,
        timeLimit: 0,
        defaultChoice: 'push',
        choices: [
          {
            id: 'push',
            text: '推车前进',
            outcomes: [
              { probability: 1.0, result: { goldLoss: 0, message: '费力但安全到达，略微延迟' } }
            ]
          },
          {
            id: 'call_friend',
            text: '求助好友',
            outcomes: [
              { probability: 1.0, result: { goldReward: 50, message: '好友援助，顺便打赏' } }
            ]
          }
        ]
      }
    ];

    await GameConfig.findOneAndUpdate(
      { configType: 'delivery_events' },
      {
        configType: 'delivery_events',
        version: '1.0.0',
        data: deliveryEvents,
        description: '默认外卖江湖事件',
        createdBy: adminId,
        updatedBy: adminId,
        isActive: true
      },
      { upsert: true }
    );

    // Fish Types
    const fishTypes = [
      { itemId: 'fish_common_1', name: '小鲫鱼', rarity: 'common', weight: 50 },
      { itemId: 'fish_common_2', name: '小鲤鱼', rarity: 'common', weight: 40 },
      { itemId: 'fish_uncommon_1', name: '草鱼', rarity: 'uncommon', weight: 30 },
      { itemId: 'fish_uncommon_2', name: '鲈鱼', rarity: 'uncommon', weight: 25 },
      { itemId: 'fish_rare_1', name: '金鱼', rarity: 'rare', weight: 10 },
      { itemId: 'fish_rare_2', name: '锦鲤', rarity: 'rare', weight: 8 },
      { itemId: 'fish_epic_1', name: '龙鱼', rarity: 'epic', weight: 3 },
      { itemId: 'fish_legendary_1', name: '传说之鱼', rarity: 'legendary', weight: 1 }
    ];

    await GameConfig.findOneAndUpdate(
      { configType: 'fish_types' },
      {
        configType: 'fish_types',
        version: '1.0.0',
        data: fishTypes,
        description: '默认鱼类掉落表',
        createdBy: adminId,
        updatedBy: adminId,
        isActive: true
      },
      { upsert: true }
    );

    // Special Visitors
    const specialVisitors = [
      {
        visitorId: 'mute_mountain_cat',
        name: '来自"无声山脉"的猫',
        description: '一只毛发粗糙、眼神胆怯的猫咪，身上带着泥土。',
        weight: 5,
        expireIn: 24 * 60 * 60 * 1000,
        choices: [
          {
            id: 'give_milk',
            text: '赠送一杯热牛奶',
            outcomes: [
              { probability: 1.0, result: { itemReward: 'warm_milk', message: '猫咪露出感激的笑容。' } }
            ]
          },
          {
            id: 'pat',
            text: '温柔地抚摸它',
            outcomes: [
              { probability: 1.0, result: { goldReward: 50, message: '猫咪感到安心，留下了金币。' } }
            ]
          },
          {
            id: 'ignore',
            text: '假装没看见',
            outcomes: [
              { probability: 1.0, result: { message: '猫咪悄悄离开……' } }
            ]
          }
        ]
      }
    ];

    await GameConfig.findOneAndUpdate(
      { configType: 'special_visitors' },
      {
        configType: 'special_visitors',
        version: '1.0.0',
        data: specialVisitors,
        description: '特殊访客事件',
        createdBy: adminId,
        updatedBy: adminId,
        isActive: true
      },
      { upsert: true }
    );

    // Cat Social Bubbles
    const catBubbles = [
      { context: 'barista', text: '只要我搭得够高，就能碰到天花板！' },
      { context: 'delivery', text: '哼，看那只猫扭来扭去的~ 真做作' },
      { context: 'fishing', text: '钓鱼真是一门哲学…' },
      { context: 'idle', text: '主人，摸摸～' }
    ];

    await GameConfig.findOneAndUpdate(
      { configType: 'cat_bubbles' },
      {
        configType: 'cat_bubbles',
        version: '1.0.0',
        data: catBubbles,
        description: '猫咪社交圈气泡文案',
        createdBy: adminId,
        updatedBy: adminId,
        isActive: true
      },
      { upsert: true }
    );

    console.log('GameConfig seeding completed');
    console.log('Special visitor & bubble configs seeded');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
})();