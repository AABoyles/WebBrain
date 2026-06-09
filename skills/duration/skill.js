export default {
  tag: 'duration',
  instruction: `ISO 8601 DURATION SKILL: To decode an ISO 8601 duration string, call <|tool_call>call:duration{input:<|"|>P...<|"|>}<tool_call|>.

Examples:
- "What is P1Y2M3DT4H5M6S?" → <|tool_call>call:duration{input:<|"|>P1Y2M3DT4H5M6S<|"|>}<tool_call|>
- "Decode PT30M" → <|tool_call>call:duration{input:<|"|>PT30M<|"|>}<tool_call|>`,
  call(content) {
    const m = content.trim().toUpperCase().match(
      /^P(?:(\d+(?:\.\d+)?)Y)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)W)?(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/
    );
    if (!m) return 'Not a valid ISO 8601 duration. Format: P[nY][nM][nW][nD][T[nH][nM][nS]]';

    const [, Y, Mo, W, D, H, Mi, S] = m;
    const parts = [];
    if (Y)  parts.push(`${Y} year${+Y !== 1 ? 's' : ''}`);
    if (Mo) parts.push(`${Mo} month${+Mo !== 1 ? 's' : ''}`);
    if (W)  parts.push(`${W} week${+W !== 1 ? 's' : ''}`);
    if (D)  parts.push(`${D} day${+D !== 1 ? 's' : ''}`);
    if (H)  parts.push(`${H} hour${+H !== 1 ? 's' : ''}`);
    if (Mi) parts.push(`${Mi} minute${+Mi !== 1 ? 's' : ''}`);
    if (S)  parts.push(`${S} second${+S !== 1 ? 's' : ''}`);

    if (!parts.length) return 'Empty duration (P with no values).';

    // Approximate total seconds (using average month/year)
    const totalSec = (+Y || 0) * 31536000 + (+Mo || 0) * 2592000 + (+W || 0) * 604800
      + (+D || 0) * 86400 + (+H || 0) * 3600 + (+Mi || 0) * 60 + (+S || 0);

    return [
      `Duration: ${content.trim().toUpperCase()}`,
      `Human:    ${parts.join(', ')}`,
      `≈ ${totalSec.toLocaleString()} seconds total`,
    ].join('\n');
  },
  async handle() {},
};
