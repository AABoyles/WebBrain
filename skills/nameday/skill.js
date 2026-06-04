// European name days (primarily Catholic/Orthodox calendar, Jan 1 = 1/1, etc.)
// Format: name → "Month Day" (most common European observance)
const NAME_DAYS = {
  ADAM:'12/24',ADELE:'1/24',ADOLPH:'9/27',AGNES:'1/21',ALBERT:'11/15',
  ALEXANDER:'3/18',ALEXIS:'3/17',ALICE:'6/15',ALICIA:'6/15',AMANDA:'12/9',
  AMBER:'12/9',AMELIA:'7/10',AMY:'6/9',ANDREA:'11/30',ANDREW:'11/30',
  ANGEL:'10/2',ANGELA:'1/27',ANNA:'7/26',ANNE:'7/26',ANTHONY:'1/17',
  APRIL:'6/9',ARTHUR:'3/9',AUGUST:'8/28',AURORA:'6/15',AUSTIN:'8/28',
  BARBARA:'12/4',BEATRICE:'7/29',BENEDICT:'7/11',BENJAMIN:'3/31',
  BERNARD:'8/20',BIANCA:'3/2',BLAKE:'11/13',BORIS:'5/2',BRENDA:'11/29',
  BRIAN:'11/29',BRIDGET:'2/1',BROOKE:'12/12',BRUNO:'10/6',CALEB:'10/19',
  CARMEN:'7/16',CAROLYN:'11/4',CATHERINE:'11/25',CECILIA:'11/22',
  CHARLES:'11/4',CHARLOTTE:'11/4',CHRISTIAN:'11/15',CHRISTINA:'7/24',
  CHRISTOPHER:'7/25',CLAIRE:'8/11',CLARA:'8/11',CLAUDIA:'8/7',
  CLEMENT:'11/23',CONSTANCE:'2/18',DAVID:'3/1',DIANA:'6/24',DOMINIC:'8/8',
  DONALD:'7/15',DOROTHY:'2/6',EDGAR:'11/4',ELEANOR:'8/18',ELENA:'8/18',
  ELIAS:'7/20',ELIJAH:'7/20',ELIZABETH:'11/5',ELLEN:'8/18',EMMA:'4/19',
  ERIC:'5/18',ETHAN:'1/26',EUGENE:'6/13',EVAN:'12/25',EVE:'12/24',
  EVELYN:'9/2',FAITH:'8/1',FELICIA:'2/14',FELIX:'5/30',FERDINAND:'5/30',
  FLORA:'12/5',FLORENCE:'11/1',FRANCES:'3/9',FRANCIS:'10/4',FRANK:'10/4',
  FREDRICK:'11/18',GABRIEL:'9/29',GEORGE:'4/23',GERALD:'10/13',GRACE:'7/2',
  GRAHAM:'10/22',GREGORY:'9/3',HANNAH:'7/26',HAROLD:'11/13',HELEN:'8/18',
  HENRY:'7/13',HOLLY:'12/4',HOPE:'8/1',HOWARD:'11/3',HUGO:'4/1',
  INGRID:'7/2',IRENE:'4/5',IRVING:'11/3',ISAAC:'9/20',ISABEL:'11/5',
  JACOB:'7/25',JAMES:'7/25',JANE:'5/12',JANET:'5/12',JASMINE:'1/26',
  JASON:'7/12',JEAN:'8/27',JESSICA:'6/16',JOHN:'6/24',JONATHAN:'3/22',
  JOSEPH:'3/19',JUDITH:'6/5',JULIA:'4/8',JULIAN:'1/9',JUSTIN:'6/1',
  KAREN:'11/7',KATE:'11/25',KATHERINE:'11/25',LAURA:'10/19',LAUREN:'8/10',
  LEONARD:'11/6',LEWIS:'8/25',LILY:'6/27',LINDA:'3/9',LISA:'6/13',
  LOUIS:'8/25',LOUISE:'8/25',LUCY:'12/13',LUKE:'10/18',LYNN:'3/22',
  MARGARET:'11/16',MARIA:'9/12',MARK:'4/25',MARTIN:'11/11',MARY:'8/22',
  MATTHEW:'9/21',MELANIE:'1/5',MELISSA:'2/13',MICHAEL:'9/29',MICHELLE:'9/29',
  MIRANDA:'1/17',MONIKA:'5/4',MONICA:'8/27',NATHANIEL:'8/24',NICHOLAS:'12/6',
  NICOLA:'9/10',NINA:'1/14',OLIVER:'7/11',OLIVIA:'6/5',OSCAR:'2/3',
  PAMELA:'2/21',PATRICIA:'8/25',PATRICK:'3/17',PAUL:'6/29',PETER:'6/29',
  PHILIP:'5/3',RACHEL:'9/23',RAYMOND:'1/7',REBECCA:'8/26',RICHARD:'4/3',
  ROBERT:'4/29',ROGER:'1/4',ROSA:'8/23',ROSE:'8/23',RUTH:'6/3',
  SAMUEL:'8/20',SARA:'7/13',SARAH:'7/13',SEBASTIAN:'1/20',SIMON:'10/28',
  SOPHIA:'9/30',STANLEY:'11/11',STEPHEN:'12/26',STEPHANIE:'12/26',
  SUSAN:'8/11',SYLVIA:'11/5',SYLVESTER:'12/31',THOMAS:'7/3',TIMOTHY:'1/26',
  TOBIAS:'9/13',TRACEY:'7/5',URSULA:'10/21',VALENTINE:'2/14',VERA:'9/1',
  VERONICA:'7/12',VICTOR:'7/28',VICTORIA:'3/17',VIOLET:'1/3',VIRGINIA:'1/7',
  WALTER:'4/9',WENDY:'3/22',WILL:'4/28',WILLIAM:'4/28',YVES:'5/19',YVONNE:'1/1',
  ZACHARY:'11/5',ZOE:'5/2',
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default {
  tag: 'nameday',
  instruction: `NAME DAY SKILL: To find the European feast day (name day) for a first name, emit <nameday>name</nameday>.

Examples:
- "Name day for Patrick" → <nameday>Patrick</nameday>
- "When is St. Nicholas Day?" → <nameday>Nicholas</nameday>`,
  call(content) {
    const name = content.trim().toUpperCase().replace(/[^A-Z]/g,'');
    const date = NAME_DAYS[name];
    if (!date) return `Name day for "${content}" not found in the table. Coverage is for common European names.`;
    const [m, d] = date.split('/').map(Number);
    return `${content}: ${MONTHS[m-1]} ${d}`;
  },
  async handle() {},
};
