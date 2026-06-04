// ── Conversion utilities ──────────────────────────────────────────────────────

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
  if (max === min) return [0, 0, Math.round(l * 100)];
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

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const v = max;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
}

function rgbToCmyk(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return [0, 0, 0, 100];
  return [
    Math.round((1 - r - k) / (1 - k) * 100),
    Math.round((1 - g - k) / (1 - k) * 100),
    Math.round((1 - b - k) / (1 - k) * 100),
    Math.round(k * 100),
  ];
}

function wcagContrast(r1, g1, b1, r2, g2, b2) {
  const lum = (r, g, b) => {
    const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const l1 = lum(r1, g1, b1), l2 = lum(r2, g2, b2);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return ((hi + 0.05) / (lo + 0.05)).toFixed(2);
}

// Clamp to 0-255
const clamp = v => Math.max(0, Math.min(255, Math.round(v)));

function darken(r, g, b, pct) {
  const f = 1 - pct / 100;
  return [clamp(r * f), clamp(g * f), clamp(b * f)];
}
function lighten(r, g, b, pct) {
  const f = pct / 100;
  return [clamp(r + (255 - r) * f), clamp(g + (255 - g) * f), clamp(b + (255 - b) * f)];
}
function mix(r1, g1, b1, r2, g2, b2, weight = 50) {
  const w = weight / 100;
  return [clamp(r1 * (1 - w) + r2 * w), clamp(g1 * (1 - w) + g2 * w), clamp(b1 * (1 - w) + b2 * w)];
}

function rgbToHex(r, g, b) { return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join(''); }

function fullInfo(r, g, b) {
  const hex  = rgbToHex(r, g, b);
  const [h, sl, l] = rgbToHsl(r, g, b);
  const [, sv, v]  = rgbToHsv(r, g, b);
  const [c, m, y, k] = rgbToCmyk(r, g, b);
  return [
    `Hex:  ${hex}`,
    `RGB:  rgb(${r}, ${g}, ${b})`,
    `HSL:  hsl(${h}, ${sl}%, ${l}%)`,
    `HSV:  hsv(${h}, ${sv}%, ${v}%)`,
    `CMYK: cmyk(${c}%, ${m}%, ${y}%, ${k}%)`,
  ].join('\n');
}

// Parse any supported color format → [r,g,b]
function parseColor(input) {
  input = input.trim();
  if (/^#[0-9a-f]{3,6}$/i.test(input)) return hexToRgb(input);
  if (/^rgb/i.test(input)) {
    const nums = input.match(/\d+/g);
    if (nums?.length >= 3) return [+nums[0], +nums[1], +nums[2]];
  }
  if (/^hsl/i.test(input)) {
    const nums = input.match(/[\d.]+/g);
    if (nums?.length >= 3) return hslToRgb(+nums[0], +nums[1], +nums[2]);
  }
  if (/^hsv/i.test(input)) {
    const nums = input.match(/[\d.]+/g);
    if (nums?.length >= 3) {
      // HSV → HSL → RGB
      const [h, s, v] = [+nums[0], +nums[1] / 100, +nums[2] / 100];
      const l = v * (1 - s / 2);
      const sl = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
      return hslToRgb(h, sl * 100, l * 100);
    }
  }
  if (/^cmyk/i.test(input)) {
    const nums = input.match(/[\d.]+/g);
    if (nums?.length >= 4) {
      const [c, m, y, k] = nums.map(n => +n / 100);
      return [clamp(255 * (1 - c) * (1 - k)), clamp(255 * (1 - m) * (1 - k)), clamp(255 * (1 - y) * (1 - k))];
    }
  }
  return null;
}

export default {
  tag: 'color',
  instruction: `COLOR SKILL: Convert colors or perform color operations. Emit <color>value</color>.
Supports: #rrggbb, rgb(), hsl(), hsv(), cmyk().
Operations: darken(color, pct), lighten(color, pct), mix(color1, color2[, pct]), contrast(color1, color2).

Examples:
- "Convert #ff6600 to all formats" → <color>#ff6600</color>
- "Darken #ff6600 by 20%" → <color>darken(#ff6600, 20)</color>
- "Mix red and blue 50/50" → <color>mix(#ff0000, #0000ff)</color>
- "WCAG contrast of black on white" → <color>contrast(#000000, #ffffff)</color>`,
  call(input) {
    input = input.trim();
    try {
      // darken(color, pct)
      const darkenMatch = input.match(/^darken\((.+?),\s*(\d+)\)$/i);
      if (darkenMatch) {
        const rgb = parseColor(darkenMatch[1]);
        if (!rgb) return 'Invalid color in darken().';
        return fullInfo(...darken(...rgb, +darkenMatch[2]));
      }
      // lighten(color, pct)
      const lightenMatch = input.match(/^lighten\((.+?),\s*(\d+)\)$/i);
      if (lightenMatch) {
        const rgb = parseColor(lightenMatch[1]);
        if (!rgb) return 'Invalid color in lighten().';
        return fullInfo(...lighten(...rgb, +lightenMatch[2]));
      }
      // mix(color1, color2[, weight])
      const mixMatch = input.match(/^mix\((.+?),\s*(.+?)(?:,\s*(\d+))?\)$/i);
      if (mixMatch) {
        const rgb1 = parseColor(mixMatch[1]);
        const rgb2 = parseColor(mixMatch[2]);
        if (!rgb1 || !rgb2) return 'Invalid color(s) in mix().';
        const weight = mixMatch[3] ? +mixMatch[3] : 50;
        return fullInfo(...mix(...rgb1, ...rgb2, weight));
      }
      // contrast(color1, color2)
      const contrastMatch = input.match(/^contrast\((.+?),\s*(.+?)\)$/i);
      if (contrastMatch) {
        const rgb1 = parseColor(contrastMatch[1]);
        const rgb2 = parseColor(contrastMatch[2]);
        if (!rgb1 || !rgb2) return 'Invalid color(s) in contrast().';
        const ratio = wcagContrast(...rgb1, ...rgb2);
        const level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA (large text)' : 'Fails WCAG';
        return `Contrast ratio: ${ratio}:1 → WCAG ${level}`;
      }
      // Plain color value
      const rgb = parseColor(input);
      if (rgb) return fullInfo(...rgb);
      return 'Input must be a color (#rrggbb, rgb(), hsl(), hsv(), cmyk()) or operation (darken, lighten, mix, contrast).';
    } catch (e) {
      return `Color error: ${e.message}`;
    }
  },
  async handle() {},
};
