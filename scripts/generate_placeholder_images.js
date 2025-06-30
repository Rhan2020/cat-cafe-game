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

// Helper functions
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function createPlaceholderSVG(width, height, type, name) {
  const colors = {
    cat: '#FF8C69',
    dog: '#CD853F',
    mouse: '#F5F5DC',
    ui: '#4169E1',
    item: '#32CD32',
    scene: '#87CEEB',
    effect: '#FFD700'
  };
  
  const color = colors[type] || '#808080';
  const textColor = '#FFFFFF';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${color}"/>
  <text x="50%" y="40%" text-anchor="middle" fill="${textColor}" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.08}" font-weight="bold">${type.toUpperCase()}</text>
  <text x="50%" y="60%" text-anchor="middle" fill="${textColor}" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.06}">${name}</text>
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
      
      const svgContent = createPlaceholderSVG(size, size, 'cat', cat);
      fs.writeFileSync(outputPath, svgContent);
      console.log(`Generated: ${outputPath}`);
    }
  }
  
  // Generate dog images
  for (const dog of dogBreeds) {
    for (const size of SIZES.characters) {
      const outputPath = path.join(OUTPUT_DIR, 'Characters', 'Dogs', dog, `${dog}_${size}.svg`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const svgContent = createPlaceholderSVG(size, size, 'dog', dog);
      fs.writeFileSync(outputPath, svgContent);
      console.log(`Generated: ${outputPath}`);
    }
  }
  
  // Generate mouse images
  for (const mouse of mouseBreeds) {
    for (const size of SIZES.characters) {
      const outputPath = path.join(OUTPUT_DIR, 'Characters', 'Mice', mouse, `${mouse}_${size}.svg`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const svgContent = createPlaceholderSVG(size, size, 'mouse', mouse);
      fs.writeFileSync(outputPath, svgContent);
      console.log(`Generated: ${outputPath}`);
    }
  }
}

function generateUIImages() {
  console.log('Generating UI placeholder images...');
  
  // UI elements
  const uiElements = [
    'gold_coin', 'diamond', 'coffee_cup', 'settings',
    'primary_normal', 'primary_pressed', 'primary_disabled', 'primary_highlight',
    'secondary_normal', 'secondary_pressed', 'secondary_disabled'
  ];
  
  for (const ui of uiElements) {
    for (const size of SIZES.ui) {
      const outputPath = path.join(OUTPUT_DIR, 'UI', ui, `${ui}_${size}.svg`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const svgContent = createPlaceholderSVG(size, size, 'ui', ui);
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
    'cat_head_coin', 'cat_paw_cookie', 'destiny_watch', 'heart_shaped_coin',
    'baking_oven', 'stand_mixer', 'espresso_machine', 'coffee_grinder'
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
  
  // Generate scene backgrounds
  for (const scene of scenes) {
    for (const size of SIZES.scenes) {
      const outputPath = path.join(OUTPUT_DIR, 'Scenes', scene, `${scene}_${size}.svg`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const svgContent = createPlaceholderSVG(size, size, 'scene', scene);
      fs.writeFileSync(outputPath, svgContent);
      console.log(`Generated: ${outputPath}`);
    }
  }
}

function generateEffectImages() {
  console.log('Generating effect placeholder images...');
  
  // Effects
  const effects = [
    'coffee_steam', 'star_sparkle', 'heart_particles', 'coin_burst', 'rainbow_particles',
    'level_up_burst', 'success_celebration', 'failure_shake', 'loading_spinner',
    'rain_drops', 'snow_flakes', 'sun_rays'
  ];
  
  // Generate effects
  for (const effect of effects) {
    const category = effect.includes('_particles') ? 'Particles' : 
                    effect.includes('_burst') || effect.includes('celebration') || effect.includes('shake') || effect.includes('spinner') ? 'Animations' : 
                    'Weather';
    
    for (const size of SIZES.effects) {
      const outputPath = path.join(OUTPUT_DIR, 'Effects', category, effect, `${effect}_${size}.svg`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const svgContent = createPlaceholderSVG(size, size, 'effect', effect);
      fs.writeFileSync(outputPath, svgContent);
      console.log(`Generated: ${outputPath}`);
    }
  }
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
    
    console.log('Placeholder image generation complete!');
    console.log('All images are generated as SVG files for compatibility.');
  } catch (error) {
    console.error('Error generating placeholder images:', error);
  }
}

main();