#!/usr/bin/env python3
"""
目录结构创建脚本（简化版）
创建完整的素材目录结构和配置文件，不依赖外部库
"""

import os

def ensure_dir(path):
    """确保目录存在"""
    os.makedirs(path, exist_ok=True)
    print(f"Created directory: {path}")

def create_file(path, content):
    """创建文件"""
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Created file: {path}")

def create_directory_structure():
    """创建完整的目录结构"""
    print("创建目录结构...")
    
    directories = [
        # 角色素材
        "Characters/Cats/orange_cat",
        "Characters/Cats/white_cat", 
        "Characters/Cats/black_cat",
        "Characters/Cats/gray_cat",
        "Characters/Cats/sakura_cat",
        "Characters/Cats/princess_cat",
        "Characters/Dogs/golden_welcome",
        "Characters/Dogs/shiba_reception", 
        "Characters/Mice/cream_hamster",
        "Characters/NPCs/special_visitors",
        
        # UI素材
        "UI/gold_coin",
        "UI/diamond",
        "UI/coffee_cup",
        "UI/fish",
        "UI/settings",
        "UI/help",
        "UI/close",
        "UI/back",
        "UI/Buttons",
        "UI/Icons",
        "UI/Panels",
        "UI/Progress",
        "UI/Dialogue",
        
        # 道具素材
        "Items/coffee_beans",
        "Items/milk",
        "Items/sugar", 
        "Items/cat_cookie",
        "Items/skill_book",
        "Items/destiny_watch",
        "Items/Food",
        "Items/Equipment",
        "Items/Special",
        "Items/Currency",
        "Items/Fishing",
        
        # 场景素材
        "Scenes/coffee_shop_bg",
        "Scenes/fishing_area_bg",
        "Scenes/main_menu_bg",
        "Scenes/CoffeeShop",
        "Scenes/FishingArea",
        "Scenes/DeliveryMap",
        
        # 特效素材
        "Effects/Particles",
        "Effects/Animations",
        "Effects/Weather",
        
        # 音频素材
        "Audio/BGM",
        "Audio/SFX",
        
        # 其他
        "Fonts",
        "Localization"
    ]
    
    for directory in directories:
        ensure_dir(directory)

def create_asset_manifests():
    """创建素材清单文件"""
    print("创建素材清单...")
    
    # UI素材清单
    ui_manifest = {
        'gold_coin': ['64', '128', '256'],
        'diamond': ['64', '128', '256'],
        'coffee_cup': ['64', '128', '256'],
        'fish': ['64', '128', '256'],
        'settings': ['64', '128', '256'],
        'help': ['64', '128', '256'],
        'close': ['64', '128', '256'],
        'back': ['64', '128', '256']
    }
    
    for asset_name, sizes in ui_manifest.items():
        asset_dir = f"UI/{asset_name}"
        for size in sizes:
            placeholder_path = f"{asset_dir}/{asset_name}_{size}.placeholder"
            create_file(placeholder_path, f"# Placeholder for {asset_name} at {size}x{size} resolution")
    
    # 猫咪素材清单
    cat_manifest = {
        'orange_cat': ['64', '128', '256'],
        'white_cat': ['64', '128', '256'],
        'black_cat': ['64', '128', '256'],
        'gray_cat': ['64', '128', '256'],
        'sakura_cat': ['64', '128', '256'],
        'princess_cat': ['64', '128', '256']
    }
    
    for cat_name, sizes in cat_manifest.items():
        cat_dir = f"Characters/Cats/{cat_name}"
        for size in sizes:
            placeholder_path = f"{cat_dir}/{cat_name}_{size}.placeholder"
            create_file(placeholder_path, f"# Placeholder for {cat_name} at {size}x{size} resolution")
    
    # 道具素材清单
    item_manifest = {
        'coffee_beans': ['64', '128', '256'],
        'milk': ['64', '128', '256'],
        'sugar': ['64', '128', '256'],
        'cat_cookie': ['64', '128', '256'],
        'skill_book': ['64', '128', '256'],
        'destiny_watch': ['64', '128', '256']
    }
    
    for item_name, sizes in item_manifest.items():
        item_dir = f"Items/{item_name}"
        for size in sizes:
            placeholder_path = f"{item_dir}/{item_name}_{size}.placeholder"
            create_file(placeholder_path, f"# Placeholder for {item_name} at {size}x{size} resolution")
    
    # 场景背景清单
    scene_manifest = {
        'coffee_shop_bg': ['512', '1024', '2048'],
        'fishing_area_bg': ['512', '1024', '2048'],
        'main_menu_bg': ['512', '1024', '2048']
    }
    
    for scene_name, sizes in scene_manifest.items():
        scene_dir = f"Scenes/{scene_name}"
        for size in sizes:
            placeholder_path = f"{scene_dir}/{scene_name}_{size}.placeholder"
            create_file(placeholder_path, f"# Placeholder for {scene_name} at {size}x{size} resolution")

