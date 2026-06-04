const BABIES = {
  bear:'cub',beaver:'kit/kitten',bison:'calf',cat:'kitten',cattle:'calf',
  cheetah:'cub',chicken:'chick',coyote:'pup/whelp',crocodile:'hatchling',
  deer:'fawn',dog:'puppy',dolphin:'calf/pup',duck:'duckling',eagle:'eaglet',
  elephant:'calf',elk:'calf',ferret:'kit',fish:'fry/fingerling',fox:'kit/cub/pup',
  frog:'tadpole/froglet',giraffe:'calf',goat:'kid',goose:'gosling',
  gorilla:'infant',guinea pig:'pup',hamster:'pup',hare:'leveret',hawk:'eyass',
  hippo:'calf',horse:'foal',kangaroo:'joey',koala:'joey',leopard:'cub',
  lion:'cub',llama:'cria',monkey:'infant',moose:'calf',mouse:'pinky/pup',
  ostrich:'chick',otter:'pup/whelp',owl:'owlet',panda:'cub',parrot:'chick',
  penguin:'chick',pig:'piglet',platypus:'puggle',porcupine:'porcupette',
  rabbit:'kitten/kit',raccoon:'kit/cub',rat:'pinky/pup',raven:'chick',
  rhinoceros:'calf',sea lion:'pup',seal:'pup/whelp',shark:'pup',
  sheep:'lamb',skunk:'kitten/kit',snake:'snakelet',spider:'spiderling',
  squirrel:'kitten/pup',swan:'cygnet',tiger:'cub',turkey:'poult',
  turtle:'hatchling',walrus:'calf/pup',whale:'calf',wolf:'pup/whelp',
  wombat:'joey',zebra:'foal/colt',
};

export default {
  tag: 'babyname',
  instruction: `BABY ANIMAL NAMES SKILL: To find what a baby animal is called, emit <babyname>animal</babyname>.

Examples:
- "What's a baby kangaroo called?" → <babyname>kangaroo</babyname>
- "Baby platypus name" → <babyname>platypus</babyname>`,
  call(content) {
    const key = content.trim().toLowerCase();
    const name = BABIES[key] ?? BABIES[key.replace(/s$/, '')];
    if (!name) return `No baby name found for "${content}".`;
    return `Baby ${key}: ${name}`;
  },
  async handle() {},
};
