// Add or edit questions here. Keep one correct answer and a useful explanation.
export const questions = Object.freeze([
  {
    category: 'Clear communication',
    prompt: 'What makes a landing page easier to act on?',
    answers: ['Several competing messages', 'One clear call to action', 'Hiding contact information'],
    correct: 1,
    explanation: 'A clear call to action helps visitors understand the next useful step.',
  },
  {
    category: 'Connected experiences',
    prompt: 'What can a QR code connect?',
    answers: ['A printed piece and a digital experience', 'Only two desktop computers', 'Only social media profiles'],
    correct: 0,
    explanation: 'A QR code can take someone from packaging, signage, or print directly to a digital experience.',
  },
  {
    category: 'Useful measurement',
    prompt: 'Which result helps measure a campaign’s success?',
    answers: ['The number of fonts used', 'The length of an animation', 'Completed actions tied to the campaign goal'],
    correct: 2,
    explanation: 'Measure an action that connects to the goal, such as a signup, inquiry, or purchase.',
  },
  {
    category: 'Inclusive interaction',
    prompt: 'Which controls should a public mini-game support?',
    answers: ['Touch only', 'Keyboard and touch', 'A controller that requires an extra download'],
    correct: 1,
    explanation: 'Keyboard and touch controls let people join in from a desktop, tablet, or phone.',
  },
  {
    category: 'Purpose before features',
    prompt: 'What is a useful first step for a branded game?',
    answers: ['Define the audience and campaign goal', 'Build as many levels as possible', 'Require an account before anyone can play'],
    correct: 0,
    explanation: 'Knowing who the game is for and what it should achieve makes the design easier to evaluate.',
  },
]);

const designRound = Object.freeze([
  { category: 'A clear next step', prompt: 'Someone finishes a demo. What helps them continue?', answers: ['A useful next step related to what they tried', 'An unrelated pop-up covering the screen', 'Removing every navigation link'], correct: 0, explanation: 'A relevant next step connects the experience to a real goal without interrupting the visitor.' },
  { category: 'Mobile interaction', prompt: 'What makes a touch control easier to use?', answers: ['Tiny targets packed tightly together', 'Roomy targets with clear feedback', 'Controls that only appear on hover'], correct: 1, explanation: 'Generous touch targets, spacing, and visible feedback help people act accurately on small screens.' },
  { category: 'Readable by design', prompt: 'A photo sits behind important text. What helps readability?', answers: ['Making every letter a different color', 'Adding more detail behind the words', 'Giving the text enough contrast and a quiet background'], correct: 2, explanation: 'Strong contrast and a calm area behind text keep the message readable across screen sizes.' },
  { category: 'Learning from behavior', prompt: 'How can a team find out whether a new design is easier to use?', answers: ['Watch people attempt a real task', 'Count how many effects were added', 'Assume a larger file means a better experience'], correct: 0, explanation: 'Observing real tasks reveals confusion, missed controls, and unexpected behavior that appearance alone cannot show.' },
  { category: 'Helpful feedback', prompt: 'A player makes a mistake. What is the most useful response?', answers: ['Hide the result', 'Explain what happened and give a clear way to try again', 'Force a new account signup'], correct: 1, explanation: 'Specific feedback and an easy retry let people learn without getting stuck.' },
]);
const trustRound = Object.freeze([
  { category: 'Respecting attention', prompt: 'Why offer a pause control in a game?', answers: ['To make the score harder to read', 'To require more clicks before every move', 'To let people stop and return when they are ready'], correct: 2, explanation: 'A pause control gives players control over their attention and makes interruptions easier to handle.' },
  { category: 'A resilient experience', prompt: 'A phone rotates during play. What should happen?', answers: ['The layout adapts and keeps the current run', 'The score silently resets', 'The controls disappear'], correct: 0, explanation: 'Adapting the layout while preserving progress makes the experience work in real use, not just in one screenshot.' },
  { category: 'Privacy by design', prompt: 'A simple demo does not need personal information. What is a sensible choice?', answers: ['Collect a phone number before the first screen', 'Let people try it without a form', 'Require access to their contacts'], correct: 1, explanation: 'Ask only for information the experience needs. A playable demonstration can often work without collecting personal details.' },
  { category: 'Clear expectations', prompt: 'What should an interactive prototype make clear?', answers: ['That every pictured feature is already available, even if it is not', 'Only the visual style', 'What visitors can actually try and what the result means'], correct: 2, explanation: 'Clear boundaries help people evaluate the working experience and trust what they see.' },
  { category: 'A useful finish', prompt: 'What makes a short educational game more valuable?', answers: ['An explanation players can use after the game', 'A score with no context', 'More required screens before the results'], correct: 0, explanation: 'A useful takeaway turns a correct or incorrect answer into knowledge that lasts beyond the session.' },
]);

// Five questions keep each round approachable; replay moves through three distinct sets.
const rounds = Object.freeze([questions, designRound, trustRound]);
export function questionsForRound(round = 0) {
  const index = Number.isInteger(round) && round >= 0 ? round % rounds.length : 0;
  return rounds[index];
}
