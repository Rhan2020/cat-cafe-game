const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Configuration
const OUTPUT_DIR = path.join(__dirname, '../client/assets/Art');
const SIZES = {
  ui: [64, 128, 256],
  characters: [64, 128, 256],
  items: [64, 128, 256],
  scenes: [512, 1024, 2048],
  effects: [128, 256, 512]
};

// Color palettes
const COLORS = {
  ui: {
    primary: '#FF8C69', // Warm orange
    secondary: '#FFB6C1', // Sweet pink
    accent: '#FFD700', // Vibrant yellow
    background: '#FFF8DC', // Soft cream
    text: '#333333' // Dark gray
  },
  characters: {
    cat: {
      N: ['#FFA500', '#FFFFFF', '#2F2F2F', '#808080'], // Orange, White, Black, Gray
      R: ['#FFB6C1', '#87CEEB', '#F5DEB3', '#9370DB'], // Pink, Sky Blue, Wheat, Purple
      SR: ['#DDA0DD', '#9370DB', '#FFFFFF', '#000000'], // Plum, Medium Purple, White, Black
      SSR: ['#FFD700', '#4169E1', '#FF69B4', '#32CD32'], // Gold, Royal Blue, Hot Pink, Lime Green
      USR: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF0000'] // Magenta, Cyan, Yellow, Red
    },
    dog: ['#CD853F', '#F5DEB3', '#8B4513', '#D2B48C'], // Peru, Wheat, SaddleBrown, Tan
    mouse: ['#F5F5DC', '#D2B48C', '#90EE90', '#F0E68C'] // Beige, Tan, LightGreen, Khaki
  },
  items: {
    food: ['#8B4513', '#FFD700', '#FF69B4', '#32CD32'], // Brown, Gold, Pink, Green
    equipment: ['#C0C0C0', '#4682B4', '#CD853F', '#2F4F4F'], // Silver, Steel Blue, Peru, Dark Slate Gray
    special: ['#FFD700', '#FF00FF', '#00FFFF', '#FF0000'] // Gold, Magenta, Cyan, Red
  },
  scenes: {
    coffeeShop: ['#8B4513', '#FFF8DC', '#FFD700', '#228B22'], // Brown, Cream, Gold, Forest Green
    fishingArea: ['#87CEEB', '#4682B4', '#228B22', '#8B4513'] // Sky Blue, Steel Blue, Forest Green, Brown
  }
};

// Helper functions
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getRandomColor(palette) {
  if (Array.isArray(palette)) {
    return palette[Math.floor(Math.random() * palette.length)];
  }
  const keys = Object.keys(palette);
  return palette[keys[Math.floor(Math.random() * keys.length)]];
}

