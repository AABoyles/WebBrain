function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    default: h = ((r - g) / d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r, g, b;
  if      (h < 60)  [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else              [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function format(r, g, b) {
  const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  const [h, s, l] = rgbToHsl(r, g, b);
  return `Hex: ${hex}\nRGB: rgb(${r}, ${g}, ${b})\nHSL: hsl(${h}, ${s}%, ${l}%)`;
}

export default {
  tag: 'color',
  instruction: `COLOR CONVERTER SKILL: To convert a color between hex, RGB, and HSL formats, emit <color>value</color>.

Examples:
- "Convert #ff6600 to RGB" → <color>#ff6600</color>
- "What hex is rgb(255,102,0)?" → <color>rgb(255,102,0)</color>
- "Convert hsl(24,100%,50%) to hex" → <color>hsl(24,100%,50%)</color>`,
  call(input) {
    input = input.trim();
    try {
      if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(input)) {
        return format(...hexToRgb(input));
      }
      if (/^rgb/i.test(input)) {
        const nums = input.match(/\d+/g);
        if (!nums || nums.length < 3) return 'Invalid rgb() value.';
        return format(+nums[0], +nums[1], +nums[2]);
      }
      if (/^hsl/i.test(input)) {
        const nums = input.match(/[\d.]+/g);
        if (!nums || nums.length < 3) return 'Invalid hsl() value.';
        const [r, g, b] = hslToRgb(+nums[0], +nums[1], +nums[2]);
        return format(r, g, b);
      }
      return 'Input must be #rrggbb, rgb(r,g,b), or hsl(h,s%,l%).';
    } catch (e) {
      return `Color error: ${e.message}`;
    }
  },
  async handle() {},
};
