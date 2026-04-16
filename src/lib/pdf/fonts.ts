import { Font } from '@react-pdf/renderer';

const FONT_FAMILY = 'Nunito Sans';
const FONT_URL = '/fonts/NunitoSans.ttf';

let registered = false;

export function registerPdfFonts(): void {
  if (registered) return;
  registered = true;
  if (typeof window === 'undefined') {
    return;
  }
  Font.register({
    family: FONT_FAMILY,
    fonts: [
      { src: FONT_URL, fontWeight: 400 },
      { src: FONT_URL, fontWeight: 600 },
      { src: FONT_URL, fontWeight: 700 },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);
}

export const PDF_FONT_FAMILY = FONT_FAMILY;
