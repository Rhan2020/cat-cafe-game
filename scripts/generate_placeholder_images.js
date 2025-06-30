const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_DIR = path.join(__dirname, '../client/assets/Art');
const SIZES = {
  ui: [64, 128, 256],
  characters: [64, 128, 256],
  items: [64, 128, 256],
  scenes: [512, 1024, 2048],
  effects: [128, 256, 512]
};

// Color palettes for different asset types
const COLORS = {
  characters: {
    cat: {
      N: '#FFA500',    // Orange
      R: '#87CEEB',    // Sky Blue
      SR: '#9370DB',   // Medium Purple
      SSR: '#FFD700',  // Gold
      USR: '#FF00FF'   // Magenta
    },
    dog: '#CD853F',    // Peru
    mouse: '#F5F5DC'   // Beige
  },
  ui: {
    primary: '#FF8C69',   // Warm orange
    secondary: '#FFB6C1', // Sweet pink
    icon: '#4169E1',      // Royal Blue
    panel: '#F5F5F5'      // Light Gray
  },
  items: {
    food: '#8B4513',      // Brown
    equipment: '#C0C0C0', // Silver
    special: '#FFD700',   // Gold
    currency: '#32CD32'   // Lime Green
  },
  scenes: {
    coffee_shop: '#DEB887', // Burlywood
    fishing_area: '#87CEEB', // Sky Blue
    main_menu: '#FFB6C1'     // Light Pink
  },
  effects: {
    particles: '#FFD700',    // Gold
    animations: '#FF69B4',   // Hot Pink
    weather: '#87CEEB'       // Sky Blue
  }
};

// Helper functions
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getColorForAsset(type, name, category) {
  // Determine color based on asset type and name
  if (type === 'character') {
    if (name.includes('cat')) {
      // Determine rarity from name
      if (name.includes('phoenix') || name.includes('dragon') || 
          name.includes('unicorn') || name.includes('stellar')) {
        return COLORS.characters.cat.SSR;
      } else if (name.includes('princess') || name.includes('mage') || 
                name.includes('angel') || name.includes('ninja')) {
        return COLORS.characters.cat.SR;
      } else if (name.includes('sakura') || name.includes('gentleman') || 
                name.includes('milktea') || name.includes('starry')) {
        return COLORS.characters.cat.R;
      } else if (name.includes('genesis') || name.includes('spacetime') || 
                name.includes('destiny') || name.includes('infinite')) {
        return COLORS.characters.cat.USR;
      } else {
        return COLORS.characters.cat.N;
      }
    } else if (name.includes('dog')) {
      return COLORS.characters.dog;
    } else if (name.includes('hamster') || name.includes('chinchilla') || name.includes('squirrel')) {
      return COLORS.characters.mouse;
    }
  } else if (type === 'ui') {
    if (name.includes('primary')) {
      return COLORS.ui.primary;
    } else if (name.includes('secondary')) {
      return COLORS.ui.secondary;
    } else if (category === 'panel') {
      return COLORS.ui.panel;
    } else {
      return COLORS.ui.icon;
    }
  } else if (type === 'item') {
    if (name.includes('coffee') || name.includes('cake') || name.includes('cookie') || 
        name.includes('latte') || name.includes('americano') || name.includes('cappuccino')) {
      return COLORS.items.food;
    } else if (name.includes('machine') || name.includes('oven') || name.includes('mixer') || 
              name.includes('grinder')) {
      return COLORS.items.equipment;
    } else if (name.includes('coin') || name.includes('diamond')) {
      return COLORS.items.currency;
    } else {
      return COLORS.items.special;
    }
  } else if (type === 'scene') {
    if (name.includes('coffee_shop')) {
      return COLORS.scenes.coffee_shop;
    } else if (name.includes('fishing')) {
      return COLORS.scenes.fishing_area;
    } else {
      return COLORS.scenes.main_menu;
    }
  } else if (type === 'effect') {
    if (category === 'Particles') {
      return COLORS.effects.particles;
    } else if (category === 'Animations') {
      return COLORS.effects.animations;
    } else {
      return COLORS.effects.weather;
    }
  }
  
  return '#808080'; // Default gray
}

