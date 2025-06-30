#!/usr/bin/env python3
"""
演示素材生成脚本
生成简化的PNG文件用于测试资源管理器功能
不依赖外部库，使用基本的图形生成方法
"""

import os
import subprocess
import base64
import json
from pathlib import Path

# --- 全局配置 ---
CONFIG_FILE = 'art_config.json'

def load_config():
    """加载并返回JSON配置文件"""
    try:
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"错误: 配置文件 '{CONFIG_FILE}' 未找到。")
        return None
    except json.JSONDecodeError:
        print(f"错误: 配置文件 '{CONFIG_FILE}' 格式无效。")
        return None

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

def create_kawaii_cat_svg(size, style_profile):
    """创建可爱风格的猫咪SVG内容 (V3, 模仿AI手绘感)"""
    palette = style_profile['palette']
    line_style = style_profile['line_style']
    
    body_color = palette.get('creamy_yellow', '#FFFACD')
    line_color = line_style.get('color', '#6D6D6D')
    shadow_color = "#000000"
    line_width = 2.5

    center = size // 2
    
    svg_content = f'''<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
      <feOffset in="blur" dx="2" dy="3" result="offsetBlur"/>
      <feFlood flood-color="{shadow_color}" flood-opacity="0.3" result="offsetColor"/>
      <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="offsetBlur"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
     <radialGradient id="bodyGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
      <stop offset="0%" style="stop-color:white; stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:{body_color}; stop-opacity:1" />
    </radialGradient>
  </defs>
  
  <g filter="url(#soft-shadow)">
    <!-- 身体: 肥嘟嘟的椭圆 -->
    <ellipse cx="{center}" cy="{center + 20}" rx="{size // 3}" ry="{size // 4}" fill="url(#bodyGradient)" />
    
    <!-- 头部: 更圆，稍微前倾 -->
    <circle cx="{center}" cy="{center - 10}" r="{size // 3.5}" fill="{body_color}" />
    <circle cx="{center}" cy="{center - 10}" r="{size // 3.5}" fill="url(#bodyGradient)" />
    
    <!-- 耳朵 -->
    <path d="M {center - 50} {center - 50} Q {center - 60} {center - 80}, {center - 20} {center - 70}" fill="{body_color}" stroke="{line_color}" stroke-width="{line_width}" stroke-linecap="round"/>
    <path d="M {center + 50} {center - 50} Q {center + 60} {center - 80}, {center + 20} {center - 70}" fill="{body_color}" stroke="{line_color}" stroke-width="{line_width}" stroke-linecap="round"/>

    <!-- 闭着的眼睛，幸福的表情 -->
    <path d="M {center - 30} {center - 15} Q {center - 20} {center - 5}, {center - 10} {center - 15}" stroke="{line_color}" stroke-width="{line_width}" fill="none" stroke-linecap="round"/>
    <path d="M {center + 10} {center - 15} Q {center + 20} {center - 5}, {center + 30} {center - 15}" stroke="{line_color}" stroke-width="{line_width}" fill="none" stroke-linecap="round"/>

    <!-- 小鼻子和嘴巴 -->
    <path d="M {center - 3} {center + 5} L {center + 3} {center + 5} L {center} {center + 10} Z" fill="{palette.get('primary_accent', '#FFB6C1')}"/>
    
    <!-- 爪子/手 -->
    <circle cx="{center - 45}" cy="{center + 30}" r="15" fill="{body_color}"/>
    <circle cx="{center + 45}" cy="{center + 30}" r="15" fill="{body_color}"/>
   </g>
</svg>'''
    return svg_content

def create_cat_demo(output_path, size, style_profile):
    """创建猫咪演示素材"""
    svg_content = create_kawaii_cat_svg(size, style_profile)
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
    print("=== 可爱风格预览生成脚本 (V1) ===")
    
    # --- 切换工作目录 ---
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    print(f"工作目录切换至: {os.getcwd()}")
    
    # --- 加载配置 ---
    config = load_config()
    if not config:
        return
        
    active_style_name = config.get('globalStyle')
    style_profile = config.get('styleProfile', {}).get(active_style_name)
    if not style_profile:
        print(f"错误: 未在 config.json 中找到名为 '{active_style_name}' 的 styleProfile。")
        return
    
    print(f"应用风格: {style_profile.get('name', active_style_name)}")
    
    # --- 生成单张猫咪预览图 ---
    print("\n[1/1] 正在生成猫咪预览图...")
    
    cat_name = "cat_preview"
    size = 256
    version = 1
    
    output_dir = "Characters/Cats/PREVIEW"
    ensure_dir(output_dir)
    output_path = f"{output_dir}/{cat_name}_v{version}.png"
    
    success = create_cat_demo(output_path, size, style_profile)
    
    if success:
        print(f"\n✅ 预览图生成成功!")
        print(f"文件位置: {Path(output_path).resolve()}")
    else:
        print(f"\n⚠️  预览图生成失败。")
        print(f"可能是因为系统缺少 ImageMagick 或 Inkscape。")
        print(f"已在以下位置保留SVG源文件: {Path(output_path.replace('.png', '_demo.svg')).resolve()}")

if __name__ == "__main__":
    main()