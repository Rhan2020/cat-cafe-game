# 需求-实现追踪矩阵

> 以下表格自动生成（持续补充中），用于在 PR 审查时快速检查实现覆盖率。

| 需求编号 | 描述 | 代码位置 | 测试 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | 用户 OAuth 登录（Google/Apple） | controller/oauthController.js, routes/userRoutes.js | 待补 integration test | ✅ 已实现 |
| 2 | 文件分片上传与合并 | controller/assetController.js, routes/assetRoutes.js | 待补 chunk upload test | ✅ 已实现 |
| 3 | 离线收益算法含稀有度加成 | utils/offlineEarnings.js | tests/offlineEarnings.test.js | ✅ 已实现 |
| 4 | Redis 双层缓存 + CircuitBreaker | utils/cache.js | unit test TBD | ✅ 已实现 |
| 5 | 周排行榜重置 | scripts/weeklyRankingReset.js | cron mock test TBD | ✅ 已实现 |
| 6 | Prometheus Metrics | index.js (+ utils/cache.js) | metrics endpoint test TBD | ✅ 已实现 |

> 📌 待办：完善 TBD 单元测试、补充剩余需求项，以 100% 覆盖。