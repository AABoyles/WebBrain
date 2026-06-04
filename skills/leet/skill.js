const LEET = {
  a:'4',e:'3',g:'9',i:'1',l:'1',o:'0',s:'5',t:'7',b:'8',z:'2',
  A:'4',E:'3',G:'9',I:'1',L:'1',O:'0',S:'5',T:'7',B:'8',Z:'2',
};

export default {
  tag: 'leet',
  instruction: `LEET SPEAK SKILL: To translate text to 1337 5p34k, emit <leet>text</leet>.

Example: <leet>elite hacker</leet> → 31173 h4ck3r`,
  call: text => text.replace(/[aegilostzAEGILOSTZ]/g, c => LEET[c] ?? c),
  async handle() {},
};