function drawCat(ctx, width, height, color, rarity) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.4;
  
  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Ears
  ctx.beginPath();
  ctx.moveTo(centerX - radius * 0.7, centerY - radius * 0.7);
  ctx.lineTo(centerX - radius * 0.3, centerY - radius * 1.2);
  ctx.lineTo(centerX, centerY - radius * 0.7);
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(centerX + radius * 0.7, centerY - radius * 0.7);
  ctx.lineTo(centerX + radius * 0.3, centerY - radius * 1.2);
  ctx.lineTo(centerX, centerY - radius * 0.7);
  ctx.fill();
  
  // Eyes
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.3, centerY - radius * 0.1, radius * 0.15, 0, Math.PI * 2);
  ctx.arc(centerX + radius * 0.3, centerY - radius * 0.1, radius * 0.15, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.3, centerY - radius * 0.1, radius * 0.07, 0, Math.PI * 2);
  ctx.arc(centerX + radius * 0.3, centerY - radius * 0.1, radius * 0.07, 0, Math.PI * 2);
  ctx.fill();
  
  // Nose
  ctx.fillStyle = '#FFB6C1';
  ctx.beginPath();
  ctx.arc(centerX, centerY + radius * 0.1, radius * 0.07, 0, Math.PI * 2);
  ctx.fill();
  
  // Mouth
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(1, width / 100);
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + radius * 0.1);
  ctx.lineTo(centerX, centerY + radius * 0.3);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.2, centerY + radius * 0.3, radius * 0.2, 0, Math.PI);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(centerX + radius * 0.2, centerY + radius * 0.3, radius * 0.2, 0, Math.PI);
  ctx.stroke();
  
  // Rarity effects
  if (rarity === 'R') {
    // Simple glow
    ctx.strokeStyle = '#87CEEB';
    ctx.lineWidth = Math.max(2, width / 50);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
    ctx.stroke();
  } else if (rarity === 'SR') {
    // Star pattern
    ctx.fillStyle = '#9370DB';
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const x = centerX + (radius + 15) * Math.cos(angle);
      const y = centerY + (radius + 15) * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (rarity === 'SSR') {
    // Golden aura
    const gradient = ctx.createRadialGradient(
      centerX, centerY, radius,
      centerX, centerY, radius * 1.5
    );
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.7)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (rarity === 'USR') {
    // Rainbow effect
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
    gradient.addColorStop(0.2, 'rgba(255, 165, 0, 0.3)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 0, 0.3)');
    gradient.addColorStop(0.6, 'rgba(0, 128, 0, 0.3)');
    gradient.addColorStop(0.8, 'rgba(0, 0, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(128, 0, 128, 0.3)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
}

function drawDog(ctx, width, height, color) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;
  
  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Ears (droopy)
  ctx.beginPath();
  ctx.moveTo(centerX - radius * 0.7, centerY - radius * 0.7);
  ctx.quadraticCurveTo(
    centerX - radius * 1.2, centerY - radius * 0.3,
    centerX - radius * 0.9, centerY
  );
  ctx.lineTo(centerX - radius * 0.5, centerY - radius * 0.3);
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(centerX + radius * 0.7, centerY - radius * 0.7);
  ctx.quadraticCurveTo(
    centerX + radius * 1.2, centerY - radius * 0.3,
    centerX + radius * 0.9, centerY
  );
  ctx.lineTo(centerX + radius * 0.5, centerY - radius * 0.3);
  ctx.fill();
  
  // Snout
  ctx.fillStyle = '#F5DEB3';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + radius * 0.3, radius * 0.5, radius * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Eyes
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.3, centerY - radius * 0.1, radius * 0.08, 0, Math.PI * 2);
  ctx.arc(centerX + radius * 0.3, centerY - radius * 0.1, radius * 0.08, 0, Math.PI * 2);
  ctx.fill();
  
  // Nose
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + radius * 0.3, radius * 0.15, radius * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Mouth
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(1, width / 100);
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + radius * 0.3);
  ctx.lineTo(centerX, centerY + radius * 0.5);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.2, centerY + radius * 0.5, radius * 0.2, 0, Math.PI);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(centerX + radius * 0.2, centerY + radius * 0.5, radius * 0.2, 0, Math.PI);
  ctx.stroke();
}

function drawMouse(ctx, width, height, color) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.3;
  
  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Ears
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.7, centerY - radius * 0.7, radius * 0.5, 0, Math.PI * 2);
  ctx.arc(centerX + radius * 0.7, centerY - radius * 0.7, radius * 0.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Eyes
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.3, centerY - radius * 0.2, radius * 0.1, 0, Math.PI * 2);
  ctx.arc(centerX + radius * 0.3, centerY - radius * 0.2, radius * 0.1, 0, Math.PI * 2);
  ctx.fill();
  
  // Nose
  ctx.fillStyle = '#FF69B4';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.15, 0, Math.PI * 2);
  ctx.fill();
  
  // Whiskers
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(1, width / 150);
  
  // Left whiskers
  ctx.beginPath();
  ctx.moveTo(centerX - radius * 0.15, centerY);
  ctx.lineTo(centerX - radius * 0.8, centerY - radius * 0.3);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(centerX - radius * 0.15, centerY);
  ctx.lineTo(centerX - radius * 0.8, centerY);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(centerX - radius * 0.15, centerY);
  ctx.lineTo(centerX - radius * 0.8, centerY + radius * 0.3);
  ctx.stroke();
  
  // Right whiskers
  ctx.beginPath();
  ctx.moveTo(centerX + radius * 0.15, centerY);
  ctx.lineTo(centerX + radius * 0.8, centerY - radius * 0.3);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(centerX + radius * 0.15, centerY);
  ctx.lineTo(centerX + radius * 0.8, centerY);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(centerX + radius * 0.15, centerY);
  ctx.lineTo(centerX + radius * 0.8, centerY + radius * 0.3);
  ctx.stroke();
}

