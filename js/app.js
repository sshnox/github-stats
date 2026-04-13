/* app.js — Main application */
'use strict';

/* ── DOM refs ────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const searchForm    = $('searchForm');
const searchInput   = $('searchInput');
const searchBtn     = $('searchBtn');
const loader        = $('loader');
const loaderText    = $('loaderText');
const errorBanner   = $('errorBanner');
const errorMsg      = $('errorMsg');
const errorDismiss  = $('errorDismiss');
const dashboard     = $('dashboard');
const hero          = $('hero');

/* ── Utils ───────────────────────────────────────────────────── */
function showLoader(msg = 'Fetching profile…') {
  loader.style.display = 'flex';
  loaderText.textContent = msg;
}
function hideLoader() { loader.style.display = 'none'; }

function showError(msg) {
  errorMsg.textContent = msg;
  errorBanner.style.display = 'flex';
}
function hideError() { errorBanner.style.display = 'none'; }

function formatNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30)  return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/* ── Rate limit ──────────────────────────────────────────────── */
async function updateRateLimit() {
  const rate = await GHApi.getRateLimit();
  if (rate) {
    const reset = new Date(rate.reset * 1000).toLocaleTimeString();
    $('rateLimit').textContent = `API: ${rate.remaining}/${rate.limit} · resets ${reset}`;
  }
}
updateRateLimit();

/* ── Search ──────────────────────────────────────────────────── */
function setLoading(on) {
  searchBtn.disabled = on;
  searchBtn.classList.toggle('loading', on);
}

async function loadUser(username) {
  if (!username.trim()) return;
  username = username.trim().toLowerCase();

  // Update URL
  history.pushState({}, '', `?user=${encodeURIComponent(username)}`);

  hideError();
  showLoader('Fetching profile…');
  setLoading(true);
  dashboard.style.display = 'none';

  try {
    // 1. User profile
    const user = await GHApi.getUser(username);

    showLoader('Loading repositories…');

    // 2. Repos
    const repos = await GHApi.getRepos(username);

    showLoader('Crunching stats…');

    // 3. Aggregate
    const stats = aggregateStats(repos);

    // 4. Commit activity (top 3 repos by stars for performance)
    const topReposByStars = repos
      .filter(r => !r.fork)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 3);

    let combinedWeeks = null;
    for (const repo of topReposByStars) {
      showLoader(`Loading commit activity for ${repo.name}…`);
      const activity = await GHApi.getCommitActivity(username, repo.name);
      if (activity && Array.isArray(activity) && activity.length > 0) {
        if (!combinedWeeks) {
          combinedWeeks = activity;
        } else {
          activity.forEach((week, i) => {
            if (combinedWeeks[i]) {
              week.days.forEach((d, j) => { combinedWeeks[i].days[j] += d; });
            }
          });
        }
      }
    }

    // 5. Render
    renderProfile(user);
    renderStats(user, stats, repos);
    renderLanguages(stats.languages);
    renderTopRepos(repos);
    renderRepoTable(repos);
    if (combinedWeeks) renderHeatmap(combinedWeeks);

    dashboard.style.display = 'flex';
    dashboard.style.flexDirection = 'column';
    dashboard.style.gap = '20px';

    updateRateLimit();

  } catch (err) {
    showError(err.message || 'Something went wrong. Please try again.');
  } finally {
    hideLoader();
    setLoading(false);
  }
}

/* ── Aggregate stats ─────────────────────────────────────────── */
function aggregateStats(repos) {
  let totalStars = 0, totalForks = 0, totalWatchers = 0;
  const languages = {};

  repos.forEach(r => {
    totalStars    += r.stargazers_count || 0;
    totalForks    += r.forks_count || 0;
    totalWatchers += r.watchers_count || 0;
    if (r.language) {
      // Use size as proxy for bytes (not perfect but best without extra API calls)
      languages[r.language] = (languages[r.language] || 0) + (r.size || 1);
    }
  });

  const langArray = Object.entries(languages)
    .map(([name, bytes]) => ({ name, bytes }))
    .sort((a, b) => b.bytes - a.bytes);

  return { totalStars, totalForks, totalWatchers, languages: langArray };
}

