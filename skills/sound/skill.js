const SOUNDS = {
  bear:'growl / woof',bee:'buzz / hum',bird:'chirp / tweet / sing',
  cat:'meow / purr / hiss',cattle:'moo / bellow',chicken:'cluck / cackle',
  chimpanzee:'scream / hoot',cow:'moo',crocodile:'hiss / growl',
  crow:'caw',deer:'bleat / bellow',dog:'bark / howl / whine',
  dolphin:'click / whistle',donkey:'bray / hee-haw',duck:'quack',
  eagle:'scream / screech',elephant:'trumpet / rumble',fish:'(no vocal sound)',
  fox:'scream / gekkering / bark',frog:'croak / ribbit',giraffe:'(largely silent)',
  goat:'bleat / maa',goose:'honk / hiss',gorilla:'roar / grunt / hoot',
  hamster:'squeak',hawk:'screech / kee',hippo:'grunt / bellow',
  horse:'neigh / whinny / nicker',hyena:'laugh / whoop / giggle',
  kangaroo:'chortle / cluck',koala:'bellow / scream',lion:'roar / grunt',
  monkey:'chatter / scream',moose:'grunt / bellow',mosquito:'buzz',
  mouse:'squeak',owl:'hoot / screech',parrot:'squawk / mimic',
  peacock:'meow (yes, really!) / scream',penguin:'bray / bark',
  pig:'oink / grunt / squeal',platypus:'(largely silent; low growl)',
  rabbit:'squeak / scream',raven:'croak / gurgle',rhinoceros:'grunt / bellow',
  seal:'bark / growl',shark:'(largely silent)',sheep:'baa / bleat',
  snake:'hiss',squirrel:'chatter / bark',swan:'hiss / bugle',
  tiger:'roar / chuff / moan',toad:'croak',turkey:'gobble',
  vulture:'hiss / grunt',whale:'song / clicks',wolf:'howl / growl / bark',
  wombat:'hiss / screech',zebra:'bray / bark',
};

export default {
  tag: 'sound',
  instruction: `ANIMAL SOUNDS SKILL: To find what sound an animal makes, emit <sound>animal</sound>.

Examples:
- "What sound does a fox make?" → <sound>fox</sound>
- "Sound of a koala" → <sound>koala</sound>`,
  call(content) {
    const key = content.trim().toLowerCase();
    const s   = SOUNDS[key] ?? SOUNDS[key.replace(/s$/, '')];
    if (!s) return `No sound entry for "${content}".`;
    return `${key}: ${s}`;
  },
  async handle() {},
};
