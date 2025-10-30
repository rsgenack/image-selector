import { promises as fs } from 'node:fs';
import path from 'node:path';

const IMAGE_EXTENSIONS = new Set([
  '.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.avif', '.tif', '.tiff', '.ico'
]);

async function generateManifest() {
  const projectRoot = process.cwd();
  const imagesDir = path.join(projectRoot, 'public', 'renamed_images');
  const manifestPath = path.join(imagesDir, 'manifest.json');

  try {
    const entries = await fs.readdir(imagesDir, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const json = JSON.stringify({ files }, null, 2);
    await fs.writeFile(manifestPath, json, 'utf8');
    console.log(`Generated manifest with ${files.length} files at ${path.relative(projectRoot, manifestPath)}`);
  } catch (err) {
    console.error('Failed to generate image manifest:', err);
    process.exit(1);
  }
}

generateManifest();