function drawIcon(ctx, width, height, type, color) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.4;
  
  // Background
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Icon specific drawing
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = Math.max(2, width / 30);
  
  switch (type) {
    case 'gold_coin':
      // Gold coin
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.font = `bold ${radius * 0.8}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('¥', centerX, centerY);
      break;
      
    case 'diamond':
      // Diamond
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - radius * 0.7);
      ctx.lineTo(centerX + radius * 0.7, centerY);
      ctx.lineTo(centerX, centerY + radius * 0.7);
      ctx.lineTo(centerX - radius * 0.7, centerY);
      ctx.closePath();
      ctx.stroke();
      break;
      
    case 'coffee_cup':
      // Coffee cup
      ctx.beginPath();
      ctx.moveTo(centerX - radius * 0.5, centerY - radius * 0.3);
      ctx.lineTo(centerX - radius * 0.3, centerY + radius * 0.5);
      ctx.quadraticCurveTo(
        centerX, centerY + radius * 0.7,
        centerX + radius * 0.3, centerY + radius * 0.5
      );
      ctx.lineTo(centerX + radius * 0.5, centerY - radius * 0.3);
      ctx.closePath();
      ctx.stroke();
      
      // Handle
      ctx.beginPath();
      ctx.arc(centerX + radius * 0.6, centerY, radius * 0.3, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();
      
      // Steam
      ctx.beginPath();
      ctx.moveTo(centerX - radius * 0.1, centerY - radius * 0.3);
      ctx.quadraticCurveTo(
        centerX - radius * 0.3, centerY - radius * 0.7,
        centerX - radius * 0.2, centerY - radius * 0.9
      );
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(centerX + radius * 0.1, centerY - radius * 0.3);
      ctx.quadraticCurveTo(
        centerX + radius * 0.3, centerY - radius * 0.7,
        centerX + radius * 0.2, centerY - radius * 0.9
      );
      ctx.stroke();
      break;
      
    case 'settings':
      // Settings gear
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const x1 = centerX + radius * 0.4 * Math.cos(angle);
        const y1 = centerY + radius * 0.4 * Math.sin(angle);
        const x2 = centerX + radius * 0.7 * Math.cos(angle);
        const y2 = centerY + radius * 0.7 * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      break;
      
    default:
      // Default icon (question mark)
      ctx.font = `bold ${radius * 1.2}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', centerX, centerY);
  }
}

