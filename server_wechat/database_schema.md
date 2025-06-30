# 微信云开发 - 数据库结构设计

本文档定义了游戏在微信云开发环境下的核心数据库集合（Collections）及其结构。

---

### 1. `users` - 用户集合

存储玩家的核心数据。`_id` 字段将使用微信用户的 `openid`。

| 字段名 | 类型 | 描述 | 示例 |
| --- | --- | --- | --- |
| `_id` | String | 用户 OpenID | `o_xxxxxxxxxxxx` |
| `createdAt` | Date | 用户创建时间 | `ISODate("...")` |
| `lastLoginAt` | Date | 用户最后登录时间 | `ISODate("...")` |
| `nickname` | String | 用户昵称（可自定义） | "主人" |
| `avatarUrl` | String | 用户头像URL | `https://...` |
| `gold` | Number | 金币数量 | `1000` |
| `gems` | Number | 钻石数量（付费货币） | `100` |
| `inventory` | Object | 道具仓库 `{ "itemID": count }` | `{"item_001": 10}`|
| `settings` | Object | 用户设置（如音量） | `{"music": 0.5}` |
| `debut` | Object | 用户的开局信息 | `{"type": "N", "debt": 5000}` |
| `shop` | Object | 店铺信息 | `{"level": 1, "posts": [], "facilities": {}}` |
| `fishing` | Object | 渔场数据 | `{"level": 1, "fishCount": 0}` |
| `dailyData` | Object | 每日数据 | `{"wheelSpins": 1, "lastWheelReset": "2024-01-01"}` |
| `friends` | Array | 好友列表 | `["openid1", "openid2"]` |
| `achievements` | Array | 成就列表 | `["achievement_001"]` |
| `statistics` | Object | 统计数据 | `{"totalEarnings": 10000, "animalsCollected": 5}` |

---

### 2. `animals` - 动物员工集合

存储每个玩家拥有的所有动物实例。

| 字段名 | 类型 | 描述 | 示例 |
| --- | --- | --- | --- |
| `_id` | String | 动物唯一ID (自动生成) | `animal_xxxxxxxx` |
| `ownerId` | String | 所属用户的 OpenID | `o_xxxxxxxxxxxx` |
| `species` | String | 物种 (cat, dog, hamster) | `cat` |
| `breedId` | String | 品种ID (对应配置表) | `cat_001` (橘猫) |
| `name` | String | 动物昵称（可改） | "小橘" |
| `level` | Number | 等级 | `5` |
| `exp` | Number | 当前经验值 | `120` |
| `status` | String | 当前状态 (working, idle, fishing, delivery) | `working` |
| `assignedPost`| String | 被分配的岗位ID | `post_kitchen` |
| `skills` | Array | 掌握的技能ID列表 | `["skill_01"]` |
| `attributes` | Object | 核心属性 | `{"speed": 10, "luck": 5, "cooking": 8, "charm": 6}`|
| `fatigue` | Number | 疲劳值 (0-100) | `30` |
| `mood` | Number | 心情值 (0-100) | `80` |
| `outfit` | String | 当前服装ID | `outfit_001` |
| `contractInfo` | Object | 契约信息（好友邀请获得的动物） | `{"fromFriend": "openid", "contractType": "loyal_dog"}` |

---

### 3. `delivery_events` - 外卖事件集合

存储进行中的外卖配送和随机事件。

| 字段名 | 类型 | 描述 | 示例 |
| --- | --- | --- | --- |
| `_id` | String | 事件唯一ID | `delivery_xxxxxxxx` |
| `ownerId` | String | 所属用户的 OpenID | `o_xxxxxxxxxxxx` |
| `animalId` | String | 执行配送的动物ID | `animal_xxxxxxxx` |
| `eventType` | String | 事件类型 | `normal_delivery`, `random_event` |
| `eventId` | String | 具体事件ID（配置表） | `event_help_cat` |
| `status` | String | 事件状态 | `in_progress`, `waiting_choice`, `completed` |
| `startTime` | Date | 开始时间 | `ISODate("...")` |
| `endTime` | Date | 预计结束时间 | `ISODate("...")` |
| `choices` | Array | 可选择的选项 | `[{"id": "help", "text": "帮助它"}]` |
| `selectedChoice` | String | 已选择的选项ID | `help` |
| `result` | Object | 事件结果 | `{"goldReward": 100, "itemReward": "item_001"}` |
| `timeoutAction` | String | 超时默认行为 | `random_choice` |

