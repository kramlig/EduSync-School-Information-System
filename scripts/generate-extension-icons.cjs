/**
 * Script to generate extension icons from source logo
 * Run: node scripts/generate-extension-icons.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE_IMAGE = path.join(__dirname, '../image/e_logoHD.png');
const OUTPUT_DIR = path.join(__dirname, '../extensions/edusync-lis-helper/icons');

const SIZES = [16, 32, 48, 128];

async function generateIcons() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Generating extension icons from:', SOURCE_IMAGE);

  for (const size of SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon${size}.png`);
    
    await sharp(SOURCE_IMAGE)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`✓ Created icon${size}.png`);
  }

  console.log('\nDone! Icons created in:', OUTPUT_DIR);
}

generateIcons().catch(console.error);
