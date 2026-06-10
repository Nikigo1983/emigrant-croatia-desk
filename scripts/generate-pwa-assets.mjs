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

async function sampleBrandBlue(sourcePath) {
  const { data, info } = await sharp(sourcePath)
    .resize(300, 300, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let best = { r: 33, g: 0, b: 255 };
  let bestScore = 0;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const idx = (y * info.width + x) * info.channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const score = b - Math.max(r, g);
      if (b > 90 && score > bestScore) {
        bestScore = score;
        best = { r, g, b };
      }
    }
  }

  return best;
}

function isBackgroundWhite(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return min > 228 && max - min < 30;
}

function isLogoPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max - min;

  if (min > 175 && saturation < 45) {
    return true;
  }

  if (min > 110 && saturation < 70 && b >= r - 25 && b >= g - 25) {
    return true;
  }

  return false;
}

function markOuterBackground(size, pixels, channels) {
  const background = new Uint8Array(size * size);
  const queue = [];

  const tryPush = (x, y) => {
    const idx = y * size + x;
    if (background[idx]) {
      return;
    }
    const base = idx * channels;
    const r = pixels[base];
    const g = pixels[base + 1];
    const b = pixels[base + 2];
    if (!isBackgroundWhite(r, g, b)) {
      return;
    }
    background[idx] = 1;
    queue.push(idx);
  };

  for (let x = 0; x < size; x += 1) {
    tryPush(x, 0);
    tryPush(x, size - 1);
  }
  for (let y = 0; y < size; y += 1) {
    tryPush(0, y);
    tryPush(size - 1, y);
  }

  while (queue.length > 0) {
    const idx = queue.pop();
    const x = idx % size;
    const y = Math.floor(idx / size);
    if (x > 0) {
      tryPush(x - 1, y);
    }
    if (x < size - 1) {
      tryPush(x + 1, y);
    }
    if (y > 0) {
      tryPush(x, y - 1);
    }
    if (y < size - 1) {
      tryPush(x, y + 1);
    }
  }

  return background;
}

/** Фон до краёв — сплошной синий; белым остаётся только знак (домик + emi). */
async function flattenDesignedIcon(sourcePath, size, blue) {
  const { data, info } = await sharp(sourcePath)
    .resize(size, size, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const outerBackground = markOuterBackground(size, data, channels);
  const output = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const pixelIdx = y * size + x;
      const srcIdx = pixelIdx * channels;
      const outIdx = pixelIdx * 4;
      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];
      const keepLogo = !outerBackground[pixelIdx] && isLogoPixel(r, g, b);

      if (keepLogo) {
        output[outIdx] = r;
        output[outIdx + 1] = g;
        output[outIdx + 2] = b;
      } else {
        output[outIdx] = blue.r;
        output[outIdx + 1] = blue.g;
        output[outIdx + 2] = blue.b;
      }

      output[outIdx + 3] = 255;
    }
  }

  return sharp(output, { raw: { width: size, height: size, channels: 4 } }).png().toBuffer();
}

/** Готовая иконка new_logo1.png — синий фон на весь квадрат, без белых углов. */
async function createDesignedAppIcon(sourcePath, size, outPath, variant = "any") {
  const blue = await sampleBrandBlue(sourcePath);
  const flattened = await flattenDesignedIcon(sourcePath, size, blue);

  if (variant === "maskable") {
    const inset = Math.round(size * 0.08);
    const inner = size - inset * 2;
    const innerLogo = await sharp(flattened)
      .resize(inner, inner, { fit: "fill" })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 3,
        background: blue,
      },
    })
      .composite([{ input: innerLogo, gravity: "centre" }])
      .png()
      .toFile(outPath);
    return;
  }

  await sharp(flattened).png().toFile(outPath);
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
