#!/usr/bin/env python3
"""
素材生成脚本
自动将SVG文件转换为不同尺寸的PNG文件，用于适配不同分辨率的设备
"""

import os
import sys
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import colorsys

def ensure_dir(path):
    """确保目录存在"""
    os.makedirs(path, exist_ok=True)

def create_simple_icon(size, color, text, output_path):
    """创建简单的图标"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 绘制圆形背景
    margin = size // 10
    draw.ellipse([margin, margin, size-margin, size-margin], fill=color)
    
    # 添加文字
    if text:
        try:
            font_size = size // 6
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            font = ImageFont.load_default()
        
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        x = (size - text_width) // 2
        y = (size - text_height) // 2
        
        draw.text((x, y), text, fill='white', font=font)
    
    img.save(output_path)
    print(f"Created: {output_path}")

def create_cat_icon(size, color_scheme, output_path):
    """创建猫咪图标"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    center = size // 2
    
    # 猫咪头部
    head_radius = size // 3
    draw.ellipse([center - head_radius, center - head_radius, 
                  center + head_radius, center + head_radius], 
                 fill=color_scheme['body'])
    
    # 猫耳朵
    ear_size = head_radius // 2
    # 左耳
    draw.polygon([center - head_radius + ear_size//2, center - head_radius,
                  center - head_radius//2, center - head_radius - ear_size,
                  center - head_radius//4, center - head_radius], 
                 fill=color_scheme['body'])
    # 右耳
    draw.polygon([center + head_radius//4, center - head_radius,
                  center + head_radius//2, center - head_radius - ear_size,
                  center + head_radius - ear_size//2, center - head_radius], 
                 fill=color_scheme['body'])
    
    # 眼睛
    eye_size = size // 20
    draw.ellipse([center - head_radius//2, center - head_radius//3,
                  center - head_radius//2 + eye_size*2, center - head_radius//3 + eye_size*3],
                 fill='#90EE90')
    draw.ellipse([center + head_radius//2 - eye_size*2, center - head_radius//3,
                  center + head_radius//2, center - head_radius//3 + eye_size*3],
                 fill='#90EE90')
    
    # 鼻子
    nose_size = size // 40
    draw.polygon([center, center,
                  center - nose_size, center + nose_size,
                  center + nose_size, center + nose_size],
                 fill='#FFB6C1')
    
    img.save(output_path)
    print(f"Created: {output_path}")

def generate_ui_assets():
    """生成UI素材"""
    print("生成UI素材...")
    
    ui_assets = {
        'gold_coin': {'color': '#FFD700', 'text': '金'},
        'diamond': {'color': '#4169E1', 'text': '钻'},
        'coffee_cup': {'color': '#8B4513', 'text': '咖'},
        'fish': {'color': '#87CEEB', 'text': '鱼'},
        'settings': {'color': '#808080', 'text': '设'},
        'help': {'color': '#32CD32', 'text': '?'},
        'close': {'color': '#DC143C', 'text': 'X'},
        'back': {'color': '#4682B4', 'text': '←'},
    }
    
    sizes = [64, 128, 256]
    
    for asset_name, config in ui_assets.items():
        for size in sizes:
            output_dir = f"UI/{asset_name}"
            ensure_dir(output_dir)
            output_path = f"{output_dir}/{asset_name}_{size}.png"
            create_simple_icon(size, config['color'], config['text'], output_path)

def generate_cat_assets():
    """生成猫咪素材"""
    print("生成猫咪素材...")
    
    cat_variants = {
        'orange_cat': {'body': '#FFA500', 'accent': '#FF8C00'},
        'white_cat': {'body': '#F5F5F5', 'accent': '#E0E0E0'},
        'black_cat': {'body': '#2F2F2F', 'accent': '#1C1C1C'},
        'gray_cat': {'body': '#808080', 'accent': '#696969'},
        'sakura_cat': {'body': '#FFB6C1', 'accent': '#FF69B4'},
        'princess_cat': {'body': '#DDA0DD', 'accent': '#9370DB'},
    }
    
    sizes = [64, 128, 256]
    
    for cat_name, colors in cat_variants.items():
        for size in sizes:
            output_dir = f"Characters/Cats/{cat_name}"
            ensure_dir(output_dir)
            output_path = f"{output_dir}/{cat_name}_{size}.png"
            create_cat_icon(size, colors, output_path)

def generate_item_assets():
    """生成道具素材"""
    print("生成道具素材...")
    
    item_assets = {
        'coffee_beans': {'color': '#8B4513', 'text': '豆'},
        'milk': {'color': '#FFFAF0', 'text': '奶'},
        'sugar': {'color': '#FFFFFF', 'text': '糖'},
        'cat_cookie': {'color': '#DEB887', 'text': '饼'},
        'skill_book': {'color': '#4169E1', 'text': '书'},
        'destiny_watch': {'color': '#FFD700', 'text': '表'},
    }
    
    sizes = [64, 128, 256]
    
    for item_name, config in item_assets.items():
        for size in sizes:
            output_dir = f"Items/{item_name}"
            ensure_dir(output_dir)
            output_path = f"{output_dir}/{item_name}_{size}.png"
            create_simple_icon(size, config['color'], config['text'], output_path)

def generate_scene_backgrounds():
    """生成场景背景"""
    print("生成场景背景...")
    
    def create_gradient_background(size, color1, color2, output_path):
        img = Image.new('RGB', (size, size))
        draw = ImageDraw.Draw(img)
        
        for y in range(size):
            # 计算渐变
            ratio = y / size
            r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
            g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
            b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
            
            draw.line([(0, y), (size, y)], fill=(r, g, b))
        
        img.save(output_path)
        print(f"Created: {output_path}")
    
    backgrounds = {
        'coffee_shop_bg': ((255, 248, 220), (222, 184, 135)),  # 米色到棕色
        'fishing_area_bg': ((135, 206, 235), (70, 130, 180)),  # 天蓝到钢蓝
        'main_menu_bg': ((255, 239, 213), (255, 218, 185)),     # 桃色渐变
    }
    
    sizes = [512, 1024, 2048]
    
    for bg_name, (color1, color2) in backgrounds.items():
        for size in sizes:
            output_dir = f"Scenes/{bg_name}"
            ensure_dir(output_dir)
            output_path = f"{output_dir}/{bg_name}_{size}.png"
            create_gradient_background(size, color1, color2, output_path)

def create_directory_structure():
    """创建完整的目录结构"""
    print("创建目录结构...")
    
    directories = [
        "Characters/Cats",
        "Characters/Dogs", 
        "Characters/Mice",
        "Characters/NPCs",
        "UI/Buttons",
        "UI/Icons",
        "UI/Panels",
        "UI/Progress",
        "UI/Dialogue",
        "Items/Food",
        "Items/Equipment", 
        "Items/Special",
        "Items/Currency",
        "Items/Fishing",
        "Scenes/CoffeeShop",
        "Scenes/FishingArea",
        "Scenes/DeliveryMap",
        "Effects/Particles",
        "Effects/Animations",
        "Effects/Weather",
        "Audio/BGM",
        "Audio/SFX",
        "Fonts",
        "Localization"
    ]
    
    for directory in directories:
        ensure_dir(directory)
        # 创建README文件
        readme_path = f"{directory}/README.md"
        if not os.path.exists(readme_path):
            with open(readme_path, 'w', encoding='utf-8') as f:
                f.write(f"# {directory}\n\n")
                f.write(f"此目录用于存放{directory}相关的素材文件。\n\n")
                f.write("## 文件命名规范\n\n")
                f.write("- 文件名使用下划线连接：`asset_name_size.png`\n")
                f.write("- 支持的尺寸：64, 128, 256 (UI和角色)\n")
                f.write("- 支持的尺寸：512, 1024, 2048 (场景)\n\n")

def create_usage_guide():
    """创建使用说明"""
    guide_content = """# 素材使用指南

## 概述

本项目采用多分辨率适配方案，为不同性能的设备提供合适的素材质量。

## 目录结构

```
Art/
├── Characters/          # 角色素材
│   ├── Cats/           # 猫咪角色
│   ├── Dogs/           # 狗狗角色  
│   └── Mice/           # 鼠鼠角色
├── UI/                 # 界面素材
│   ├── Buttons/        # 按钮
│   ├── Icons/          # 图标
│   └── Panels/         # 面板
├── Items/              # 道具素材
│   ├── Food/           # 食物
│   ├── Equipment/      # 设备
│   └── Special/        # 特殊道具
├── Scenes/             # 场景素材
│   ├── CoffeeShop/     # 咖啡馆
│   └── FishingArea/    # 钓鱼区
└── Effects/            # 特效素材
```

## 命名规范

所有素材文件遵循以下命名规范：

```
{asset_name}_{size}.png
```

例如：
- `gold_coin_64.png` - 64x64像素的金币图标
- `orange_cat_128.png` - 128x128像素的橙猫角色
- `coffee_shop_bg_1024.png` - 1024x1024像素的咖啡馆背景

## 质量等级

### UI和角色素材 (正方形)
- **低质量**: 64x64px - 用于低性能设备
- **中等质量**: 128x128px - 用于中等性能设备
- **高质量**: 256x256px - 用于高性能设备

### 场景背景 (正方形)
- **低质量**: 512x512px
- **中等质量**: 1024x1024px  
- **高质量**: 2048x2048px

## 代码使用示例

```typescript
import { SimpleResourceManager } from '../Utils/SimpleResourceManager';

// 获取资源管理器实例
const resourceManager = SimpleResourceManager.getInstance();

// 获取金币图标路径（自动适配当前设备质量）
const goldCoinPath = resourceManager.getAssetPath('ui', 'gold_coin');

// 获取特定质量的素材路径
const highQualityPath = resourceManager.getAssetPath('ui', 'gold_coin', AssetQuality.HIGH);

// 获取带降级的素材路径列表
const fallbackPaths = resourceManager.getAssetPathsWithFallback('cats', 'orange_cat');
```

## 性能优化建议

1. **按需加载**: 只加载当前场景需要的素材
2. **预加载关键素材**: 预加载游戏启动必需的素材
3. **内存管理**: 定期清理不需要的素材缓存
4. **降级策略**: 加载失败时自动降级到低质量版本

## 添加新素材

1. 创建SVG源文件（推荐）
2. 运行生成脚本: `python generate_assets.py`
3. 手动调整生成的PNG文件（如需要）
4. 在资源管理器中注册新的素材类别

## 文件格式要求

- **图像格式**: PNG (支持透明通道)
- **颜色模式**: RGBA
- **压缩**: 优化后的PNG压缩
- **最大文件大小**: 单个文件不超过500KB

## 注意事项

- 所有素材必须是正方形比例
- 保持一致的美术风格
- 文件名不能包含中文字符
- 避免使用特殊符号
"""

    with open("ASSET_GUIDE.md", 'w', encoding='utf-8') as f:
        f.write(guide_content)
    
    print("Created: ASSET_GUIDE.md")

def main():
    """主函数"""
    print("=== 素材生成脚本 ===")
    print("正在生成《猫咪咖啡馆与外卖江湖》游戏素材...")
    
    # 创建目录结构
    create_directory_structure()
    
    # 生成各类素材
    generate_ui_assets()
    generate_cat_assets()
    generate_item_assets()
    generate_scene_backgrounds()
    
    # 创建使用指南
    create_usage_guide()
    
    print("\n=== 素材生成完成 ===")
    print(f"生成的素材位于: {os.path.abspath('.')}")
    print("请查看 ASSET_GUIDE.md 了解使用方法")

if __name__ == "__main__":
    main()