---

### 4. `fishing_sessions` - 钓鱼会话集合

存储进行中的钓鱼活动。

| 字段名 | 类型 | 描述 | 示例 |
| --- | --- | --- | --- |
| `_id` | String | 会话唯一ID | `fishing_xxxxxxxx` |
| `ownerId` | String | 所属用户的 OpenID | `o_xxxxxxxxxxxx` |
| `animalIds` | Array | 参与钓鱼的动物ID列表 | `["animal_001", "animal_002"]` |
| `collaborators` | Array | 协作钓鱼的好友列表 | `["openid1"]` |
| `startTime` | Date | 开始时间 | `ISODate("...")` |
| `endTime` | Date | 预计结束时间 | `ISODate("...")` |
| `status` | String | 状态 | `active`, `completed` |
| `catches` | Array | 钓到的物品 | `[{"itemId": "fish_001", "count": 2}]` |
| `baitUsed` | String | 使用的鱼饵 | `bait_001` |
| `luckBonus` | Number | 幸运加成 | `1.2` |

---

### 5. `social_actions` - 社交行为集合

存储好友间的互动行为。

| 字段名 | 类型 | 描述 | 示例 |
| --- | --- | --- | --- |
| `_id` | String | 行为唯一ID | `social_xxxxxxxx` |
| `fromUserId` | String | 发起用户的 OpenID | `o_xxxxxxxxxxxx` |
| `toUserId` | String | 目标用户的 OpenID | `o_yyyyyyyyyyyy` |
| `actionType` | String | 行为类型 | `help_delivery`, `hire_animal`, `gift_item` |
| `relatedId` | String | 相关对象ID | `delivery_xxxxxxxx` |
| `status` | String | 状态 | `pending`, `completed`, `expired` |
| `reward` | Object | 奖励信息 | `{"gold": 50}` |
| `createdAt` | Date | 创建时间 | `ISODate("...")` |
| `expiredAt` | Date | 过期时间 | `ISODate("...")` |

---

### 6. `game_configs` - 游戏配置集合

存储游戏的全局配置，方便后台修改，实现热更新。

#### 子配置类型：

**6.1 `animal_breeds` - 动物品种配置**
```json
{
  "_id": "animal_breeds",
  "data": [
    {
      "breedId": "cat_001",
      "species": "cat",
      "name": "中华田园猫",
      "rarity": "N",
      "description": "最常见的猫咪，但潜力无限。",
      "baseAttributes": {
        "speed": 5,
        "luck": 1,
        "cooking": 3,
        "charm": 2,
        "stamina": 10
      },
      "skillSlots": 1,
      "allowedPosts": ["kitchen", "counter", "delivery"],
      "avatarUrl": "placeholder_cat_001.png"
    }
  ]
}
```

**6.2 `posts` - 岗位配置**
```json
{
  "_id": "posts",
  "data": [
    {
      "postId": "kitchen",
      "name": "后厨",
      "description": "制作美味的食物",
      "requiredSpecies": ["cat"],
      "baseProduction": 10,
      "unlockLevel": 1
    },
    {
      "postId": "reception",
      "name": "迎宾",
      "description": "欢迎客人，提升客流",
      "requiredSpecies": ["dog"],
      "baseProduction": 0,
      "effect": "customer_flow_boost",
      "unlockLevel": 3
    }
  ]
}
```

**6.3 `items` - 道具配置**
```json
{
  "_id": "items",
  "data": [
    {
      "itemId": "item_001",
      "name": "猫爪饼干",
      "description": "可以为动物增加经验值。",
      "type": "consumable",
      "effect": {
        "action": "add_exp",
        "value": 50
      },
      "iconUrl": "placeholder_item_001.png"
    }
  ]
}
```

**6.4 `skills` - 技能配置**
```json
{
  "_id": "skills",
  "data": [
    {
      "skillId": "skill_001",
      "name": "订单暴击",
      "description": "有概率获得双倍收益",
      "type": "passive",
      "trigger": "order_complete",
      "effect": {
        "chance": 0.2,
        "multiplier": 2.0
      },
      "requiredLevel": 5
    }
  ]
}
```