function drawScene(ctx, width, height, type) {
  let colors;
  
  if (type.includes('coffee_shop')) {
    colors = COLORS.scenes.coffeeShop;
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, colors[1]); // Cream
    gradient.addColorStop(1, colors[0]); // Brown
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Floor
    ctx.fillStyle = colors[0]; // Brown
    ctx.fillRect(0, height * 0.7, width, height * 0.3);
    
    // Counter
    ctx.fillStyle = colors[0]; // Brown
    ctx.fillRect(width * 0.2, height * 0.5, width * 0.6, height * 0.2);
    
    // Windows
    ctx.fillStyle = colors[1]; // Cream
    ctx.fillRect(width * 0.1, height * 0.2, width * 0.2, height * 0.3);
    ctx.fillRect(width * 0.7, height * 0.2, width * 0.2, height * 0.3);
    
    // Light
    ctx.fillStyle = colors[2]; // Gold
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.1, width * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Plants
    ctx.fillStyle = colors[3]; // Green
    ctx.beginPath();
    ctx.arc(width * 0.1, height * 0.6, width * 0.05, 0, Math.PI * 2);
    ctx.arc(width * 0.9, height * 0.6, width * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
  } else if (type.includes('fishing_area')) {
    colors = COLORS.scenes.fishingArea;
    
    // Sky
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, colors[0]); // Sky Blue
    gradient.addColorStop(1, colors[1]); // Steel Blue
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Water
    ctx.fillStyle = colors[1]; // Steel Blue
    ctx.fillRect(0, height * 0.6, width, height * 0.4);
    
    // Land
    ctx.fillStyle = colors[2]; // Forest Green
    ctx.beginPath();
    ctx.moveTo(0, height * 0.6);
    ctx.lineTo(width * 0.3, height * 0.6);
    ctx.lineTo(width * 0.4, height * 0.7);
    ctx.lineTo(width * 0.6, height * 0.7);
    ctx.lineTo(width * 0.7, height * 0.6);
    ctx.lineTo(width, height * 0.6);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    
    // Dock
    ctx.fillStyle = colors[3]; // Brown
    ctx.fillRect(width * 0.4, height * 0.6, width * 0.2, height * 0.3);
    
    // Sun
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(width * 0.8, height * 0.2, width * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // Trees
    ctx.fillStyle = colors[2]; // Forest Green
    ctx.beginPath();
    ctx.moveTo(width * 0.1, height * 0.6);
    ctx.lineTo(width * 0.2, height * 0.4);
    ctx.lineTo(width * 0.3, height * 0.6);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(width * 0.8, height * 0.6);
    ctx.lineTo(width * 0.9, height * 0.4);
    ctx.lineTo(width, height * 0.6);
    ctx.closePath();
    ctx.fill();
  } else {
    // Default scene (main menu)
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#FFB6C1'); // Pink
    gradient.addColorStop(1, '#FFF8DC'); // Cream
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Title area
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(width * 0.2, height * 0.3, width * 0.6, height * 0.4);
    
    // Cat silhouette
    ctx.fillStyle = '#FF8C69';
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.7, width * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(width * 0.45, height * 0.63);
    ctx.lineTo(width * 0.4, height * 0.55);
    ctx.lineTo(width * 0.45, height * 0.6);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(width * 0.55, height * 0.63);
    ctx.lineTo(width * 0.6, height * 0.55);
    ctx.lineTo(width * 0.55, height * 0.6);
    ctx.closePath();
    ctx.fill();
  }
}

