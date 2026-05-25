/**
 * Generates PWA icons and iOS splash from public/logo.png.
 * Run: npm run generate:pwa
 */
import { mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const logoPath = path.join(root, "public", "logo.png");
const iconsDir = path.join(root, "public", "icons");
const splashDir = path.join(root, "public", "splash");
const appDir = path.join(root, "public");
const appMetaDir = path.join(root, "app");

const BACKGROUND = "#F8FAFC";
async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function createIcon(size, outPath) {
  const padding = Math.round(size * 0.14);
  const inner = size - padding * 2;
  const logo = await sharp(logoPath)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(outPath);
}

async function createOgImage(outPath) {
  const width = 1200;
  const height = 630;
  const logoWidth = 520;
  const logo = await sharp(logoPath)
    .resize(logoWidth, null, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(outPath);
}

async function createSplash(width, height, outPath) {
  const logoWidth = Math.round(width * 0.42);
  const logo = await sharp(logoPath)
    .resize(logoWidth, null, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(outPath);
}

async function main() {
  if (!(await fileExists(logoPath))) {
    console.error("Missing public/logo.png");
    process.exit(1);
  }

  await ensureDir(iconsDir);
  await ensureDir(splashDir);
  await ensureDir(appMetaDir);

  await createIcon(192, path.join(iconsDir, "icon-192.png"));
  await createIcon(512, path.join(iconsDir, "icon-512.png"));
  await createIcon(32, path.join(appDir, "favicon-32.png"));
  await createIcon(192, path.join(appMetaDir, "icon.png"));
  await createIcon(180, path.join(appMetaDir, "apple-icon.png"));
  await createOgImage(path.join(appDir, "og-image.png"));
  await createOgImage(path.join(appMetaDir, "opengraph-image.png"));
  await createSplash(1170, 2532, path.join(splashDir, "apple-splash-1170x2532.png"));
  await createSplash(1284, 2778, path.join(splashDir, "apple-splash-1284x2778.png"));

  console.log(
    "PWA + OG assets: public/icons, public/og-image.png, app/icon.png, app/opengraph-image.png",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
