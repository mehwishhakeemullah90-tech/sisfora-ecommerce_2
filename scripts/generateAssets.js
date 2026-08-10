// scripts/generateAssets.js
// -----------------------------------------------------------------------
// Generates tasteful, on-brand SVG placeholder imagery (product shots,
// category tiles, hero banners, blog covers, logo/avatar) so the store
// looks polished out of the box, with zero external image dependencies.
// Run: node scripts/generateAssets.js
// Swap any of these out for real photography whenever you're ready —
// just keep the same file paths, or update the URLs via the admin panel.
// -----------------------------------------------------------------------
const fs = require('fs');
const path = require('path');

const PALETTES = [
  ['#f7e7e4', '#eab8c0'], // blush
  ['#fdf6ec', '#e8d3a0'], // gold sand
  ['#f3ece6', '#c9a24b'], // gold
  ['#f6e9ea', '#d98fa0'], // rose
  ['#efe6e2', '#8a7f7a'], // taupe
  ['#faf3ef', '#eab8c0'],
];

function productSVG({ label, sub, palette }) {
  const [bg, accent] = palette;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="700" viewBox="0 0 600 700">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <rect width="600" height="700" fill="url(#g)"/>
  <ellipse cx="300" cy="640" rx="160" ry="18" fill="${accent}" opacity="0.15"/>
  <rect x="230" y="230" width="140" height="230" rx="14" fill="#ffffff" stroke="${accent}" stroke-width="2"/>
  <rect x="255" y="190" width="90" height="60" rx="10" fill="${accent}" opacity="0.85"/>
  <rect x="245" y="300" width="110" height="60" rx="4" fill="${accent}" opacity="0.25"/>
  <circle cx="300" cy="150" r="46" fill="${accent}" opacity="0.18"/>
  <text x="300" y="520" font-family="Georgia, 'Times New Roman', serif" font-size="30" fill="#1a1512" text-anchor="middle">${label}</text>
  <text x="300" y="555" font-family="Arial, sans-serif" font-size="15" letter-spacing="3" fill="${accent}" text-anchor="middle">${sub}</text>
</svg>`;
}

function categorySVG({ label, palette }) {
  const [bg, accent] = palette;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
  <defs>
    <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${bg}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="450" fill="url(#g2)"/>
  <circle cx="470" cy="80" r="90" fill="${accent}" opacity="0.2"/>
  <circle cx="90" cy="380" r="110" fill="#ffffff" opacity="0.35"/>
  <text x="300" y="235" font-family="Georgia, 'Times New Roman', serif" font-size="42" fill="#1a1512" text-anchor="middle">${label}</text>
</svg>`;
}

function heroSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
  <defs>
    <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f7e7e4"/>
      <stop offset="55%" stop-color="#fffaf7"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <rect width="900" height="900" fill="url(#hg)"/>
  <circle cx="700" cy="180" r="220" fill="#c9a24b" opacity="0.14"/>
  <circle cx="150" cy="750" r="180" fill="#eab8c0" opacity="0.28"/>
  <rect x="320" y="330" width="260" height="380" rx="20" fill="#ffffff" stroke="#c9a24b" stroke-width="3"/>
  <rect x="360" y="270" width="180" height="90" rx="16" fill="#1a1512"/>
  <rect x="360" y="470" width="180" height="120" rx="6" fill="#eab8c0" opacity="0.5"/>
  <text x="450" y="640" font-family="Georgia, 'Times New Roman', serif" font-size="34" fill="#1a1512" text-anchor="middle">Sisfora</text>
  <text x="450" y="672" font-family="Arial, sans-serif" font-size="14" letter-spacing="4" fill="#c9a24b" text-anchor="middle">NATURAL LUXURY</text>
</svg>`;
}

function aboutHeroSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">
  <defs>
    <linearGradient id="ag" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1512"/>
      <stop offset="100%" stop-color="#2b2422"/>
    </linearGradient>
  </defs>
  <rect width="900" height="700" fill="url(#ag)"/>
  <circle cx="180" cy="140" r="150" fill="#c9a24b" opacity="0.18"/>
  <circle cx="760" cy="560" r="180" fill="#eab8c0" opacity="0.15"/>
  <text x="450" y="330" font-family="Georgia, 'Times New Roman', serif" font-size="46" fill="#ffffff" text-anchor="middle">Reveal Your</text>
  <text x="450" y="390" font-family="Georgia, 'Times New Roman', serif" font-size="46" fill="#e8d3a0" text-anchor="middle" font-style="italic">Natural Beauty</text>
</svg>`;
}