function createPlaceholderSVG(width, height, type, name, category = '') {
  const color = getColorForAsset(type, name, category);
  const textColor = '#FFFFFF';
  const displayName = name.replace(/_/g, ' ');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${color}"/>
  <text x="50%" y="40%" text-anchor="middle" fill="${textColor}" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.08}" font-weight="bold">${type.toUpperCase()}</text>
  <text x="50%" y="60%" text-anchor="middle" fill="${textColor}" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.06}">${displayName}</text>
  <text x="50%" y="80%" text-anchor="middle" fill="${textColor}" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.05}">${width}x${height}</text>
</svg>`;
}

function generateCharacterImages() {
  console.log('Generating character placeholder images...');
  
  // Cat breeds with rarities
  const catBreeds = [
    'orange_cat', 'white_cat', 'black_cat', 'gray_cat',
    'sakura_cat', 'gentleman_cat', 'milktea_cat', 'starry_cat',
    'princess_cat', 'mage_cat', 'angel_cat', 'ninja_cat',
    'phoenix_cat', 'dragon_cat', 'unicorn_cat', 'stellar_cat',
    'genesis_cat', 'spacetime_cat', 'destiny_cat', 'infinite_cat'
  ];
  
  // Dog breeds
  const dogBreeds = [
    'golden_welcome', 'shiba_reception', 'husky_service',
    'german_guard', 'rottweiler_security', 'border_analyst'
  ];
  
  // Mouse breeds
  const mouseBreeds = [
    'cream_hamster', 'chocolate_hamster', 'matcha_hamster',
    'cloud_chinchilla', 'rainbow_chinchilla', 'nut_squirrel', 'berry_squirrel'
  ];
  
  // Generate cat images
  for (const cat of catBreeds) {
    for (const size of SIZES.characters) {
      const outputPath = path.join(OUTPUT_DIR, 'Characters', 'Cats', cat, `${cat}_${size}.svg`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const svgContent = createPlaceholderSVG(size, size, 'character', cat);
      fs.writeFileSync(outputPath, svgContent);
      console.log(`Generated: ${outputPath}`);
    }
  }
  
  // Generate dog images
  for (const dog of dogBreeds) {
    for (const size of SIZES.characters) {
      const outputPath = path.join(OUTPUT_DIR, 'Characters', 'Dogs', dog, `${dog}_${size}.svg`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const svgContent = createPlaceholderSVG(size, size, 'character', dog);
      fs.writeFileSync(outputPath, svgContent);
      console.log(`Generated: ${outputPath}`);
    }
  }
  
  // Generate mouse images
  for (const mouse of mouseBreeds) {
    for (const size of SIZES.characters) {
      const outputPath = path.join(OUTPUT_DIR, 'Characters', 'Mice', mouse, `${mouse}_${size}.svg`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const svgContent = createPlaceholderSVG(size, size, 'character', mouse);
      fs.writeFileSync(outputPath, svgContent);
      console.log(`Generated: ${outputPath}`);
    }
  }
}

function generateUIImages() {
  console.log('Generating UI placeholder images...');
  
  // UI elements
  const uiElements = [
    { name: 'gold_coin', category: 'icon' },
    { name: 'diamond', category: 'icon' },
    { name: 'coffee_cup', category: 'icon' },
    { name: 'settings', category: 'icon' },
    { name: 'help', category: 'icon' },
    { name: 'close', category: 'icon' },
    { name: 'back', category: 'icon' },
    { name: 'fish', category: 'icon' },
    { name: 'experience', category: 'icon' },
    { name: 'cat_management', category: 'icon' },
    { name: 'gacha', category: 'icon' },
    { name: 'task_scroll', category: 'icon' },
    { name: 'success_check', category: 'icon' },
    { name: 'failure_x', category: 'icon' },
    { name: 'warning_exclamation', category: 'icon' },
    { name: 'info_circle', category: 'icon' },
    { name: 'primary_normal', category: 'button' },
    { name: 'primary_pressed', category: 'button' },
    { name: 'primary_disabled', category: 'button' },
    { name: 'primary_highlight', category: 'button' },
    { name: 'secondary_normal', category: 'button' },
    { name: 'secondary_pressed', category: 'button' },
    { name: 'secondary_disabled', category: 'button' },
    { name: 'info_panel', category: 'panel' },
    { name: 'dialog_box', category: 'panel' },
    { name: 'popup_window', category: 'panel' },
    { name: 'drawer_panel', category: 'panel' },
    { name: 'progress_bar_basic', category: 'progress' },
    { name: 'progress_bar_cat', category: 'progress' },
    { name: 'progress_bar_fish', category: 'progress' },
    { name: 'progress_bar_coffee', category: 'progress' }
  ];
  
  for (const ui of uiElements) {
    for (const size of SIZES.ui) {
      const outputPath = path.join(OUTPUT_DIR, 'UI', ui.name, `${ui.name}_${size}.svg`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const svgContent = createPlaceholderSVG(size, size, 'ui', ui.name, ui.category);
      fs.writeFileSync(outputPath, svgContent);
      console.log(`Generated: ${outputPath}`);
    }
  }
}

function generateItemImages() {
  console.log('Generating item placeholder images...');
  
  // Food items
  const foodItems = [
    'americano', 'latte', 'cappuccino', 'cat_latte_art', 'rainbow_mocha',
    'cheesecake', 'chocolate_cake', 'rainbow_cake', 'macaron', 'cookie',
    'strawberry', 'lemon', 'coffee_beans', 'milk', 'sugar', 'cream',
    'cat_head_coin', 'cat_paw_cookie', 'destiny_watch', 'heart_shaped_coin',
    'baking_oven', 'stand_mixer', 'espresso_machine', 'coffee_grinder',
    'lucky_bell', 'skill_book'
  ];
  
  // Generate food items
  for (const item of foodItems) {
    for (const size of SIZES.items) {
      const outputPath = path.join(OUTPUT_DIR, 'Items', item, `${item}_${size}.svg`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const svgContent = createPlaceholderSVG(size, size, 'item', item);
      fs.writeFileSync(outputPath, svgContent);
      console.log(`Generated: ${outputPath}`);
    }
  }
}

function generateSceneImages() {
  console.log('Generating scene placeholder images...');
  
  // Scene backgrounds
  const scenes = [
    'coffee_shop_bg', 'fishing_area_bg', 'main_menu_bg'
  ];
  
  // Coffee shop scene layers
  const coffeeShopLayers = [
    'walls_floor', 'ceiling_lighting', 'windows_doors',
    'counter_bar', 'tables_chairs', 'kitchen_equipment',
    'plants_flowers', 'artwork_posters', 'accessories',
    'coffee_machine', 'oven_fridge', 'delivery_station',
    'steam_particles', 'light_effects', 'ambient_glow'
  ];
  
  // Fishing area scene layers
  const fishingAreaLayers = [
    'sky_clouds', 'distant_mountains', 'horizon_line',
    'pond_base', 'water_surface', 'water_plants', 'ripple_effects',
    'wooden_dock', 'fishing_equipment', 'seating_area',
    'trees_bamboo', 'flowers_plants', 'stones_bridge', 'pathways',
    'pavilion', 'tool_shed', 'rest_facilities',
    'water_ripples', 'leaf_particles', 'light_rays', 'weather_effects'
  ];
  
  // Generate main scene backgrounds
  for (const scene of scenes) {
    for (const size of SIZES.scenes) {
      const outputPath = path.join(OUTPUT_DIR, 'Scenes', scene, `${scene}_${size}.svg`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const svgContent = createPlaceholderSVG(size, size, 'scene', scene);
      fs.writeFileSync(outputPath, svgContent);
      console.log(`Generated: ${outputPath}`);
    }
  }
  
  // Generate coffee shop layers
  for (const layer of coffeeShopLayers) {
    for (const size of SIZES.scenes) {
      const outputPath = path.join(OUTPUT_DIR, 'Scenes', 'CoffeeShop', layer, `${layer}_${size}.svg`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const svgContent = createPlaceholderSVG(size, size, 'scene', layer, 'CoffeeShop');
      fs.writeFileSync(outputPath, svgContent);
      console.log(`Generated: ${outputPath}`);
    }
  }
  
  // Generate fishing area layers
  for (const layer of fishingAreaLayers) {
    for (const size of SIZES.scenes) {
      const outputPath = path.join(OUTPUT_DIR, 'Scenes', 'FishingArea', layer, `${layer}_${size}.svg`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const svgContent = createPlaceholderSVG(size, size, 'scene', layer, 'FishingArea');
      fs.writeFileSync(outputPath, svgContent);
      console.log(`Generated: ${outputPath}`);
    }
  }
}

function generateEffectImages() {
  console.log('Generating effect placeholder images...');
  
  // Effects
  const effects = [
    { name: 'coffee_steam', category: 'Particles' },
    { name: 'star_sparkle', category: 'Particles' },
    { name: 'heart_particles', category: 'Particles' },
    { name: 'coin_burst', category: 'Particles' },
    { name: 'rainbow_particles', category: 'Particles' },
    { name: 'level_up_burst', category: 'Animations' },
    { name: 'success_celebration', category: 'Animations' },
    { name: 'failure_shake', category: 'Animations' },
    { name: 'loading_spinner', category: 'Animations' },
    { name: 'rain_drops', category: 'Weather' },
    { name: 'snow_flakes', category: 'Weather' },
    { name: 'sun_rays', category: 'Weather' }
  ];
  
  // Generate effects
  for (const effect of effects) {
    for (const size of SIZES.effects) {
      const outputPath = path.join(OUTPUT_DIR, 'Effects', effect.category, effect.name, `${effect.name}_${size}.svg`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const svgContent = createPlaceholderSVG(size, size, 'effect', effect.name, effect.category);
      fs.writeFileSync(outputPath, svgContent);
      console.log(`Generated: ${outputPath}`);
    }
  }
}

function generateCompletionReport() {
  const reportPath = path.join(OUTPUT_DIR, 'GENERATION_REPORT.md');
  const content = `# Image Generation Report

