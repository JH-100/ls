const sharp = require('sharp');
const path = require('path');

const sizes = [192, 512];

async function generateIcon(size) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${Math.round(size * 0.16)}" fill="#4A90D9"/>
    <text x="${size / 2}" y="${size * 0.65}" font-family="Arial,Helvetica,sans-serif" font-size="${Math.round(size * 0.5)}" font-weight="900" fill="white" text-anchor="middle">LS</text>
  </svg>`;

  const outPath = path.join(__dirname, '..', 'public', 'assets', `icon-${size}.png`);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`Generated: icon-${size}.png`);
}

async function main() {
  for (const size of sizes) {
    await generateIcon(size);
  }
  console.log('Done!');
}

main().catch(console.error);
