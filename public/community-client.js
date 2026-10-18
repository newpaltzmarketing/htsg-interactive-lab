// Optional first-party community connection. Free play never waits for this module.
const query = new URLSearchParams(location.search);
const mode = query.get('game') || 'invaders';
const requestedChallenge = query.get('challenge') === 'current';
const productionHost = location.hostname === 'holistictechsolutionsgroup.com';
const mount = document.getElementById('community-mount');
let session;
let pendingRun;
let pendingResult;
let busy = false;
let runActive = false;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function localURL(value, fallback) {
  try {
    const url = new URL(value, location.origin);
    return url.origin === location.origin && url.protocol === location.protocol ? url.href : fallback;
  } catch { return fallback; }
}
async function request(path, body) {
  const response = await fetch(path, {
    credentials: 'same-origin', cache: 'no-store',
    headers: body === undefined ? { Accept: 'application/json' } : {
      Accept: 'application/json', 'Content-Type': 'application/json', 'X-WP-Nonce': session?.nonce || '',
    },
    method: body === undefined ? 'GET' : 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
    const error = new Error(response.status === 401 || response.status === 403 ? 'Please sign in again to enter the challenge.' : 'The community connection is unavailable. Your free game still works.');
    error.status = response.status;
    throw error;
  }
  return response.json();
}
function render({ message = '', error = false, retry = false, saved = false } = {}) {
  if (!mount) return;
  mount.replaceChildren();
  mount.hidden = runActive || (!session?.enabled && !message);
  if (mount.hidden) return;
  const status = element('p', message || 'One weekly course. Five minutes. See how far you can get.', 'community-note');
  status.setAttribute('role', error ? 'alert' : 'status');
  mount.append(status);
  if (session?.enabled && session.flags?.challenges && session.challenge) {
    const actions = element('div', '', 'community-actions');
    if (session.authenticated && session.member) {
      const button = element('button', busy ? 'Connecting…' : retry ? 'Retry score submission' : saved ? 'Try the challenge again' : 'Play the weekly challenge', 'secondary community-action');
      button.type = 'button';
      button.disabled = busy;
      button.addEventListener('click', retry ? submitResult : beginChallenge);
      actions.append(button);
    } else if (session.authenticated || session.flags.google) {
      const join = element('a', session.authenticated ? 'Join the challenge' : 'Join with Google', 'community-link');
      join.href = localURL(session.authenticated ? session.memberURL : session.signInURL, '/community/');
      actions.append(join);
    }
    const board = element('a', 'Challenge & scores', 'community-link');
    board.href = '/community/challenge/';
    actions.append(board);
    mount.append(actions, element('p', 'Casual scores are unverified. Free play needs no account.', 'community-disclosure'));
  }
}
async function beginChallenge() {
  if (busy || !session?.member || !session?.challenge) return;
  busy = true;
  render();
  try {
    // Refresh both identity and the current week before issuing a one-use run.
    session = await request('/community/session/');
    if (!session.enabled || !session.member || !session.nonce || !session.flags?.challenges || !session.challenge) throw new Error('Sign in to enter the current challenge. Free play is available below.');
    const run = await request('/wp-json/htsg-community/v1/runs', { challengeId: session.challenge.id });
    if (!/^[a-f0-9]{64}$/.test(run.runId || '') || run.rulesVersion !== '1.4.0' || !Number.isInteger(run.seed) || run.seed < 0 || run.seed > 4294967295 || run.world?.width !== 960 || run.world?.height !== 1669 || run.maxSeconds !== 300 || run.tickRate !== 120) {
      throw new Error('This challenge uses a different game edition. Refresh the page before joining.');
    }
    pendingRun = { ...run, challengeId: run.id || session.challenge.id };
    pendingResult = null;
    runActive = true;
    document.dispatchEvent(new CustomEvent('htsg:challenge-start', { detail: {
      seed: run.seed, challengeId: pendingRun.challengeId, rulesVersion: run.rulesVersion, durationSeconds: run.maxSeconds,
    } }));
    render();
  } catch (error) {
    pendingRun = null;
    runActive = false;
    busy = false;
    render({ message: error.message, error: true });
  } finally { busy = false; }
}
async function submitResult() {
  if (busy || !pendingRun || !pendingResult) return;
  busy = true;
  render({ message: 'Saving your challenge result…' });
  try {
    const result = await request(`/wp-json/htsg-community/v1/runs/${pendingRun.runId}/finish`, pendingResult);
    if (result.accepted !== true || result.trust !== 'unverified') throw new Error('Your result was not confirmed. Please try submitting it again.');
    pendingRun = null;
    pendingResult = null;
    busy = false;
    render({ message: 'Your challenge score is saved to the casual scoreboard.', saved: true });
  } catch (error) {
    busy = false;
    render({ message: `${error.message} Your result remains here while this page stays open.`, error: true, retry: true });
  }
}
if (mount && mode === 'invaders' && (productionHost || requestedChallenge)) {
  document.addEventListener('htsg:run-start', event => {
    runActive = true;
    if (!event.detail?.challengeId) { pendingRun = null; pendingResult = null; }
    render();
  });
  document.addEventListener('htsg:run-result', event => {
    runActive = false;
    const result = event.detail || {};
    if (pendingRun && result.challengeId === pendingRun.challengeId && result.rulesVersion === pendingRun.rulesVersion) {
      pendingResult = { score: Math.floor(result.score), wave: Math.floor(result.wave), kills: Math.floor(result.kills), bosses: Math.floor(result.bossesDefeated || 0), elapsedTicks: Math.round(result.elapsed * 120) };
      submitResult();
    } else render();
  });
  document.addEventListener('htsg:challenge-retry', beginChallenge);
  document.addEventListener('htsg:challenge-abandon', () => { pendingRun = null; pendingResult = null; runActive = false; render(); });
  request('/community/session/').then(data => {
    session = data;
    render({ message: requestedChallenge && !data.enabled ? 'The weekly challenge is unavailable. Start a free game below.' : '' });
  }).catch(() => {
    if (requestedChallenge) render({ message: 'The weekly challenge could not be loaded. Start a free game below.' });
  });
}
