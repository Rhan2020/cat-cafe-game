#!/usr/bin/env python3
"""
演示素材生成脚本
生成简化的PNG文件用于测试资源管理器功能
不依赖外部库，使用基本的图形生成方法
"""

import os
import subprocess
import base64

def ensure_dir(path):
    """确保目录存在"""
    os.makedirs(path, exist_ok=True)

def create_simple_svg_png(svg_content, output_path, size):
    """创建简单的SVG并尝试转换为PNG"""
    # 创建SVG文件
    svg_path = output_path.replace('.png', '.svg')
    with open(svg_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    
    # 尝试使用系统工具转换SVG到PNG
    try:
        # 尝试使用imagemagick
        subprocess.run(['convert', svg_path, '-resize', f'{size}x{size}', output_path], 
                      check=True, capture_output=True)
        os.remove(svg_path)  # 清理SVG文件
        return True
    except:
        try:
            # 尝试使用inkscape
            subprocess.run(['inkscape', svg_path, '--export-png', output_path, 
                           '--export-width', str(size), '--export-height', str(size)], 
                          check=True, capture_output=True)
            os.remove(svg_path)
            return True
        except:
            # 如果转换失败，保留SVG文件作为占位符
            os.rename(svg_path, output_path.replace('.png', '_demo.svg'))
            return False

def create_gold_coin_demo(output_path, size):
    """创建金币演示素材"""
    svg_content = f'''<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="{size//2}" cy="{size//2}" r="{size//2-4}" fill="url(#goldGradient)" stroke="#CD853F" stroke-width="2"/>
  <text x="{size//2}" y="{size//2+8}" text-anchor="middle" font-family="serif" font-size="{size//6}" font-weight="bold" fill="#8B4513">金</text>
  <defs>
    <radialGradient id="goldGradient">
      <stop offset="0%" stop-color="#FFEF94"/>
      <stop offset="70%" stop-color="#FFD700"/>
      <stop offset="100%" stop-color="#B8860B"/>
    </radialGradient>
  </defs>
</svg>'''
    return create_simple_svg_png(svg_content, output_path, size)

def create_diamond_demo(output_path, size):
    """创建钻石演示素材"""
    center = size // 2
    svg_content = f'''<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" xmlns="http://www.w3.org/2000/svg">
  <polygon points="{center},{center-20} {center+20},{center} {center},{center+25} {center-20},{center}" fill="url(#diamondGradient)" stroke="#191970" stroke-width="2"/>
  <text x="{center}" y="{size-8}" text-anchor="middle" font-family="serif" font-size="{size//8}" font-weight="bold" fill="#191970">钻</text>
  <defs>
    <linearGradient id="diamondGradient">
      <stop offset="0%" stop-color="#E6E6FA"/>
      <stop offset="50%" stop-color="#9370DB"/>
      <stop offset="100%" stop-color="#4169E1"/>
    </linearGradient>
  </defs>
</svg>'''
    return create_simple_svg_png(svg_content, output_path, size)

def create_cat_demo(output_path, size, color):
    """创建猫咪演示素材"""
    center = size // 2
    svg_content = f'''<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" xmlns="http://www.w3.org/2000/svg">
  <!-- 猫头 -->
  <circle cx="{center}" cy="{center}" r="{size//3}" fill="{color}" stroke="#8B4513" stroke-width="1"/>
  <!-- 耳朵 -->
  <polygon points="{center-15},{center-20} {center-5},{center-30} {center},{center-20}" fill="{color}"/>
  <polygon points="{center},{center-20} {center+5},{center-30} {center+15},{center-20}" fill="{color}"/>
  <!-- 眼睛 -->
  <circle cx="{center-8}" cy="{center-5}" r="3" fill="#000"/>
  <circle cx="{center+8}" cy="{center-5}" r="3" fill="#000"/>
  <!-- 鼻子 -->
  <polygon points="{center},{center+2} {center-2},{center+6} {center+2},{center+6}" fill="#FFB6C1"/>
  <!-- 嘴巴 -->
  <path d="M {center} {center+6} Q {center-6} {center+12}, {center-12} {center+8}" stroke="#8B4513" stroke-width="1" fill="none"/>
  <path d="M {center} {center+6} Q {center+6} {center+12}, {center+12} {center+8}" stroke="#8B4513" stroke-width="1" fill="none"/>
</svg>'''
    return create_simple_svg_png(svg_content, output_path, size)

def create_coffee_cup_demo(output_path, size):
    """创建咖啡杯演示素材"""
    svg_content = f'''<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" xmlns="http://www.w3.org/2000/svg">
  <!-- 杯子主体 -->
  <path d="M {size//4} {size//3} L {size//4+5} {size-10} Q {size//4+5} {size-5}, {size//4+15} {size-5} L {size*3//4-15} {size-5} Q {size*3//4-5} {size-5}, {size*3//4-5} {size-10} L {size*3//4} {size//3} Z" 
        fill="url(#cupGradient)" stroke="#8B4513" stroke-width="2"/>
  <!-- 杯口 -->
  <ellipse cx="{size//2}" cy="{size//3}" rx="{size//4}" ry="4" fill="#F5DEB3" stroke="#8B4513" stroke-width="1"/>
  <!-- 咖啡液面 -->
  <ellipse cx="{size//2}" cy="{size//3+3}" rx="{size//4-3}" ry="3" fill="#8B4513"/>
  <!-- 把手 -->
  <path d="M {size*3//4} {size//2} Q {size*3//4+15} {size//2}, {size*3//4+15} {size*2//3} Q {size*3//4+15} {size*5//6}, {size*3//4} {size*5//6}" 
        fill="none" stroke="#8B4513" stroke-width="4"/>
  <defs>
    <linearGradient id="cupGradient">
      <stop offset="0%" stop-color="#F5DEB3"/>
      <stop offset="100%" stop-color="#DEB887"/>
    </linearGradient>
  </defs>
</svg>'''
    return create_simple_svg_png(svg_content, output_path, size)

def create_simple_button_demo(output_path, size, color, text):
    """创建简单按钮演示素材"""
    svg_content = f'''<svg width="{size}" height="{size//2}" viewBox="0 0 {size} {size//2}" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="{size-8}" height="{size//2-8}" rx="8" ry="8" fill="{color}" stroke="#666" stroke-width="2"/>
  <text x="{size//2}" y="{size//4+4}" text-anchor="middle" font-family="sans-serif" font-size="{size//8}" font-weight="bold" fill="white">{text}</text>
</svg>'''
    return create_simple_svg_png(svg_content, output_path, size)

def create_scene_background_demo(output_path, size, color1, color2):
    """创建场景背景演示素材"""
    svg_content = f'''<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="{size}" height="{size}" fill="url(#bgGradient)"/>
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{color1}"/>
      <stop offset="100%" stop-color="{color2}"/>
    </linearGradient>
  </defs>
</svg>'''
    return create_simple_svg_png(svg_content, output_path, size)

def generate_demo_assets():
    """生成演示素材"""
    print("🎨 开始生成演示素材...")
    
    demo_assets = []
    
    # 生成UI演示素材
    ui_demos = [
        ('gold_coin', create_gold_coin_demo),
        ('diamond', create_diamond_demo),
        ('coffee_cup', create_coffee_cup_demo),
    ]
    
    for asset_name, create_func in ui_demos:
        for size in [64, 128, 256]:
            asset_dir = f"UI/{asset_name}"
            ensure_dir(asset_dir)
            output_path = f"{asset_dir}/{asset_name}_{size}_demo.png"
            
            success = create_func(output_path, size)
            if success:
                demo_assets.append(output_path)
                print(f"✅ 创建演示素材: {output_path}")
            else:
                print(f"⚠️  创建SVG占位符: {output_path.replace('.png', '_demo.svg')}")
    
    # 生成猫咪演示素材
    cat_demos = [
        ('orange_cat', '#FFA500'),
        ('white_cat', '#F5F5F5'),
        ('black_cat', '#2F2F2F'),
    ]
    
    for cat_name, color in cat_demos:
        for size in [64, 128, 256]:
            cat_dir = f"Characters/Cats/{cat_name}"
            ensure_dir(cat_dir)
            output_path = f"{cat_dir}/{cat_name}_{size}_demo.png"
            
            success = create_cat_demo(output_path, size, color)
            if success:
                demo_assets.append(output_path)
                print(f"✅ 创建猫咪演示: {output_path}")
            else:
                print(f"⚠️  创建SVG占位符: {output_path.replace('.png', '_demo.svg')}")
    
    # 生成按钮演示素材
    button_demos = [
        ('primary_normal', '#007bff', '确定'),
        ('secondary_normal', '#6c757d', '取消'),
        ('settings', '#28a745', '设置'),
    ]
    
    for button_name, color, text in button_demos:
        for size in [128, 256]:  # 按钮只生成大尺寸
            button_dir = f"UI/{button_name}"
            ensure_dir(button_dir)
            output_path = f"{button_dir}/{button_name}_{size}_demo.png"
            
            success = create_simple_button_demo(output_path, size, color, text)
            if success:
                demo_assets.append(output_path)
                print(f"✅ 创建按钮演示: {output_path}")
            else:
                print(f"⚠️  创建SVG占位符: {output_path.replace('.png', '_demo.svg')}")
    
    # 生成场景背景演示素材
    scene_demos = [
        ('coffee_shop_bg', '#FFFACD', '#DEB887'),
        ('fishing_area_bg', '#87CEEB', '#4682B4'),
        ('main_menu_bg', '#FFE4E1', '#FFC0CB'),
    ]
    
    for scene_name, color1, color2 in scene_demos:
        for size in [512, 1024]:  # 场景只生成中大尺寸
            scene_dir = f"Scenes/{scene_name}"
            ensure_dir(scene_dir)
            output_path = f"{scene_dir}/{scene_name}_{size}_demo.png"
            
            success = create_scene_background_demo(output_path, size, color1, color2)
            if success:
                demo_assets.append(output_path)
                print(f"✅ 创建场景演示: {output_path}")
            else:
                print(f"⚠️  创建SVG占位符: {output_path.replace('.png', '_demo.svg')}")
    
    return demo_assets

def create_demo_report(demo_assets):
    """创建演示报告"""
    report_content = f"""# 演示素材生成报告

## 📊 生成结果

成功生成了 {len(demo_assets)} 个演示素材文件。

## 🎯 演示素材列表

### UI素材演示
- gold_coin (金币) - 3个尺寸
- diamond (钻石) - 3个尺寸  
- coffee_cup (咖啡杯) - 3个尺寸

### 角色素材演示
- orange_cat (橙猫) - 3个尺寸
- white_cat (白猫) - 3个尺寸
- black_cat (黑猫) - 3个尺寸

### 按钮素材演示
- primary_normal (主要按钮) - 2个尺寸
- secondary_normal (次要按钮) - 2个尺寸
- settings (设置按钮) - 2个尺寸

### 场景素材演示
- coffee_shop_bg (咖啡馆背景) - 2个尺寸
- fishing_area_bg (钓鱼区背景) - 2个尺寸
- main_menu_bg (主菜单背景) - 2个尺寸

## 🚀 使用方法

这些演示素材可以直接用于测试资源管理器功能：

```typescript
// 加载演示金币图标
const goldCoinPath = resourceManager.getAssetPath('ui', 'gold_coin');
// 实际路径: Art/UI/gold_coin_128_demo.png

// 加载演示猫咪角色  
const orangeCatPath = resourceManager.getAssetPath('cats', 'orange_cat');
// 实际路径: Art/Characters/Cats/orange_cat_128_demo.png
```

## 📋 注意事项

1. 演示素材文件名包含 `_demo` 后缀
2. 如果系统缺少图像转换工具，会生成SVG占位符
3. 这些素材仅用于功能测试，正式版需要专业美术制作

## 🔧 转换工具要求

为了生成PNG文件，系统需要以下工具之一：
- ImageMagick (convert命令)
- Inkscape (inkscape命令)

如果没有这些工具，会生成SVG格式的可视化占位符。
"""
    
    with open("DEMO_ASSETS_REPORT.md", 'w', encoding='utf-8') as f:
        f.write(report_content)
    
    print("Created: DEMO_ASSETS_REPORT.md")

def main():
    """主函数"""
    print("=== 演示素材生成脚本 ===")
    print("正在生成可用的演示素材...")
    
    demo_assets = generate_demo_assets()
    create_demo_report(demo_assets)
    
    print(f"\n=== 演示素材生成完成 ===")
    print(f"✅ 成功生成 {len(demo_assets)} 个演示文件")
    print("📋 查看 DEMO_ASSETS_REPORT.md 了解详情")
    print("\n🔧 提示: 如需PNG格式，请安装 ImageMagick 或 Inkscape")

if __name__ == "__main__":
    main()