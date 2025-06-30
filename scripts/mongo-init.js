// MongoDB初始化脚本
// 创建游戏数据库和初始数据

// 切换到catcafe数据库
db = db.getSiblingDB('catcafe');

// 创建用户集合索引
db.users.createIndex({ "authProviderId": 1 }, { unique: true });
db.users.createIndex({ "lastLoginAt": 1 });
db.users.createIndex({ "createdAt": 1 });

// 创建动物集合索引
db.animals.createIndex({ "ownerId": 1 });
db.animals.createIndex({ "status": 1 });
db.animals.createIndex({ "breedId": 1 });
db.animals.createIndex({ "ownerId": 1, "status": 1 });

// 创建游戏配置集合索引
db.game_configs.createIndex({ "_id": 1 }, { unique: true });

// 插入初始游戏配置数据
db.game_configs.insertMany([
  {
    _id: "animal_breeds",
    data: [
      {
        breedId: "cat_001",
        species: "cat",
        name: "中华田园猫",
        rarity: "N",
        description: "最常见的猫咪，但潜力无限。",
        baseAttributes: {
          speed: 5,
          luck: 1,
          energy: 10,
          charm: 3
        },
        skills: ["basic_work"]
      },
      {
        breedId: "cat_002",
        species: "cat",
        name: "英国短毛猫",
        rarity: "R",
        description: "优雅的贵族猫咪，工作效率很高。",
        baseAttributes: {
          speed: 8,
          luck: 3,
          energy: 15,
          charm: 7
        },
        skills: ["basic_work", "charm_boost"]
      },
      {
        breedId: "cat_003",
        species: "cat",
        name: "暹罗猫",
        rarity: "SR",
        description: "聪明伶俐的猫咪，擅长复杂的工作。",
        baseAttributes: {
          speed: 12,
          luck: 5,
          energy: 20,
          charm: 10
        },
        skills: ["basic_work", "speed_boost", "smart_work"]
      },
      {
        breedId: "dog_001",
        species: "dog",
        name: "柴犬",
        rarity: "R",
        description: "忠诚的守护者，专门负责安保工作。",
        baseAttributes: {
          speed: 6,
          luck: 4,
          energy: 25,
          charm: 8
        },
        skills: ["guard_duty", "customer_service"]
      }
    ]
  },
  {
    _id: "items",
    data: [
      {
        itemId: "item_001",
        name: "猫爪饼干",
        description: "可以为动物增加经验值的美味饼干。",
        type: "consumable",
        rarity: "N",
        effect: {
          action: "add_exp",
          value: 50
        },
        price: 100
      },
      {
        itemId: "item_002",
        name: "体力药水",
        description: "恢复动物体力的神奇药水。",
        type: "consumable",
        rarity: "N",
        effect: {
          action: "restore_energy",
          value: 100
        },
        price: 50
      },
      {
        itemId: "item_003",
        name: "技能书：工作效率提升",
        description: "学习后可以获得工作效率提升技能。",
        type: "skill_book",
        rarity: "R",
        effect: {
          action: "learn_skill",
          skillId: "efficiency_boost"
        },
        price: 500
      }
    ]
  },
  {
    _id: "level_up_exp",
    data: [
      100,  // 1->2级
      250,  // 2->3级
      500,  // 3->4级
      1000, // 4->5级
      2000, // 5->6级
      4000, // 6->7级
      8000, // 7->8级
      15000, // 8->9级
      25000, // 9->10级
      40000  // 10->11级
    ]
  },
  {
    _id: "shop_configs",
    data: {
      refreshTime: "00:00", // 每日刷新时间
      items: [
        {
          itemId: "item_001",
          price: 100,
          currency: "gold",
          stock: 10
        },
        {
          itemId: "item_002",
          price: 50,
          currency: "gold",
          stock: 20
        }
      ]
    }
  }
]);

print("MongoDB初始化完成！");
print("- 创建了索引");
print("- 插入了初始游戏配置数据");
print("数据库catcafe已准备就绪！");