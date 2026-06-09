let bwipjs = null;
async function getBwip() {
  if (!bwipjs) {
    // bwip-js UMD build — sets window.bwipjs
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/bwip-js@4/dist/bwip-js-min.js';
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
    bwipjs = window.bwipjs;
  }
  return bwipjs;
}

const TYPES = {
  code128: 'code128', code39: 'code39', qr: 'qrcode', ean13: 'ean13',
  ean8: 'ean8', upca: 'upca', upce: 'upce', itf: 'interleaved2of5',
  datamatrix: 'datamatrix', pdf417: 'pdf417', aztec: 'aztec',
  codabar: 'codabar', gs1128: 'gs1-128',
};

export default {
  tag: 'barcode',
  instruction: `BARCODE SKILL: Generate a barcode image displayed in the chat. call <|tool_call>call:barcode{input:<|"|>type:value<|"|>}<tool_call|>.
Types: code128, code39, qr, ean13, ean8, upca, upce, itf, datamatrix, pdf417, aztec, codabar.

Examples:
- "QR code for a URL" → <|tool_call>call:barcode{input:<|"|>qr:https://example.com<|"|>}<tool_call|>
- "Code128 barcode for 'HELLO'" → <|tool_call>call:barcode{input:<|"|>code128:HELLO<|"|>}<tool_call|>
- "EAN-13 barcode" → <|tool_call>call:barcode{input:<|"|>ean13:5901234123457<|"|>}<tool_call|>`,
  call(content) {
    const colon = content.indexOf(':');
    if (colon < 0) return 'Format: type:value — e.g. qr:https://example.com';
    const typeName = content.slice(0, colon).trim().toLowerCase();
    const value    = content.slice(colon + 1).trim();
    const bcType   = TYPES[typeName];
    if (!bcType) return `Unknown barcode type "${typeName}". Supported: ${Object.keys(TYPES).join(', ')}`;
    if (!value) return 'Provide a value to encode.';
    return `[Rendering ${typeName.toUpperCase()} barcode for "${value.slice(0, 40)}${value.length > 40 ? '…' : ''}"]`;
  },
  async handle(content) {
    if (typeof document === 'undefined') return;
    const colon = content.indexOf(':');
    if (colon < 0) return;
    const typeName = content.slice(0, colon).trim().toLowerCase();
    const value    = content.slice(colon + 1).trim();
    const bcType   = TYPES[typeName];
    if (!bcType || !value) return;

    let lib;
    try { lib = await getBwip(); } catch (e) { console.warn('bwip-js load failed:', e); return; }

    const canvas = document.createElement('canvas');
    try {
      lib.toCanvas(canvas, {
        bcid: bcType, text: value, scale: 3, includetext: true,
        backgroundcolor: 'ffffff',
      });
    } catch (e) { console.warn('Barcode render error:', e.message); return; }

    canvas.style.cssText = 'display:block;margin:8px 0;max-width:100%;border-radius:4px;';
    const messages = document.querySelectorAll('.message.assistant');
    const last = messages[messages.length - 1];
    if (last) last.appendChild(canvas);
  },
};
