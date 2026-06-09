const EXT_TO_MIME = {
  html:'text/html',htm:'text/html',css:'text/css',js:'text/javascript',
  mjs:'text/javascript',ts:'text/typescript',jsx:'text/javascript',tsx:'text/javascript',
  json:'application/json',xml:'application/xml',svg:'image/svg+xml',
  txt:'text/plain',md:'text/markdown',csv:'text/csv',tsv:'text/tab-separated-values',
  pdf:'application/pdf',zip:'application/zip',gz:'application/gzip',
  tar:'application/x-tar','7z':'application/x-7z-compressed',
  rar:'application/vnd.rar',bz2:'application/x-bzip2',xz:'application/x-xz',
  png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',
  webp:'image/webp',avif:'image/avif',ico:'image/x-icon',bmp:'image/bmp',
  tiff:'image/tiff',tif:'image/tiff',heic:'image/heic',heif:'image/heif',
  mp3:'audio/mpeg',ogg:'audio/ogg',wav:'audio/wav',flac:'audio/flac',
  aac:'audio/aac',m4a:'audio/mp4',opus:'audio/opus',weba:'audio/webm',
  mp4:'video/mp4',webm:'video/webm',ogv:'video/ogg',avi:'video/x-msvideo',
  mov:'video/quicktime',mkv:'video/x-matroska',flv:'video/x-flv',
  woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',
  eot:'application/vnd.ms-fontobject',
  doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt:'application/vnd.ms-powerpoint',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odt:'application/vnd.oasis.opendocument.text',ods:'application/vnd.oasis.opendocument.spreadsheet',
  sh:'application/x-sh',py:'text/x-python',rb:'text/x-ruby',php:'text/x-php',
  java:'text/x-java-source',c:'text/x-csrc',cpp:'text/x-c++src',h:'text/x-chdr',
  go:'text/x-go',rs:'text/x-rustsrc',swift:'text/x-swift',kt:'text/x-kotlin',
  wasm:'application/wasm',bin:'application/octet-stream',exe:'application/octet-stream',
  dll:'application/octet-stream',so:'application/octet-stream',
  apk:'application/vnd.android.package-archive',ipa:'application/octet-stream',
  rtf:'application/rtf',ics:'text/calendar',vcf:'text/vcard',
  sql:'application/sql',db:'application/x-sqlite3',sqlite:'application/x-sqlite3',
  yaml:'text/yaml',yml:'text/yaml',toml:'application/toml',ini:'text/plain',
  env:'text/plain',log:'text/plain',
};

// Build reverse map: mime → [ext, ...]
const MIME_TO_EXT = {};
for (const [ext, mime] of Object.entries(EXT_TO_MIME)) {
  MIME_TO_EXT[mime] = MIME_TO_EXT[mime] ?? [];
  MIME_TO_EXT[mime].push(ext);
}

export default {
  tag: 'mime',
  instruction: `MIME TYPE SKILL: To look up a MIME type by file extension or find extensions by MIME type, call <|tool_call>call:mime{input:<|"|>value<|"|>}<tool_call|>.

Examples:
- "What's the MIME type for .mp4?" → <|tool_call>call:mime{input:<|"|>.mp4<|"|>}<tool_call|>
- "What extension does image/webp use?" → <|tool_call>call:mime{input:<|"|>image/webp<|"|>}<tool_call|>`,
  call(content) {
    content = content.trim().toLowerCase().replace(/^\./, '');
    // If it contains '/', treat as MIME type lookup
    if (content.includes('/')) {
      const exts = MIME_TO_EXT[content];
      if (!exts) return `Unknown MIME type: "${content}"`;
      return `${content} → .${exts.join(', .')}`;
    }
    // Otherwise extension → MIME
    const mime = EXT_TO_MIME[content];
    if (!mime) return `Unknown extension ".${content}"`;
    return `.${content} → ${mime}`;
  },
  async handle() {},
};
