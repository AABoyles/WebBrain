// Classic elf name generator: first pet name + childhood street name
// Since we don't have that info, generate from the provided name using parts tables
const FIRST_PARTS = ['Tinsel','Sparkle','Jingle','Merry','Holly','Snowflake','Frosty','Glitter','Twinkle','Jolly','Candy','Peppermint','Sugarplum','Mistletoe','Blizzard','Cocoa','Pudding','Eggnog','Nutmeg','Cinnamon'];
const LAST_PARTS  = ['Thistlewick','Merrypants','Snowshoe','Jinglebell','Twinkletoes','Sugarcoat','Frostwhisker','Peppercorn','Candycane','Hollyberry','Gingerbread','Snowflake','Mittens','Icecap','Chimneyflue','Sleighbell','Elfhat','Tinseltoe','Cocoabean','Nutcracker'];

function nameHash(name) {
  let h = 5381;
  for (const c of name.toUpperCase()) h = (h * 33 ^ c.charCodeAt(0)) >>> 0;
  return h;
}

export default {
  tag: 'elfname',
  instruction: `ELF NAME GENERATOR SKILL: To generate a whimsical elf name from a real name, call <|tool_call>call:elfname{input:<|"|>your name<|"|>}<tool_call|>.

Examples:
- "What's my elf name?" → <|tool_call>call:elfname{input:<|"|>Tony<|"|>}<tool_call|>
- "Generate elf name for Sarah" → <|tool_call>call:elfname{input:<|"|>Sarah<|"|>}<tool_call|>`,
  call(content) {
    const name  = content.trim();
    const hash  = nameHash(name);
    const first = FIRST_PARTS[hash % FIRST_PARTS.length];
    const last  = LAST_PARTS[(hash >> 5) % LAST_PARTS.length];
    return `${name}'s elf name: ${first} ${last}`;
  },
  async handle() {},
};
