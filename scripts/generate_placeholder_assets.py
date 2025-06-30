import json
import re
from pathlib import Path
from typing import Any, Dict, List

try:
    from PIL import Image, ImageDraw, ImageFont  # type: ignore
except ImportError:
    raise SystemExit("Pillow 未安装，请先执行 `pip install pillow` 再运行本脚本。")

# 配置路径
CLIENT_DIR = Path(__file__).resolve().parent.parent / "client" / "assets"
ART_CONFIG_PATH = CLIENT_DIR / "Art" / "art_config.json"

# 支持的图片扩展名
IMG_EXTS = {".png", ".jpg", ".jpeg", ".webp"}

# 默认占位图大小
DEFAULT_SIZE = (256, 256)

# 正则：尝试从文件名中提取尺寸，例如 gold_coin_128.png -> 128
SIZE_PATTERN = re.compile(r"_(\d+)(?:x\d+)?\.[a-zA-Z]+$")

# 使用系统自带字体（如果可用）

def get_font(font_size: int = 24):
    """返回一个 PIL ImageFont 实例，如果系统字体不可用则使用默认字体。"""
    try:
        # 常见 Linux 字体
        font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        return ImageFont.truetype(font_path, font_size)
    except Exception:
        return ImageFont.load_default()


def extract_image_paths(config: Dict[str, Any], current_base: Path = Path("")) -> List[Path]:
    """递归遍历配置，提取所有图片相对路径。"""
    paths = []

    if not isinstance(config, dict):
        return paths

    # 如果本层有 basePath，则更新 current_base
    if "basePath" in config and isinstance(config["basePath"], str):
        # basePath 可能是相对 Art/ 开头
        new_base = Path(config["basePath"])
        # 如果 basePath 不是绝对路径，则相对于当前 basePath
        if not new_base.is_absolute():
            current_base = Path(config["basePath"])
        else:
            current_base = new_base

    for key, value in config.items():
        if key == "basePath":
            # 已处理
            continue
        if isinstance(value, dict):
            paths.extend(extract_image_paths(value, current_base))
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    paths.extend(extract_image_paths(item, current_base))
                elif isinstance(item, str):
                    # 直接文件名
                    p = Path(item)
                    if p.suffix.lower() in IMG_EXTS:
                        if p.is_absolute():
                            paths.append(p)
                        else:
                            paths.append(current_base / p)
        elif isinstance(value, str):
            p = Path(value)
            if p.suffix.lower() in IMG_EXTS:
                if p.is_absolute():
                    paths.append(p)
                else:
                    paths.append(current_base / p)
    return paths


def ensure_placeholder(img_path: Path):
    """如果图片不存在，则创建占位图。"""
    full_path = CLIENT_DIR / img_path
    if full_path.exists():
        return  # 已存在

    # 确保目录存在
    full_path.parent.mkdir(parents=True, exist_ok=True)

    # 解析尺寸
    match = SIZE_PATTERN.search(img_path.name)
    if match:
        size_val = int(match.group(1))
        size = (size_val, size_val)
    else:
        size = DEFAULT_SIZE

    # 创建图像
    img = Image.new("RGBA", size, (200, 200, 200, 255))
    draw = ImageDraw.Draw(img)

    # 写入文件名
    font = get_font(min(40, size[0] // 6))
    text = img_path.stem
    try:
        text_width, text_height = draw.textsize(text, font=font)  # Pillow <11
    except AttributeError:
        # Pillow 11 移除了 textsize，使用 textbbox 计算
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

    draw.text(
        ((size[0] - text_width) / 2, (size[1] - text_height) / 2),
        text,
        fill=(0, 0, 0),
        font=font,
    )

    # 保存
    img.save(full_path)
    print(f"Created placeholder: {full_path.relative_to(Path.cwd())}")


def main():
    if not ART_CONFIG_PATH.exists():
        raise SystemExit(f"找不到配置文件: {ART_CONFIG_PATH}")

    with open(ART_CONFIG_PATH, "r", encoding="utf-8") as f:
        config = json.load(f)

    image_paths = extract_image_paths(config)

    unique_paths = {p for p in image_paths if p.suffix.lower() in IMG_EXTS}

    print(f"共发现 {len(unique_paths)} 个图片资源，将为缺失的文件生成占位图像……")

    for rel_path in sorted(unique_paths):
        ensure_placeholder(rel_path)

    print("占位图像生成完毕！")


if __name__ == "__main__":
    main()