function drawItem(ctx, width, height, type) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.4;
  
  if (type.includes('coffee') || type.includes('latte') || type.includes('cappuccino')) {
    // Coffee cup
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(centerX - radius * 0.6, centerY - radius * 0.5);
    ctx.lineTo(centerX - radius * 0.4, centerY + radius * 0.6);
    ctx.quadraticCurveTo(
      centerX, centerY + radius * 0.8,
      centerX + radius * 0.4, centerY + radius * 0.6
    );
    ctx.lineTo(centerX + radius * 0.6, centerY - radius * 0.5);
    ctx.closePath();
    ctx.fill();
    
    // Coffee
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY - radius * 0.4, radius * 0.5, radius * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Handle
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = radius * 0.15;
    ctx.beginPath();
    ctx.arc(centerX + radius * 0.8, centerY, radius * 0.4, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.stroke();
    
    // Steam
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = radius * 0.05;
    
    ctx.beginPath();
    ctx.moveTo(centerX - radius * 0.2, centerY - radius * 0.4);
    ctx.quadraticCurveTo(
      centerX - radius * 0.4, centerY - radius * 0.8,
      centerX - radius * 0.3, centerY - radius * 1
    );
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + radius * 0.2, centerY - radius * 0.4);
    ctx.quadraticCurveTo(
      centerX + radius * 0.4, centerY - radius * 0.8,
      centerX + radius * 0.3, centerY - radius * 1
    );
    ctx.stroke();
    
  } else if (type.includes('cake') || type.includes('cookie') || type.includes('macaron')) {
    // Dessert plate
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + radius * 0.5, radius * 0.8, radius * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    if (type.includes('cake')) {
      // Cake
      let cakeColor = '#F5DEB3'; // Default wheat color
      
      if (type.includes('chocolate')) {
        cakeColor = '#8B4513'; // Brown for chocolate
      } else if (type.includes('rainbow')) {
        // Rainbow gradient for rainbow cake
        const gradient = ctx.createLinearGradient(
          centerX - radius, centerY - radius,
          centerX + radius, centerY + radius
        );
        gradient.addColorStop(0, '#FF0000');
        gradient.addColorStop(0.2, '#FFA500');
        gradient.addColorStop(0.4, '#FFFF00');
        gradient.addColorStop(0.6, '#008000');
        gradient.addColorStop(0.8, '#0000FF');
        gradient.addColorStop(1, '#4B0082');
        cakeColor = gradient;
      } else if (type.includes('cheese')) {
        cakeColor = '#FFD700'; // Gold for cheesecake
      }
      
      ctx.fillStyle = cakeColor;
      ctx.beginPath();
      ctx.moveTo(centerX - radius * 0.6, centerY + radius * 0.3);
      ctx.lineTo(centerX - radius * 0.6, centerY - radius * 0.5);
      ctx.lineTo(centerX + radius * 0.6, centerY - radius * 0.5);
      ctx.lineTo(centerX + radius * 0.6, centerY + radius * 0.3);
      ctx.closePath();
      ctx.fill();
      
      // Frosting
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY - radius * 0.5, radius * 0.6, radius * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      
    } else if (type.includes('cookie')) {
      // Cookie
      ctx.fillStyle = '#D2B48C';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Chocolate chips
      ctx.fillStyle = '#8B4513';
      for (let i = 0; i < 7; i++) {
        const angle = (i * Math.PI * 2) / 7;
        const distance = radius * 0.3 * Math.random();
        const x = centerX + distance * Math.cos(angle);
        const y = centerY + distance * Math.sin(angle);
        
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.05, 0, Math.PI * 2);
        ctx.fill();
      }
      
    } else if (type.includes('macaron')) {
      // Macaron
      const macaronColor = '#FF69B4'; // Pink
      
      // Bottom
      ctx.fillStyle = macaronColor;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + radius * 0.1, radius * 0.5, radius * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Top
      ctx.beginPath();
      ctx.ellipse(centerX, centerY - radius * 0.1, radius * 0.5, radius * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Filling
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radius * 0.45, radius * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
  } else {
    // Generic item (box)
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(centerX - radius * 0.6, centerY - radius * 0.6, radius * 1.2, radius * 1.2);
    
    // Ribbon
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(centerX - radius * 0.6, centerY - radius * 0.1, radius * 1.2, radius * 0.2);
    ctx.fillRect(centerX - radius * 0.1, centerY - radius * 0.6, radius * 0.2, radius * 1.2);
    
    // Bow
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEffect(ctx, width, height, type) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.4;
  
  if (type.includes('particle')) {
    // Particle effect
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = radius * Math.random();
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);
      const particleSize = radius * 0.1 * Math.random();
      
      let color;
      if (type.includes('rainbow')) {
        const hue = (i * 360) / 20;
        color = `hsl(${hue}, 100%, 70%)`;
      } else if (type.includes('star')) {
        color = '#FFD700'; // Gold
      } else if (type.includes('heart')) {
        color = '#FF69B4'; // Pink
      } else if (type.includes('coin')) {
        color = '#FFD700'; // Gold
      } else {
        color = '#FFFFFF'; // White
      }
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, particleSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
  } else if (type.includes('burst') || type.includes('celebration')) {
    // Burst effect
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    
    if (type.includes('level_up')) {
      gradient.addColorStop(0, '#FFD700'); // Gold
      gradient.addColorStop(0.7, '#FFA500'); // Orange
      gradient.addColorStop(1, 'rgba(255, 165, 0, 0)'); // Transparent
    } else if (type.includes('success')) {
      gradient.addColorStop(0, '#32CD32'); // Lime Green
      gradient.addColorStop(0.7, '#008000'); // Green
      gradient.addColorStop(1, 'rgba(0, 128, 0, 0)'); // Transparent
    } else {
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(0.7, '#87CEEB');
      gradient.addColorStop(1, 'rgba(135, 206, 235, 0)');
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Rays
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = radius * 0.05;
    
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const innerRadius = radius * 0.7;
      const outerRadius = radius * 1.3;
      
      ctx.beginPath();
      ctx.moveTo(
        centerX + innerRadius * Math.cos(angle),
        centerY + innerRadius * Math.sin(angle)
      );
      ctx.lineTo(
        centerX + outerRadius * Math.cos(angle),
        centerY + outerRadius * Math.sin(angle)
      );
      ctx.stroke();
    }
    
  } else if (type.includes('weather')) {
    if (type.includes('rain')) {
      // Rain drops
      ctx.strokeStyle = '#87CEEB';
      ctx.lineWidth = width * 0.01;
      
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const length = height * 0.05;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - width * 0.01, y + length);
        ctx.stroke();
      }
      
    } else if (type.includes('snow')) {
      // Snowflakes
      ctx.fillStyle = '#FFFFFF';
      
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = width * 0.01 + Math.random() * width * 0.01;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
    } else if (type.includes('sun') || type.includes('ray')) {
      // Sun rays
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius * 1.5
      );
      gradient.addColorStop(0, 'rgba(255, 215, 0, 0.7)');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Default effect (glow)
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawButton(ctx, width, height, type) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.4;
  
  let buttonColor, textColor, buttonState;
  
  if (type.includes('primary')) {
    buttonColor = COLORS.ui.primary;
    textColor = '#FFFFFF';
  } else if (type.includes('secondary')) {
    buttonColor = COLORS.ui.secondary;
    textColor = '#FFFFFF';
  } else {
    buttonColor = COLORS.ui.accent;
    textColor = '#333333';
  }
  
  if (type.includes('pressed')) {
    buttonColor = darkenColor(buttonColor, 20);
    buttonState = 'pressed';
  } else if (type.includes('disabled')) {
    buttonColor = desaturateColor(buttonColor);
    textColor = '#999999';
    buttonState = 'disabled';
  } else if (type.includes('highlight')) {
    buttonColor = lightenColor(buttonColor, 20);
    buttonState = 'highlight';
  } else {
    buttonState = 'normal';
  }
  
  // Button shape
  ctx.fillStyle = buttonColor;
  const buttonWidth = width * 0.8;
  const buttonHeight = height * 0.4;
  const cornerRadius = buttonHeight * 0.5;
  
  roundRect(ctx, centerX - buttonWidth / 2, centerY - buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
  
  // Text
  ctx.fillStyle = textColor;
  ctx.font = `bold ${buttonHeight * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  let buttonText = 'Button';
  if (type.includes('primary')) {
    buttonText = '确定';
  } else if (type.includes('secondary')) {
    buttonText = '取消';
  }
  
  ctx.fillText(buttonText, centerX, centerY);
  
  // Effects based on state
  if (buttonState === 'highlight') {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    roundRect(ctx, centerX - buttonWidth / 2, centerY - buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius, true);
  } else if (buttonState === 'pressed') {
    // Inner shadow effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    roundRect(ctx, centerX - buttonWidth / 2 + 2, centerY - buttonHeight / 2 + 2, buttonWidth - 4, buttonHeight - 4, cornerRadius - 2);
  }
}

// Helper function to draw rounded rectangle
function roundRect(ctx, x, y, width, height, radius, stroke = false) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  
  if (stroke) {
    ctx.stroke();
  } else {
    ctx.fill();
  }
}

// Color manipulation helpers
function darkenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
}

function lightenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
}

function desaturateColor(color) {
  const num = parseInt(color.replace('#', ''), 16);
  const R = num >> 16;
  const G = num >> 8 & 0x00FF;
  const B = num & 0x0000FF;
  const gray = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  const grayHex = Math.round(gray).toString(16).padStart(2, '0');
  return `#${grayHex}${grayHex}${grayHex}`;
}

