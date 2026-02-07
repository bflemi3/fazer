import sharp from "sharp";
import { mkdirSync } from "fs";

mkdirSync("public/icons", { recursive: true });

// Stripe-inspired "F" — slightly italic, rounded stroke terminals
// The F is drawn with rounded linecap/linejoin, slanted ~8 degrees
function createFSvg(size, padding = 0) {
  const p = padding; // extra padding for maskable safe zone
  const viewSize = size;
  const inset = p;
  const usable = viewSize - p * 2;

  // F letter geometry (relative to usable area, centered)
  // The F has: top horizontal bar, vertical stem, middle horizontal bar
  // Slanted by using a transform
  const cx = viewSize / 2;
  const cy = viewSize / 2;

  // Stroke width relative to icon size — bold
  const sw = usable * 0.18;
  // F dimensions — larger
  const fHeight = usable * 0.50;
  const fWidth = usable * 0.38;
  const midWidth = usable * 0.30;

  // Top-left of the F bounding box (centered in usable area)
  const fx = cx - fWidth * 0.38;
  const fy = cy - fHeight / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="#8B5CF6"/>
  <g transform="skewX(-10)" stroke="white" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" fill="none" transform-origin="${cx} ${cy}">
    <!-- Vertical stem -->
    <line x1="${fx}" y1="${fy}" x2="${fx}" y2="${fy + fHeight}"/>
    <!-- Top bar -->
    <line x1="${fx}" y1="${fy}" x2="${fx + fWidth}" y2="${fy}"/>
    <!-- Middle bar -->
    <line x1="${fx}" y1="${fy + fHeight * 0.43}" x2="${fx + midWidth}" y2="${fy + fHeight * 0.43}"/>
  </g>
</svg>`;
}

// Maskable icons need safe zone padding (10% on each side per spec)
function createFSvgMaskable(size) {
  const padding = size * 0.1;
  const viewSize = size;
  const cx = viewSize / 2;
  const cy = viewSize / 2;
  const usable = viewSize - padding * 2;

  const sw = usable * 0.18;
  const fHeight = usable * 0.50;
  const fWidth = usable * 0.38;
  const midWidth = usable * 0.30;

  const fx = cx - fWidth * 0.38;
  const fy = cy - fHeight / 2;

  // Maskable: no rounded corners on background (OS applies its own mask)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#8B5CF6"/>
  <g transform="skewX(-10)" stroke="white" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" fill="none" transform-origin="${cx} ${cy}">
    <!-- Vertical stem -->
    <line x1="${fx}" y1="${fy}" x2="${fx}" y2="${fy + fHeight}"/>
    <!-- Top bar -->
    <line x1="${fx}" y1="${fy}" x2="${fx + fWidth}" y2="${fy}"/>
    <!-- Middle bar -->
    <line x1="${fx}" y1="${fy + fHeight * 0.43}" x2="${fx + midWidth}" y2="${fy + fHeight * 0.43}"/>
  </g>
</svg>`;
}

const icons = [
  { name: "public/icons/icon-192x192.png", size: 192, maskable: false },
  { name: "public/icons/icon-512x512.png", size: 512, maskable: false },
  { name: "public/icons/icon-192x192-maskable.png", size: 192, maskable: true },
  { name: "public/icons/icon-512x512-maskable.png", size: 512, maskable: true },
  { name: "public/apple-touch-icon.png", size: 180, maskable: false },
  { name: "app/favicon.ico", size: 32, maskable: false },
];

for (const icon of icons) {
  const svg = icon.maskable
    ? createFSvgMaskable(icon.size)
    : createFSvg(icon.size);
  if (icon.name.endsWith(".ico")) {
    await sharp(Buffer.from(svg)).png().toFile(icon.name.replace(".ico", ".png"));
    await sharp(icon.name.replace(".ico", ".png")).toFile(icon.name);
    const { unlinkSync } = await import("fs");
    unlinkSync(icon.name.replace(".ico", ".png"));
  } else {
    await sharp(Buffer.from(svg)).png().toFile(icon.name);
  }
  console.log(`✓ ${icon.name} (${icon.size}x${icon.size})`);
}

console.log("\nDone! Icons generated.");