def create_readme_files():
    """为每个目录创建README文件"""
    print("创建README文件...")
    
    readme_configs = {
        "Characters/Cats": "猫咪角色素材\n支持尺寸: 64x64, 128x128, 256x256\n稀有度: N, R, SR, SSR, USR",
        "Characters/Dogs": "狗狗角色素材\n支持尺寸: 144x144\n专用岗位: 迎宾、保安",
        "Characters/Mice": "鼠鼠角色素材\n支持尺寸: 96x96\n专用岗位: 甜品研发",
        "UI": "用户界面素材\n包含按钮、图标、面板等\n支持尺寸: 64x64, 128x128, 256x256",
        "Items": "道具物品素材\n包含食物、设备、特殊道具\n支持尺寸: 64x64, 128x128, 256x256",
        "Scenes": "场景背景素材\n包含咖啡馆、钓鱼区等\n支持尺寸: 512x512, 1024x1024, 2048x2048",
        "Effects": "特效素材\n包含粒子效果、动画、天气效果",
        "Audio": "音频素材\n包含背景音乐(BGM)和音效(SFX)",
        "Fonts": "字体文件\n包含中文、英文、数字显示字体",
        "Localization": "本地化文件\n多语言文本配置"
    }
    
    for path, description in readme_configs.items():
        readme_path = f"{path}/README.md"
        content = f"""# {path}

{description}

## 文件命名规范

- 文件名格式: `asset_name_size.png`
- 示例: `orange_cat_128.png`

## 质量等级

- **低质量**: 最小尺寸版本，用于低性能设备
- **中等质量**: 标准尺寸版本，用于中等性能设备  
- **高质量**: 最大尺寸版本，用于高性能设备

## 注意事项

- 保持PNG格式和透明通道
- 所有素材保持正方形比例
- 文件大小控制在500KB以内
- 统一美术风格，萌系治愈风格
"""
        create_file(readme_path, content)

def create_asset_index():
    """创建素材索引文件"""
    content = """# 素材索引

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
"""
    
    create_file("ASSET_INDEX.md", content)

def create_development_notes():
    """创建开发说明"""
    content = """# 素材开发说明

## 当前状态

✅ 目录结构已创建  
✅ 配置文件已生成  
✅ 资源管理器已实现  
⚠️  素材文件为占位符，需要替换为实际PNG文件

## 下一步工作

1. **替换占位符文件**
   - 将 `.placeholder` 文件替换为对应的 `.png` 文件
   - 保持相同的文件名（除了扩展名）

2. **美术制作**
   - 参考已提供的SVG模板
   - 保持萌系治愈风格
   - 确保不同尺寸的一致性

3. **性能优化**
   - 压缩PNG文件
   - 控制文件大小
   - 测试加载速度

## 技术要求

- **文件格式**: PNG with Alpha
- **颜色模式**: RGBA
- **压缩**: 优化压缩
- **尺寸**: 严格按照配置的尺寸

## 质量检查

- [ ] 所有尺寸版本都存在
- [ ] 文件命名符合规范
- [ ] 图像质量良好
- [ ] 文件大小合理
- [ ] 透明通道正确

## 游戏集成

素材完成后，游戏将通过SimpleResourceManager自动：
- 检测设备性能
- 选择合适的素材质量
- 提供降级加载机制
- 管理内存使用

## 联系方式

如需帮助或有疑问，请查看：
- ASSET_GUIDE.md - 详细使用指南
- art_config.json - 完整配置文件
- missing_assets_final_check.md - 需求清单
"""
    
    create_file("DEVELOPMENT_NOTES.md", content)

def main():
    """主函数"""
    print("=== 素材目录结构创建脚本 ===")
    print("正在创建《猫咪咖啡馆与外卖江湖》素材目录结构...")
    
    # 创建目录结构
    create_directory_structure()
    
    # 创建素材清单
    create_asset_manifests()
    
    # 创建README文件
    create_readme_files()
    
    # 创建索引文件
    create_asset_index()
    
    # 创建开发说明
    create_development_notes()
    
    print("\n=== 目录结构创建完成 ===")
    print(f"目录位置: {os.path.abspath('.')}")
    print("\n下一步:")
    print("1. 查看 ASSET_INDEX.md 了解素材清单")
    print("2. 查看 DEVELOPMENT_NOTES.md 了解开发进度")
    print("3. 将 .placeholder 文件替换为实际的 .png 文件")
    print("4. 测试资源管理器加载功能")

if __name__ == "__main__":
    main()