/* ── Render profile ──────────────────────────────────────────── */
function renderProfile(user) {
  const avatar = $('profileAvatar');
  avatar.src = user.avatar_url;
  avatar.alt = user.login;

  $('profileName').textContent  = user.name || user.login;
  $('profileLogin').textContent = '@' + user.login;
  $('profileBio').textContent   = user.bio || '';
  $('profileGhLink').href       = user.html_url;

  const loc = $('profileLocation');
  if (user.location) {
    $('locationText').textContent = user.location;
    loc.style.display = 'inline-flex';
  } else {
    loc.style.display = 'none';
  }

  const comp = $('profileCompany');
  if (user.company) {
    $('companyText').textContent = user.company.replace(/^@/, '');
    comp.style.display = 'inline-flex';
  } else {
    comp.style.display = 'none';
  }

  const blog = $('profileBlog');
  if (user.blog) {
    const url = user.blog.startsWith('http') ? user.blog : 'https://' + user.blog;
    blog.href = url;
    $('blogText').textContent = user.blog.replace(/^https?:\/\//, '');
    blog.style.display = 'inline-flex';
  } else {
    blog.style.display = 'none';
  }
}

/* ── Render overview stats ───────────────────────────────────── */
function renderStats(user, stats, repos) {
  const targets = {
    statRepos:     user.public_repos,
    statStars:     stats.totalStars,
    statForks:     stats.totalForks,
    statFollowers: user.followers,
    statWatchers:  stats.totalWatchers,
  };
  Object.entries(targets).forEach(([id, val]) => {
    Charts.animateCount($(id), val);
  });
}

/* ── Render language donut ───────────────────────────────────── */
function renderLanguages(langData) {
  Charts.drawDonut(
    $('donut'),
    $('donutCenter'),
    $('langLegend'),
    $('langSub'),
    langData
  );
}

/* ── Render top repos ────────────────────────────────────────── */
function renderTopRepos(repos) {
  const container = $('topRepos');
  container.innerHTML = '';

  const top = repos
    .filter(r => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 8);

  top.forEach((repo, i) => {
    const rank = i + 1;
    const langColor = Charts.getLangColor(repo.language, i);
    const card = document.createElement('a');
    card.className = 'repo-card';
    card.href = repo.html_url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.innerHTML = `
      <div class="rank-badge rank-${rank}">${rank}</div>
      <div class="repo-card__main">
        <div class="repo-card__name">${escHtml(repo.name)}</div>
        <div class="repo-card__desc">${escHtml(repo.description || 'No description')}</div>
        <div class="repo-card__meta">
          ${repo.language ? `
          <span class="repo-meta-item">
            <span class="lang-dot" style="background:${langColor};border-radius:50%"></span>
            ${escHtml(repo.language)}
          </span>` : ''}
          <span class="repo-meta-item">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l1.5 3.1 3.4.5L8.5 7l.6 3.4L6 8.8l-3.1 1.6.6-3.4-2.4-2.4 3.4-.5z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>
            ${formatNum(repo.stargazers_count)}
          </span>
          <span class="repo-meta-item">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="2.5" r="1.5" stroke="currentColor" stroke-width="1.1"/><circle cx="2.5" cy="9.5" r="1.5" stroke="currentColor" stroke-width="1.1"/><circle cx="9.5" cy="9.5" r="1.5" stroke="currentColor" stroke-width="1.1"/><path d="M4.8 5.6C4 6.4 3.1 7.3 2.5 8M7.2 5.6C8 6.4 8.9 7.3 9.5 8M6 4v1.2" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>
            ${formatNum(repo.forks_count)}
          </span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

/* ── Render heatmap ──────────────────────────────────────────── */
function renderHeatmap(weeklyData) {
  Charts.drawHeatmap($('heatmap'), weeklyData);
  const total = weeklyData.reduce((s, w) => s + w.days.reduce((a, b) => a + b, 0), 0);
  $('heatmapSub').textContent = `${total.toLocaleString()} commits · last 52 weeks`;
}

/* ── Render repo table ───────────────────────────────────────── */
let allRepos = [];

function renderRepoTable(repos) {
  allRepos = repos;
  applyTableFilters();
}

function applyTableFilters() {
  const filter = ($('repoFilter').value || '').toLowerCase();
  const sort   = $('repoSort').value;

  let filtered = allRepos.filter(r =>
    !filter || r.name.toLowerCase().includes(filter) || (r.description || '').toLowerCase().includes(filter)
  );

  filtered = filtered.sort((a, b) => {
    if (sort === 'stars')   return b.stargazers_count - a.stargazers_count;
    if (sort === 'forks')   return b.forks_count - a.stargazers_count;
    if (sort === 'updated') return new Date(b.updated_at) - new Date(a.updated_at);
    if (sort === 'name')    return a.name.localeCompare(b.name);
    return 0;
  });

  const tbody = $('repoTableBody');
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-mute);padding:32px">No repositories found</td></tr>`;
    return;
  }

  filtered.forEach(repo => {
    const langColor = Charts.getLangColor(repo.language, 0);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="td-name">
        <a href="${escHtml(repo.html_url)}" target="_blank" rel="noopener">${escHtml(repo.name)}</a>
        ${repo.fork ? '<span style="font-size:10px;color:var(--text-mute);margin-left:6px;background:var(--bg-3);padding:1px 6px;border-radius:10px">fork</span>' : ''}
        ${repo.archived ? '<span style="font-size:10px;color:var(--text-mute);margin-left:4px">archived</span>' : ''}
      </td>
      <td>
        ${repo.language
          ? `<span class="td-lang"><span class="lang-dot" style="background:${langColor};width:8px;height:8px;border-radius:50%;display:inline-block;"></span>${escHtml(repo.language)}</span>`
          : '<span style="color:var(--text-mute)">—</span>'
        }
      </td>
      <td class="td-num">${repo.stargazers_count.toLocaleString()}</td>
      <td class="td-num">${repo.forks_count.toLocaleString()}</td>
      <td class="td-date" style="color:var(--text-mute)">${timeAgo(repo.updated_at)}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ── Event listeners ─────────────────────────────────────────── */
searchForm.addEventListener('submit', e => {
  e.preventDefault();
  loadUser(searchInput.value);
});

errorDismiss.addEventListener('click', hideError);

document.querySelectorAll('.hint-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    searchInput.value = chip.dataset.user;
    loadUser(chip.dataset.user);
  });
});

$('repoFilter').addEventListener('input', applyTableFilters);
$('repoSort').addEventListener('change', applyTableFilters);

/* ── URL param autoload ──────────────────────────────────────── */
(function init() {
  const params = new URLSearchParams(window.location.search);
  const user   = params.get('user');
  if (user) {
    searchInput.value = user;
    loadUser(user);
  }
})();

/* ── Helpers ─────────────────────────────────────────────────── */
function escHtml(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
