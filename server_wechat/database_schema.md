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
| `status` | String | 当前状态 (working, idle, fishing) | `working` |
| `assignedPost`| String | 被分配的岗位ID | `post_kitchen` |
| `skills` | Array | 掌握的技能ID列表 | `["skill_01"]` |
| `attributes` | Object | 核心属性 | `{"speed": 10, "luck": 5}`|

---

### 3. `game_configs` - 游戏配置集合

存储游戏的全局配置，方便后台修改，实现热更新。文档ID可以是配置的类型，如 `animal_breeds`, `items`。

#### 示例1: `doc(animal_breeds)`

| 字段名 | 类型 | 描述 |
| --- | --- | --- |
| `_id` | String | `animal_breeds` |
| `data` | Array | 动物品种配置数组 |

**`data` 数组中每个对象的结构:**
```json
{
  "breedId": "cat_001",
  "species": "cat",
  "name": "中华田园猫",
  "rarity": "N",
  "description": "最常见的猫咪，但潜力无限。",
  "baseAttributes": {"speed": 5, "luck": 1}
}
```

#### 示例2: `doc(items)`

| 字段名 | 类型 | 描述 |
| --- | --- | --- |
| `_id` | String | `items` |
| `data` | Array | 道具配置数组 |

**`data` 数组中每个对象的结构:**
```json
{
  "itemId": "item_001",
  "name": "猫爪饼干",
  "description": "可以为动物增加经验值。",
  "effect": {"action": "add_exp", "value": 50}
}
```

#### 示例3: `doc(level_up_exp)`

| 字段名 | 类型 | 描述 |
| --- | --- | --- |
| `_id` | String | `level_up_exp` |
| `data` | Array | 存储每个等级升级所需的经验值 |

**`data` 数组的结构:**
索引 `i` 对应从 `i+1` 级升到 `i+2` 级所需的经验值。
例如 `data[0]` 是从1级升2级所需经验, `data[1]` 是从2级升3级...
```json
// [100, 250, 500, 1000, ... ]
[
  100,
  250,
  500,
  1000
]
```
