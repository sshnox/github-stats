# Contributing

Thanks for taking an interest in GitHub Stats. The project is intentionally small and uses plain HTML, CSS, and JavaScript so that it remains easy to understand and modify.

## Before you start

For bugs, search existing issues first. For larger changes, open an issue before writing code so the proposed behavior can be discussed.

## Local setup

```bash
git clone https://github.com/sshnox/github-stats.git
cd github-stats
python3 -m http.server 8000
```

Then open <http://localhost:8000> and test with a public GitHub username.

## Pull requests

Keep pull requests focused on one problem. Include:

- A short explanation of the user-facing change
- Steps to reproduce or test it
- Screenshots for visible layout changes
- Notes about GitHub API behavior or rate limits when relevant

Please avoid adding build tooling or dependencies unless the change clearly needs them. The project should continue to work as a static site.

## Commit style

Use a short, imperative subject line, for example:

```text
Fix repository sorting by fork count
```

## Scope

Do not include personal access tokens, session data, or private GitHub information in issues, screenshots, commits, or pull requests.
