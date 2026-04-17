import path from 'node:path';
import { Font } from '@react-pdf/renderer';

const FONT_PATH = path.resolve(process.cwd(), 'public/fonts/NunitoSans.ttf');

Font.register({
  family: 'Nunito Sans',
  fonts: [
    { src: FONT_PATH, fontWeight: 400 },
    { src: FONT_PATH, fontWeight: 600 },
    { src: FONT_PATH, fontWeight: 700 },
  ],
});

Font.registerHyphenationCallback((word) => [word]);
