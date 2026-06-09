const NOUNS = {
  ants:'a colony',apes:'a shrewdness',badgers:'a cete',bats:'a colony / cauldron',
  bears:'a sleuth / sloth',bees:'a swarm',buffalo:'a herd / gang',butterflies:'a kaleidoscope',
  cats:'a clowder / pounce',cattle:'a herd / drove',crows:'a murder',deer:'a herd',
  dolphins:'a pod',doves:'a dole',ducks:'a raft / paddling',eagles:'a convocation',
  elephants:'a herd / parade',elk:'a gang / herd',ferrets:'a business',fish:'a school / shoal',
  flamingos:'a flamboyance',foxes:'a skulk / earth',frogs:'an army',giraffes:'a tower',
  gnats:'a cloud / horde',gorillas:'a band / troop',hawks:'a cast / kettle',
  hippos:'a bloat',horses:'a herd',hummingbirds:'a charm',hyenas:'a cackle',
  jellyfish:'a smack / bloom',kangaroos:'a mob / troop',kittens:'a kindle',
  leopards:'a leap',lions:'a pride',lizards:'a lounge',locusts:'a plague / swarm',
  magpies:'a parliament',meerkats:'a mob / gang',mice:'a mischief',monkeys:'a troop',
  moose:'a herd',mosquitoes:'a swarm',narwhals:'a blessing',otters:'a romp',
  owls:'a parliament',oxen:'a yoke / drove',oysters:'a bed',parrots:'a company / pandemonium',
  peacocks:'a muster / ostentation',penguins:'a colony / waddle',pigs:'a sounder',
  pigeons:'a flock / kit',porcupines:'a prickle',pups:'a litter',rabbits:'a colony / herd',
  ravens:'an unkindness / conspiracy',rhinos:'a crash',salmon:'a run',seagulls:'a colony / flock',
  sharks:'a shiver',sheep:'a flock',skunks:'a surfeit',snails:'a rout / walk',
  snakes:'a nest / den',spiders:'a cluster / clutter',squirrels:'a dray / scurry',
  starlings:'a murmuration',stingrays:'a fever',swans:'a bevy / wedge',tigers:'an ambush / streak',
  toads:'a knot / lump',turtles:'a bale / nest',vultures:'a committee / venue',
  walruses:'a herd',wasps:'a colony',whales:'a pod / gam',wolves:'a pack',
  wombats:'a mob / warren',woodpeckers:'a descent',zebras:'a zeal / dazzle',
};

export default {
  tag: 'collective',
  instruction: `COLLECTIVE NOUNS SKILL: To find the collective noun for a group of animals, call <|tool_call>call:collective{input:<|"|>animal<|"|>}<tool_call|>.

Examples:
- "Collective noun for crows" → <|tool_call>call:collective{input:<|"|>crows<|"|>}<tool_call|>
- "What's a group of flamingos called?" → <|tool_call>call:collective{input:<|"|>flamingos<|"|>}<tool_call|>`,
  call(content) {
    const key = content.trim().toLowerCase().replace(/^a?\s+group\s+of\s+/,'');
    const noun = NOUNS[key] ?? NOUNS[key.replace(/s$/, '')] ?? NOUNS[key + 's'];
    if (!noun) return `No collective noun found for "${content}".`;
    return `A group of ${key}: ${noun}`;
  },
  async handle() {},
};