// Main generation functions
function generateCharacterImages() {
  console.log('Generating character images...');
  
  // Cat breeds with rarities
  const catBreeds = [
    { name: 'orange_cat', rarity: 'N', color: COLORS.characters.cat.N[0] },
    { name: 'white_cat', rarity: 'N', color: COLORS.characters.cat.N[1] },
    { name: 'black_cat', rarity: 'N', color: COLORS.characters.cat.N[2] },
    { name: 'gray_cat', rarity: 'N', color: COLORS.characters.cat.N[3] },
    { name: 'sakura_cat', rarity: 'R', color: COLORS.characters.cat.R[0] },
    { name: 'gentleman_cat', rarity: 'R', color: COLORS.characters.cat.R[1] },
    { name: 'milktea_cat', rarity: 'R', color: COLORS.characters.cat.R[2] },
    { name: 'starry_cat', rarity: 'R', color: COLORS.characters.cat.R[3] },
    { name: 'princess_cat', rarity: 'SR', color: COLORS.characters.cat.SR[0] },
    { name: 'mage_cat', rarity: 'SR', color: COLORS.characters.cat.SR[1] },
    { name: 'angel_cat', rarity: 'SR', color: COLORS.characters.cat.SR[2] },
    { name: 'ninja_cat', rarity: 'SR', color: COLORS.characters.cat.SR[3] },
    { name: 'phoenix_cat', rarity: 'SSR', color: COLORS.characters.cat.SSR[0] },
    { name: 'dragon_cat', rarity: 'SSR', color: COLORS.characters.cat.SSR[1] },
    { name: 'unicorn_cat', rarity: 'SSR', color: COLORS.characters.cat.SSR[2] },
    { name: 'stellar_cat', rarity: 'SSR', color: COLORS.characters.cat.SSR[3] },
    { name: 'genesis_cat', rarity: 'USR', color: COLORS.characters.cat.USR[0] },
    { name: 'spacetime_cat', rarity: 'USR', color: COLORS.characters.cat.USR[1] },
    { name: 'destiny_cat', rarity: 'USR', color: COLORS.characters.cat.USR[2] },
    { name: 'infinite_cat', rarity: 'USR', color: COLORS.characters.cat.USR[3] }
  ];
  
  // Dog breeds
  const dogBreeds = [
    { name: 'golden_welcome', color: COLORS.characters.dog[0] },
    { name: 'shiba_reception', color: COLORS.characters.dog[1] },
    { name: 'husky_service', color: COLORS.characters.dog[2] },
    { name: 'german_guard', color: COLORS.characters.dog[0] },
    { name: 'rottweiler_security', color: COLORS.characters.dog[3] },
    { name: 'border_analyst', color: COLORS.characters.dog[1] }
  ];
  
  // Mouse breeds
  const mouseBreeds = [
    { name: 'cream_hamster', color: COLORS.characters.mouse[0] },
    { name: 'chocolate_hamster', color: COLORS.characters.mouse[1] },
    { name: 'matcha_hamster', color: COLORS.characters.mouse[2] },
    { name: 'cloud_chinchilla', color: COLORS.characters.mouse[0] },
    { name: 'rainbow_chinchilla', color: COLORS.characters.mouse[3] },
    { name: 'nut_squirrel', color: COLORS.characters.mouse[1] },
    { name: 'berry_squirrel', color: COLORS.characters.mouse[2] }
  ];
  
  // Generate cat images
  for (const cat of catBreeds) {
    for (const size of SIZES.characters) {
      const outputPath = path.join(OUTPUT_DIR, 'Characters', 'Cats', cat.name, `${cat.name}_${size}.png`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.clearRect(0, 0, size, size);
      
      // Draw cat
      drawCat(ctx, size, size, cat.color, cat.rarity);
      
      // Save image
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);
      console.log(`Generated: ${outputPath}`);
    }
  }
  
  // Generate dog images
  for (const dog of dogBreeds) {
    for (const size of SIZES.characters) {
      const outputPath = path.join(OUTPUT_DIR, 'Characters', 'Dogs', dog.name, `${dog.name}_${size}.png`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.clearRect(0, 0, size, size);
      
      // Draw dog
      drawDog(ctx, size, size, dog.color);
      
      // Save image
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);
      console.log(`Generated: ${outputPath}`);
    }
  }
  
  // Generate mouse images
  for (const mouse of mouseBreeds) {
    for (const size of SIZES.characters) {
      const outputPath = path.join(OUTPUT_DIR, 'Characters', 'Mice', mouse.name, `${mouse.name}_${size}.png`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.clearRect(0, 0, size, size);
      
      // Draw mouse
      drawMouse(ctx, size, size, mouse.color);
      
      // Save image
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);
      console.log(`Generated: ${outputPath}`);
    }
  }
}

