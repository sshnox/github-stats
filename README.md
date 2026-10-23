# GitHub Stats

A small, dependency-free dashboard for exploring a GitHub profile through the public GitHub API.

**Live demo:** [sshnox.github.io/github-stats](https://sshnox.github.io/github-stats/)

Enter a GitHub username to see profile details, repository totals, language distribution, top repositories, recent commit activity, and a searchable repository table.

## What it shows

- Profile name, avatar, bio, location, company, and website
- Public repository count, total stars, forks, followers, and watchers
- Language distribution based on repository size
- Top repositories ranked by stars
- A 52-week commit activity heatmap from the most-starred repositories
- Repository filtering and sorting by stars, forks, last update, or name
- Shareable profile URLs such as `?user=torvalds`
- Current unauthenticated GitHub API rate-limit status

## Run it locally

No build step or package manager is required.

```bash
git clone https://github.com/sshnox/github-stats.git
cd github-stats
python3 -m http.server 8000
```

Open <http://localhost:8000> in your browser. Opening `index.html` directly also works, although a local HTTP server avoids browser restrictions around local files.

## GitHub API limits

The app uses GitHub's unauthenticated public API, which is limited to 60 requests per hour per IP address. A profile load can make several requests because repository and commit activity data are fetched separately.

The app does not ask for, store, or require a personal access token. If you fork the project and add authenticated requests, keep credentials on a server or local development environment and never commit them to the repository.

## Project structure

```text
index.html       App shell and accessible markup
css/style.css    Layout, theme, and responsive styles
js/api.js        GitHub API wrapper
js/charts.js     Language donut and commit heatmap rendering
js/app.js        Application state and UI rendering
```

## Contributing

Bug reports, focused improvements, and documentation fixes are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request.

## License

MIT © Shoaib Shah
