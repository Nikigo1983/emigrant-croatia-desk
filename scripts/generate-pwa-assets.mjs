/**
 * Иконки PWA / favicon — из public/new_logo1.png (вкладка, панель задач, ярлык).
 * Превью ссылок и splash — из public/logo.png (логотип внутри приложения).
 * Run: npm run generate:pwa
 */
import { mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const designedIconPath = path.join(root, "public", "new_logo1.png");
const legacyIconPath = path.join(root, "public", "main_logo.jpg");
const siteLogoPath = path.join(root, "public", "logo.png");
const iconsDir = path.join(root, "public", "icons");
const splashDir = path.join(root, "public", "splash");
const appDir = path.join(root, "public");
const appMetaDir = path.join(root, "app");

const BACKGROUND = "#F8FAFC";
const ICON_CORNER_RADIUS = 0.22;

const SQUARE_ICON_INSET = {
  any: 0.06,
  maskable: 0.14,
};

const WIDE_ICON_SAFE = {
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

async function isSquareImage(filePath) {
  const meta = await sharp(filePath).metadata();
  const aspect = (meta.width || 1) / (meta.height || 1);
  return aspect >= 0.85 && aspect <= 1.15;
}

async function getAspectRatio(filePath) {
  const meta = await sharp(filePath).metadata();
  return (meta.width || 1) / (meta.height || 1);
}

function roundedRectSvg(size, radius, fill) {
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${fill}"/>
    </svg>`,
  );
}

async function resolveIconSource() {
  if (await fileExists(designedIconPath)) {
    return { path: designedIconPath, mode: "designed" };
  }
  if (await fileExists(legacyIconPath)) {
    return { path: legacyIconPath, mode: "legacy" };
  }
  return null;
}

/** Готовая иконка new_logo1.png — скругление уже в файле. */
async function createDesignedAppIcon(sourcePath, size, outPath, variant = "any") {
  const scale = variant === "maskable" ? 0.86 : 1;
  const inner = Math.round(size * scale);
  const logo = await sharp(sourcePath)
    .resize(inner, inner, { fit: "cover" })
    .png()
    .toBuffer();

  if (variant === "any" && scale === 1) {
    await sharp(logo).png().toFile(outPath);
    return;
  }

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(outPath);
}

async function resizeForAppIcon(sourcePath, size, variant, square) {
  if (square) {
    const inset = Math.round(size * SQUARE_ICON_INSET[variant]);
    const inner = size - inset * 2;
    return sharp(sourcePath)
      .resize(inner, inner, { fit: "cover" })
      .png()
      .toBuffer();
  }

  const safe = WIDE_ICON_SAFE[variant];
  const aspect = await getAspectRatio(sourcePath);

  let logoWidth = Math.round(size * safe.maxWidthRatio);
  let logoHeight = Math.round(logoWidth / aspect);
  if (logoHeight > Math.round(size * safe.maxHeightRatio)) {
    logoHeight = Math.round(size * safe.maxHeightRatio);
    logoWidth = Math.round(logoHeight * aspect);
  }

  return sharp(sourcePath)
    .resize(logoWidth, logoHeight, {
      fit: "inside",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function createLegacyAppIcon(sourcePath, square, size, outPath, variant = "any") {
  const logo = await resizeForAppIcon(sourcePath, size, variant, square);

  if (square && variant === "any") {
    const radius = Math.round(size * ICON_CORNER_RADIUS);
    const roundedMask = await sharp(roundedRectSvg(size, radius, "#ffffff"))
      .png()
      .toBuffer();

    const squareImage = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: logo, gravity: "centre" }])
      .png()
      .toBuffer();

    await sharp(squareImage)
      .composite([{ input: roundedMask, blend: "dest-in" }])
      .png()
      .toFile(outPath);
    return;
  }

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

  const radius = Math.round(size * ICON_CORNER_RADIUS);
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

async function createOgImage(sourcePath, square, outPath) {
  const width = 1200;
  const height = 630;
  const logoSize = square ? 280 : 520;

  const logo = square
    ? await sharp(sourcePath)
        .resize(logoSize, logoSize, { fit: "inside", background: BACKGROUND })
        .png()
        .toBuffer()
    : await sharp(sourcePath)
        .resize(logoSize, null, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
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

async function createSplash(sourcePath, square, width, height, outPath) {
  const logoSize = square ? Math.round(width * 0.34) : Math.round(width * 0.42);
  const logo = square
    ? await sharp(sourcePath)
        .resize(logoSize, logoSize, { fit: "inside", background: BACKGROUND })
        .png()
        .toBuffer()
    : await sharp(sourcePath)
        .resize(logoSize, null, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
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
  const iconSource = await resolveIconSource();
  if (!iconSource) {
    console.error("Missing public/new_logo1.png (или fallback public/main_logo.jpg)");
    process.exit(1);
  }
  if (!(await fileExists(siteLogoPath))) {
    console.error("Missing public/logo.png (логотип внутри приложения)");
    process.exit(1);
  }

  const iconSquare = await isSquareImage(iconSource.path);
  const siteSquare = await isSquareImage(siteLogoPath);

  await ensureDir(iconsDir);
  await ensureDir(splashDir);
  await ensureDir(appMetaDir);

  const iconJobs = [
    [192, path.join(iconsDir, "icon-192.png"), "any"],
    [512, path.join(iconsDir, "icon-512.png"), "any"],
    [192, path.join(iconsDir, "icon-192-maskable.png"), "maskable"],
    [512, path.join(iconsDir, "icon-512-maskable.png"), "maskable"],
    [32, path.join(appDir, "favicon-32.png"), "any"],
    [192, path.join(appMetaDir, "icon.png"), "any"],
    [180, path.join(appMetaDir, "apple-icon.png"), "any"],
  ];

  for (const [size, outPath, variant] of iconJobs) {
    if (iconSource.mode === "designed") {
      await createDesignedAppIcon(iconSource.path, size, outPath, variant);
    } else {
      await createLegacyAppIcon(iconSource.path, iconSquare, size, outPath, variant);
    }
  }

  await createOgImage(siteLogoPath, siteSquare, path.join(appDir, "og-image.png"));
  await createOgImage(siteLogoPath, siteSquare, path.join(appMetaDir, "opengraph-image.png"));
  await createSplash(siteLogoPath, siteSquare, 1170, 2532, path.join(splashDir, "apple-splash-1170x2532.png"));
  await createSplash(siteLogoPath, siteSquare, 1284, 2778, path.join(splashDir, "apple-splash-1284x2778.png"));

  console.log(
    `PWA icons from ${path.basename(iconSource.path)}; внутри сайта — logo.png без изменений`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
