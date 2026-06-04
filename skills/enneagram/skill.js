const TYPES = [
  null,
  {name:'The Reformer',    fear:'Being corrupt or defective',   desire:'To be good and have integrity',  wings:[9,2]},
  {name:'The Helper',      fear:'Being unwanted or unworthy of love',desire:'To feel loved',             wings:[1,3]},
  {name:'The Achiever',    fear:'Being worthless',              desire:'To feel valuable and worthwhile', wings:[2,4]},
  {name:'The Individualist',fear:'Having no identity or significance',desire:'To find oneself',          wings:[3,5]},
  {name:'The Investigator',fear:'Being useless, helpless, or incapable',desire:'To be capable and competent',wings:[4,6]},
  {name:'The Loyalist',    fear:'Being without support or guidance',desire:'To have security and support',wings:[5,7]},
  {name:'The Enthusiast',  fear:'Being deprived or in pain',    desire:'To be satisfied and content',    wings:[6,8]},
  {name:'The Challenger',  fear:'Being controlled by others',   desire:'To protect oneself',             wings:[7,9]},
  {name:'The Peacemaker',  fear:'Loss and separation',          desire:'To have inner stability and peace',wings:[8,1]},
];

export default {
  tag: 'enneagram',
  instruction: `ENNEAGRAM SKILL: To look up an Enneagram personality type, emit <enneagram>number</enneagram>.

Examples:
- "Tell me about Enneagram type 4" → <enneagram>4</enneagram>
- "What is type 9?" → <enneagram>9</enneagram>`,
  call(content) {
    const n = parseInt(content.trim());
    const t = TYPES[n];
    if (!t) return 'Enneagram types are 1–9.';
    return [`Type ${n}: ${t.name}`,`Core fear:   ${t.fear}`,`Core desire: ${t.desire}`,`Wings:       Type ${t.wings[0]}w or Type ${t.wings[1]}w`].join('\n');
  },
  async handle() {},
};
