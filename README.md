# 📊 DevScope — GitHub Repo Stats Viewer

> Enter any GitHub username and instantly see a full analytics dashboard: stars, forks, top languages, commit heatmap, and more. No API key required.

**[Live Demo](https://YOUR_USERNAME.github.io/github-stats)**

---

## ✨ Features

- **Profile card** — avatar, bio, location, company, website
- **Overview stats** — repos, total stars, forks, followers, watchers (animated counters)
- **Top Languages donut** — animated SVG donut chart with % breakdown
- **Top Repositories** — ranked cards with stars, forks, language
- **Commit Activity Heatmap** — 52-week activity grid from real API data
- **Full Repo Table** — filter + sort by stars / forks / updated / name
- **URL sharing** — `?user=torvalds` deep links work
- **API rate limit display** — shows remaining requests
- **Zero dependencies** — vanilla JS, no npm, no build step

---

## 🚀 Deploy to GitHub Pages

1. Extract zip → push to a new GitHub repo
2. **Settings → Pages → Source: main branch → Save**
3. Live at: `https://YOUR_USERNAME.github.io/REPO_NAME`

Or open `index.html` directly in any browser — it works locally too.

---

## ⚠️ API Rate Limiting

The GitHub Public API allows **60 requests/hour** without authentication.

Each profile load uses ~5-10 requests. To increase to 5000/hour:

1. Create a [GitHub Personal Access Token](https://github.com/settings/tokens) (no scopes needed)
2. In `js/api.js`, update the headers:

```javascript
const HEADERS = {
  Accept: 'application/vnd.github+json',
  Authorization: 'Bearer YOUR_TOKEN_HERE',
};
```

> Never commit your token to a public repo.

---

## 🗂 Project Structure

```
github-stats/
├── index.html        ← App shell
├── css/style.css     ← Obsidian dashboard theme
├── js/
│   ├── api.js        ← GitHub API wrapper
│   ├── charts.js     ← Donut chart + heatmap renderer
│   └── app.js        ← Main application logic
└── README.md
```

---

## 🔗 URL Params

Link directly to a profile:
```
https://YOUR_SITE/?user=torvalds
https://YOUR_SITE/?user=sindresorhus
```

---

## License

MIT © 2024