function generateUIImages() {
  console.log('Generating UI images...');
  
  // UI elements
  const uiElements = [
    { name: 'gold_coin', type: 'gold_coin', color: '#FFD700' },
    { name: 'diamond', type: 'diamond', color: '#4169E1' },
    { name: 'coffee_cup', type: 'coffee_cup', color: '#8B4513' },
    { name: 'settings', type: 'settings', color: '#808080' },
    { name: 'primary_normal', type: 'button', color: COLORS.ui.primary },
    { name: 'primary_pressed', type: 'button', color: COLORS.ui.primary },
    { name: 'primary_disabled', type: 'button', color: COLORS.ui.primary },
    { name: 'primary_highlight', type: 'button', color: COLORS.ui.primary },
    { name: 'secondary_normal', type: 'button', color: COLORS.ui.secondary },
    { name: 'secondary_pressed', type: 'button', color: COLORS.ui.secondary },
    { name: 'secondary_disabled', type: 'button', color: COLORS.ui.secondary }
  ];
  
  for (const ui of uiElements) {
    for (const size of SIZES.ui) {
      const outputPath = path.join(OUTPUT_DIR, 'UI', ui.name, `${ui.name}_${size}.png`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.clearRect(0, 0, size, size);
      
      // Draw UI element
      if (ui.type === 'button') {
        drawButton(ctx, size, size, ui.name);
      } else {
        drawIcon(ctx, size, size, ui.type, ui.color);
      }
      
      // Save image
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);
      console.log(`Generated: ${outputPath}`);
    }
  }
}

