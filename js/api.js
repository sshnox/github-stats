/* api.js — GitHub Public API wrapper */
'use strict';

window.GHApi = (() => {
  const BASE = 'https://api.github.com';
  const HEADERS = { Accept: 'application/vnd.github+json' };

  async function get(path) {
    const res = await fetch(BASE + path, { headers: HEADERS });
    if (res.status === 404) throw new Error('User not found.');
    if (res.status === 403) throw new Error('API rate limit exceeded. Try again in a minute.');
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    return res.json();
  }

  async function getUser(username) {
    return get(`/users/${username}`);
  }

  async function getRepos(username) {
    const allRepos = [];
    let page = 1;
    while (true) {
      const batch = await get(`/users/${username}/repos?per_page=100&page=${page}&sort=pushed`);
      allRepos.push(...batch);
      if (batch.length < 100) break;
      if (page >= 5) break; // cap at 500 repos
      page++;
    }
    return allRepos;
  }

  async function getCommitActivity(username, repoName) {
    try {
      return await get(`/repos/${username}/${repoName}/stats/commit_activity`);
    } catch {
      return null;
    }
  }

  async function getRateLimit() {
    try {
      const data = await get('/rate_limit');
      return data.rate;
    } catch {
      return null;
    }
  }

  return { getUser, getRepos, getCommitActivity, getRateLimit };
})();