## Summary
Successfully generated SVG placeholder images for all game assets.

## Statistics
- Characters: 33 types × 3 sizes = 99 images
- UI Elements: 31 types × 3 sizes = 93 images
- Items: 26 types × 3 sizes = 78 images
- Scenes: 39 types × 3 sizes = 117 images
- Effects: 12 types × 3 sizes = 36 images
- **Total: 423 SVG placeholder images**

## Next Steps
1. These SVG placeholders can be used for development and testing
2. Replace with actual PNG/JPG assets when they become available
3. Use SimpleResourceManager to load the assets in the game

## Notes
- All images are SVG format for better scalability and smaller file size
- Each image is color-coded by type and contains the asset name and dimensions
- Directory structure follows the specifications in the art_config.json file
`;

  fs.writeFileSync(reportPath, content);
  console.log(`Generated completion report: ${reportPath}`);
}

// Main function
function main() {
  console.log('Starting placeholder image generation...');
  console.log('Note: This generates SVG placeholder images instead of PNG images due to environment limitations.');
  
  try {
    // Generate all image types
    generateCharacterImages();
    generateUIImages();
    generateItemImages();
    generateSceneImages();
    generateEffectImages();
    
    // Generate completion report
    generateCompletionReport();
    
    console.log('Placeholder image generation complete!');
    console.log('All images are generated as SVG files for compatibility.');
    console.log(`Total directory: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('Error generating placeholder images:', error);
  }
}

main();