**6.5 `delivery_events` - 外卖事件配置**
```json
{
  "_id": "delivery_events",
  "data": [
    {
      "eventId": "event_help_cat",
      "name": "路遇受伤猫咪",
      "description": "你的外卖员遇到了一只受伤的猫咪",
      "weight": 10,
      "choices": [
        {
          "id": "help",
          "text": "帮助它",
          "outcomes": [
            {
              "probability": 0.7,
              "result": {
                "goldReward": 100,
                "message": "获得了猫咪的感谢！"
              }
            },
            {
              "probability": 0.3,
              "result": {
                "goldLoss": 50,
                "message": "被猫咪讹上了..."
              }
            }
          ]
        },
        {
          "id": "ignore",
          "text": "绕道而行",
          "outcomes": [
            {
              "probability": 0.9,
              "result": {
                "message": "平安送达"
              }
            },
            {
              "probability": 0.1,
              "result": {
                "debuff": "cold_cat",
                "message": "被拍下冷漠瞬间，声誉下降"
              }
            }
          ]
        }
      ],
      "timeLimit": 5000,
      "defaultChoice": "random"
    }
  ]
}
```

**6.6 `level_up_exp` - 升级经验配置**
```json
{
  "_id": "level_up_exp",
  "data": [100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000]
}
```

**6.7 `wheel_rewards` - 转盘奖励配置**
```json
{
  "_id": "wheel_rewards",
  "data": [
    {
      "id": "gold_small",
      "name": "少量金币",
      "type": "gold",
      "amount": 100,
      "weight": 30
    },
    {
      "id": "fate_watch",
      "name": "命运怀表",
      "type": "item",
      "itemId": "fate_watch",
      "amount": 1,
      "weight": 1
    }
  ]
}
```

**6.8 `startup_scenarios` - 开局剧本配置**
```json
{
  "_id": "startup_scenarios",
  "data": [
    {
      "scenarioId": "heaven_start",
      "name": "天胡开局",
      "rarity": "SSR",
      "weight": 1,
      "description": "你继承的不是咖啡馆，而是一座金山！",
      "rewards": {
        "gold": 50000,
        "gems": 500,
        "animals": [{"breedId": "cat_sr_001", "level": 5}]
      }
    },
    {
      "scenarioId": "normal_start",
      "name": "标准开局",
      "rarity": "R",
      "weight": 70,
      "description": "一家小小的店，一只学徒猫。",
      "rewards": {
        "gold": 1000,
        "animals": [{"breedId": "cat_001", "level": 1}]
      }
    },
    {
      "scenarioId": "hell_start",
      "name": "地狱开局",
      "rarity": "N",
      "weight": 20,
      "description": "咖啡馆已经倒闭，只剩下一辆破旧的外卖车...",
      "rewards": {
        "gold": -5000,
        "animals": [{"breedId": "cat_001", "level": 1}],
        "debt": 5000
      }
    }
  ]
}
```

---

### 7. `admin_logs` - 管理员操作日志

存储管理员在后台进行的所有操作，用于审计。

| 字段名 | 类型 | 描述 | 示例 |
| --- | --- | --- | --- |
| `_id` | String | 日志唯一ID | `log_xxxxxxxx` |
| `adminId` | String | 管理员ID | `admin_001` |
| `action` | String | 操作类型 | `update_config`, `grant_reward` |
| `targetType` | String | 操作对象类型 | `user`, `config` |
| `targetId` | String | 操作对象ID | `o_xxxxxxxxxxxx` |
| `details` | Object | 操作详情 | `{"configType": "items", "changes": {...}}` |
| `timestamp` | Date | 操作时间 | `ISODate("...")` |
| `ipAddress` | String | 操作IP | `192.168.1.1` |

---

### 8. `user_transactions` - 用户交易记录

存储所有涉及虚拟货币的交易。

| 字段名 | 类型 | 描述 | 示例 |
| --- | --- | --- | --- |
| `_id` | String | 交易唯一ID | `trans_xxxxxxxx` |
| `userId` | String | 用户 OpenID | `o_xxxxxxxxxxxx` |
| `type` | String | 交易类型 | `earn`, `spend`, `purchase` |
| `currency` | String | 货币类型 | `gold`, `gems` |
| `amount` | Number | 变化数量（正数收入，负数支出） | `100` |
| `reason` | String | 交易原因 | `offline_earnings`, `animal_upgrade` |
| `relatedId` | String | 相关对象ID | `animal_xxxxxxxx` |
| `timestamp` | Date | 交易时间 | `ISODate("...")` |
| `balance` | Number | 交易后余额 | `1500` |