function generateItemImages() {
  console.log('Generating item images...');
  
  // Food items
  const foodItems = [
    'americano', 'latte', 'cappuccino', 'cat_latte_art', 'rainbow_mocha',
    'cheesecake', 'chocolate_cake', 'rainbow_cake', 'macaron', 'cookie'
  ];
  
  // Generate food items
  for (const item of foodItems) {
    for (const size of SIZES.items) {
      const outputPath = path.join(OUTPUT_DIR, 'Items', item, `${item}_${size}.png`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.clearRect(0, 0, size, size);
      
      // Draw item
      drawItem(ctx, size, size, item);
      
      // Save image
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);
      console.log(`Generated: ${outputPath}`);
    }
  }
}

function generateSceneImages() {
  console.log('Generating scene images...');
  
  // Scene backgrounds
  const scenes = [
    'coffee_shop_bg',
    'fishing_area_bg',
    'main_menu_bg'
  ];
  
  // Generate scene backgrounds
  for (const scene of scenes) {
    for (const size of SIZES.scenes) {
      const outputPath = path.join(OUTPUT_DIR, 'Scenes', scene, `${scene}_${size}.png`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.clearRect(0, 0, size, size);
      
      // Draw scene
      drawScene(ctx, size, size, scene);
      
      // Save image
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);
      console.log(`Generated: ${outputPath}`);
    }
  }
}

function generateEffectImages() {
  console.log('Generating effect images...');
  
  // Effects
  const effects = [
    'coffee_steam', 'star_sparkle', 'heart_particles', 'coin_burst', 'rainbow_particles',
    'level_up_burst', 'success_celebration', 'failure_shake', 'loading_spinner',
    'rain_drops', 'snow_flakes', 'sun_rays'
  ];
  
  // Generate effects
  for (const effect of effects) {
    for (const size of SIZES.effects) {
      const outputPath = path.join(OUTPUT_DIR, 'Effects', effect.includes('_particles') ? 'Particles' : 
                                  effect.includes('_burst') || effect.includes('celebration') || effect.includes('shake') || effect.includes('spinner') ? 'Animations' : 
                                  'Weather', effect, `${effect}_${size}.png`);
      ensureDirectoryExists(path.dirname(outputPath));
      
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.clearRect(0, 0, size, size);
      
      // Draw effect
      drawEffect(ctx, size, size, effect);
      
      // Save image
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);
      console.log(`Generated: ${outputPath}`);
    }
  }
}

// Main function
function main() {
  console.log('Starting image generation...');
  
  try {
    // Generate all image types
    generateCharacterImages();
    generateUIImages();
    generateItemImages();
    generateSceneImages();
    generateEffectImages();
    
    console.log('Image generation complete!');
  } catch (error) {
    console.error('Error generating images:', error);
  }
}

main();