function blogSVG({ label, palette }) {
  const [bg, accent] = palette;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="${bg}"/>
  <circle cx="650" cy="100" r="120" fill="${accent}" opacity="0.25"/>
  <circle cx="120" cy="500" r="100" fill="#ffffff" opacity="0.4"/>
  <text x="400" y="310" font-family="Georgia, 'Times New Roman', serif" font-size="34" fill="#1a1512" text-anchor="middle">${label}</text>
</svg>`;
}

function logoFavicon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#1a1512"/>
  <text x="32" y="42" font-family="Georgia, serif" font-size="30" fill="#c9a24b" text-anchor="middle">S</text>
</svg>`;
}

function avatarSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" rx="60" fill="#f7e7e4"/>
  <circle cx="60" cy="48" r="22" fill="#eab8c0"/>
  <ellipse cx="60" cy="102" rx="38" ry="26" fill="#eab8c0"/>
</svg>`;
}

const productsDir = path.join(__dirname, '..', 'public', 'images', 'products');
const brandDir = path.join(__dirname, '..', 'public', 'images', 'brand');
fs.mkdirSync(productsDir, { recursive: true });
fs.mkdirSync(brandDir, { recursive: true });

// Generic fallback placeholder
fs.writeFileSync(path.join(productsDir, 'placeholder.svg'), productSVG({ label: 'Sisfora', sub: 'PRODUCT', palette: PALETTES[0] }));

// Hero + about imagery
fs.writeFileSync(path.join(productsDir, 'hero-banner.svg'), heroSVG());
fs.writeFileSync(path.join(productsDir, 'about-hero.svg'), aboutHeroSVG());

// Brand assets
fs.writeFileSync(path.join(brandDir, 'favicon.svg'), logoFavicon());
fs.writeFileSync(path.join(brandDir, 'default-avatar.svg'), avatarSVG());

// Product images (numbered so seed data can reference them predictably)
const productLabels = [
  ['Rose Radiance', 'SERUM'], ['Velvet Matte', 'LIPSTICK'], ['Gold Dew', 'HIGHLIGHTER'],
  ['Silk Veil', 'FOUNDATION'], ['Bloom & Glow', 'BLUSH'], ['Pure Hydra', 'MOISTURIZER'],
  ['Midnight Kohl', 'EYELINER'], ['Honey Nectar', 'LIP OIL'], ['Cashmere Cloud', 'SETTING POWDER'],
  ['Amber Bloom', 'EAU DE PARFUM'], ['Silk Lash', 'MASCARA'], ['Dewy Petal', 'FACE MIST'],
  ['Rosewater Toner', 'TONER'], ['Gilded Bronze', 'BRONZER'], ['Whisper Nude', 'LIPSTICK'],
  ['Camellia Cream', 'NIGHT CREAM'], ['Sunlit Glow', 'SPF MOISTURIZER'], ['Petal Soft', 'CLEANSER'],
];
productLabels.forEach(([label, sub], i) => {
  const palette = PALETTES[i % PALETTES.length];
  fs.writeFileSync(path.join(productsDir, `product-${i + 1}.svg`), productSVG({ label, sub, palette }));
});

// Category tiles
const categories = [
  ['Skincare', PALETTES[0]], ['Makeup', PALETTES[3]], ['Fragrance', PALETTES[2]],
  ['Haircare', PALETTES[4]], ['Body Care', PALETTES[1]], ['Gift Sets', PALETTES[5]],
];
categories.forEach(([label, palette]) => {
  fs.writeFileSync(path.join(productsDir, `category-${label.toLowerCase().replace(/\s+/g, '-')}.svg`), categorySVG({ label, palette }));
});

// Blog covers
const blogTopics = ['Skincare Rituals', 'The Art of Layering', 'Clean Beauty 101', 'Glow From Within'];
blogTopics.forEach((label, i) => {
  fs.writeFileSync(path.join(productsDir, `blog-${i + 1}.svg`), blogSVG({ label, palette: PALETTES[i % PALETTES.length] }));
});

console.log('✅ Brand + product placeholder imagery generated in public/images/');
