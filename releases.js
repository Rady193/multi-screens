// The newest release of a SCAFFApps app: the same file in every SCAFFApps Electron app (Multi Screens, Smart Snap,
// the SCAFFApps Suite).
//
// Asked first of the SCAFFApps website (www.scaffapps.com/api/releases/<app>), then of releases.json in the SCAFFApps
// Suite's repository (raw.githubusercontent.com), and only then of GitHub's API. The API answers 60 questions an
// hour for each internet connection, shared by every computer and app behind it: an office of laptops starting
// together in the morning would run out. The website and the file have no such limit; releases.json is refreshed
// with every release, and the website keeps a copy of it for a few minutes. All three answer in the API's own
// shape (tag_name, name, body, published_at, html_url, assets with name, size, digest and browser_download_url), so
// what the app does with the answer does not change.
const { net } = require('electron');

const SITE = 'https://www.scaffapps.com/api/releases/';
const MIRROR = 'https://raw.githubusercontent.com/Rady193/scaffapps-suite/main/releases.json';
let mirror = null;            // { at, data: promise }: releases.json, kept a minute and shared by questions asked
                              // together (the Suite asks for every app at once)

async function getJson(url, agent, accept) {
  const res = await net.fetch(url, { headers: { Accept: accept || 'application/json', 'User-Agent': agent }, cache: 'no-store' });
  return { res, data: res.ok ? await res.json() : null };
}

async function fromSite(name, agent) {
  const { res, data } = await getJson(SITE + encodeURIComponent(name), agent);
  return res.ok && data && data.tag_name ? data : null;
}

async function fromMirror(name, agent) {
  if (!mirror || Date.now() - mirror.at > 60_000) {
    const data = getJson(MIRROR, agent).then(({ res, data: d }) => (res.ok && d && d.repos ? d : null));
    const kept = { at: Date.now(), data };
    mirror = kept;
    const forget = () => { if (mirror === kept) mirror = null; };     // not kept when it did not answer
    data.then((d) => { if (!d) forget(); }, forget);
  }
  const all = await mirror.data;
  const r = all && all.repos[name];
  return r && r.tag_name ? r : null;
}

// GitHub's API, as before: its own answers for "limited", "no release yet" and other errors.
async function fromGitHub(url, agent, missing) {
  const { res, data } = await getJson(url, agent, 'application/vnd.github+json');
  if (res.status === 403 || res.status === 429) throw new Error('GitHub is limiting how often it can be asked. Try again in an hour.');
  if (res.status === 404) {
    if (missing === 'null') return null;
    throw new Error('No release has been published yet.');
  }
  if (!res.ok) throw new Error(`GitHub answered with error ${res.status}. Try again later.`);
  return data;
}

// repo: "Rady193/multi-screens". test: a stand-in for GitHub's releases/latest address (tests), asked alone.
// missing: "null" to answer null when there is no release (the Suite), else an error.
async function latest(repo, { agent, test = null, missing = 'error' } = {}) {
  if (test) return fromGitHub(test, agent, missing);
  const name = repo.split('/')[1];
  for (const source of [fromSite, fromMirror]) {
    try {
      const release = await source(name, agent);
      if (release) return release;
    } catch { /* not reachable: the next source */ }
  }
  return fromGitHub(`https://api.github.com/repos/${repo}/releases/latest`, agent, missing);
}

module.exports = { latest, SITE, MIRROR };
