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

/** Широкий логотип: ограничиваем размер, чтобы не обрезало на Android/iOS. */
const ICON_SAFE = {
  any: { maxWidthRatio: 0.6, maxHeightRatio: 0.32 },
  maskable: { maxWidthRatio: 0.5, maxHeightRatio: 0.26 },
};

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

async function getLogoAspectRatio() {
  const meta = await sharp(logoPath).metadata();
  return (meta.width || 1) / (meta.height || 1);
}

function roundedRectSvg(size, radius, fill) {
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${fill}"/>
    </svg>`,
  );
}

async function resizeLogoForIcon(size, variant) {
  const safe = ICON_SAFE[variant];
  const aspect = await getLogoAspectRatio();

  let logoWidth = Math.round(size * safe.maxWidthRatio);
  let logoHeight = Math.round(logoWidth / aspect);
  if (logoHeight > Math.round(size * safe.maxHeightRatio)) {
    logoHeight = Math.round(size * safe.maxHeightRatio);
    logoWidth = Math.round(logoHeight * aspect);
  }

  return sharp(logoPath)
    .resize(logoWidth, logoHeight, {
      fit: "inside",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

/** maskable — квадрат с полями (Android). any — скруглённые углы (ПК, iOS, manifest any). */
async function createAppIcon(size, outPath, variant = "any") {
  const logo = await resizeLogoForIcon(size, variant);

  if (variant === "maskable") {
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
    return;
  }

  const radius = Math.round(size * 0.22);
  const roundedBackground = await sharp(roundedRectSvg(size, radius, BACKGROUND))
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: roundedBackground, gravity: "centre" },
      { input: logo, gravity: "centre" },
    ])
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

  await createAppIcon(192, path.join(iconsDir, "icon-192.png"), "any");
  await createAppIcon(512, path.join(iconsDir, "icon-512.png"), "any");
  await createAppIcon(192, path.join(iconsDir, "icon-192-maskable.png"), "maskable");
  await createAppIcon(512, path.join(iconsDir, "icon-512-maskable.png"), "maskable");

  await createAppIcon(32, path.join(appDir, "favicon-32.png"), "any");
  await createAppIcon(192, path.join(appMetaDir, "icon.png"), "any");
  await createAppIcon(180, path.join(appMetaDir, "apple-icon.png"), "any");

  await createOgImage(path.join(appDir, "og-image.png"));
  await createOgImage(path.join(appMetaDir, "opengraph-image.png"));
  await createSplash(1170, 2532, path.join(splashDir, "apple-splash-1170x2532.png"));
  await createSplash(1284, 2778, path.join(splashDir, "apple-splash-1284x2778.png"));

  console.log("PWA icons regenerated with safe padding for wide logo");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
