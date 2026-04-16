import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'public/icons');
const source = path.join(root, 'icon.svg');
const maskableSource = path.join(root, 'icon-maskable.svg');

const targets = [
  { src: source, size: 192, name: 'icon-192.png' },
  { src: source, size: 512, name: 'icon-512.png' },
  { src: maskableSource, size: 512, name: 'icon-maskable-512.png' },
  { src: source, size: 180, name: 'apple-touch-icon.png' },
  { src: source, size: 32, name: 'favicon-32.png' },
];

for (const target of targets) {
  const input = await fs.readFile(target.src);
  const buffer = await sharp(input, { density: 384 })
    .resize(target.size, target.size)
    .png()
    .toBuffer();
  await fs.writeFile(path.join(root, target.name), buffer);
  console.log(`wrote ${target.name} (${buffer.byteLength} bytes)`);
}
