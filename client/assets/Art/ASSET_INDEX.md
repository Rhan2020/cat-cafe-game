# 素材索引

## 已创建的素材类别

### 角色素材 (Characters)
- **猫咪**: orange_cat, white_cat, black_cat, gray_cat, sakura_cat, princess_cat
- **狗狗**: golden_welcome, shiba_reception
- **鼠鼠**: cream_hamster

### UI素材 (UI) 
- **货币**: gold_coin, diamond
- **功能**: coffee_cup, fish, settings, help, close, back

### 道具素材 (Items)
- **食材**: coffee_beans, milk, sugar
- **特殊**: cat_cookie, skill_book, destiny_watch

### 场景素材 (Scenes)
- **背景**: coffee_shop_bg, fishing_area_bg, main_menu_bg

## 使用方法

1. 将placeholder文件替换为实际的PNG图片
2. 保持文件命名规范: `asset_name_size.png`
3. 使用SimpleResourceManager加载素材

## 代码示例

```typescript
import { SimpleResourceManager } from '../Utils/SimpleResourceManager';

const resourceManager = SimpleResourceManager.getInstance();
const goldCoinPath = resourceManager.getAssetPath('ui', 'gold_coin');
```

## 生成实际素材

要生成实际的PNG文件，请：

1. 安装图像处理软件 (如Photoshop, GIMP)
2. 使用提供的SVG模板作为基础
3. 导出为PNG格式，保持命名规范
4. 替换对应的placeholder文件

或者，如果有Python PIL环境，可以运行：
```bash
python3 generate_assets.py
```
