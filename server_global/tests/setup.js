const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);

  // seed minimal GameConfig docs
  const GameConfig = require('../models/GameConfig');
  await GameConfig.insertMany([
    { configType:'animal_breeds', version:'1', createdBy:'seed', data:[{breedId:'cat_001',species:'cat',rarity:'N',name:'SeedCat',baseAttributes:{}}]},
    { configType:'wheel_rewards', version:'1', createdBy:'seed', data:[{id:'gold_small',type:'gold',amount:100,weight:1}]},
    { configType:'facility_upgrades', version:'1', createdBy:'seed', data:[{id:'coffee_machine',levels:[{level:1,cost:0,productionBonus:5}]}]}
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});