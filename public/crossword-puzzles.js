// Original, human-edited five-by-five minis. # marks a blocked square.
// Clue coordinates are zero-based; the engine derives ordinary crossword numbers.
export const puzzles = [
  {
    id: 'launch-day', version: 1, title: 'Kickoff notes',
    description: 'A few meeting notes, a good pen and a little breathing room.',
    rows: ['##SAW', '#SAGA', 'NOTES', 'AMID#', 'PEN##'],
    clues: {
      across: {
        '0,2': 'Spotted, in the past tense.',
        '1,1': 'A long, eventful story.',
        '2,0': 'Things jotted during a kickoff meeting.',
        '3,0': 'In the middle of.',
        '4,0': 'Desk tool with an ink refill.',
      },
      down: {
        '0,2': 'Smooth, glossy fabric used for ribbons.',
        '0,3': 'Like cheddar that has matured.',
        '0,4': 'Past-tense form of "is".',
        '1,1': 'An unspecified quantity, as in "___ fresh ideas".',
        '2,0': 'A short rest with your eyes closed.',
      },
    },
  },
  {
    id: 'good-company', version: 1, title: 'Good company',
    description: 'Pull up a chair for teamwork and a few everyday discoveries.',
    rows: ['##TAB', '#MENU', 'SEATS', 'ARMS#', 'YES##'],
    clues: {
      across: {
        '0,2': 'A browser page with its own little label.',
        '1,1': 'List of navigation choices on a website.',
        '2,0': 'Places around a meeting table.',
        '3,0': 'Chair parts that support your elbows.',
        '4,0': 'An enthusiastic go-ahead.',
      },
      down: {
        '0,2': 'Groups of people working toward a shared goal.',
        '0,3': 'Tiny visitors to a picnic.',
        '0,4': 'Shared ride that makes several stops.',
        '1,1': 'Nothing more than, as in "a ___ five minutes".',
        '2,0': 'Speak your idea aloud.',
      },
    },
  },
  {
    id: 'web-work', version: 1, title: 'Web work',
    description: 'Pages, useful facts and a few things from beyond the desk.',
    rows: ['##WIG', '#DATA', 'PAGES', 'ATOM#', 'DEN##'],
    clues: {
      across: {
        '0,2': 'Hairpiece in a costume box.',
        '1,1': 'Facts and figures used to guide a decision.',
        '2,0': 'Home and About on a website, for example.',
        '3,0': 'Small unit of a chemical element.',
        '4,0': 'Cozy room for reading.',
      },
      down: {
        '0,2': 'Four-wheeled cart pulled by a handle.',
        '0,3': 'One thing on a checklist.',
        '0,4': 'Fuel at a pump, informally.',
        '1,1': 'Calendar detail on a launch invitation.',
        '2,0': 'Stack of paper for jotting ideas.',
      },
    },
  },
];
