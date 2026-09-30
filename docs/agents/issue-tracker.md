# Issue tracker: GitHub

Issues and specs live in GitHub Issues for rangzen/bipcompass.
Use the `gh` CLI from this repository.

## Authentication with the repository GitHub App

Use the repository's restricted GitHub App for issue operations. Do not use a
personal access token, a personal `gh auth login` session, or the broader
Codex GitHub connector for these operations.

The local, gitignored `.env` contains `GH_APP_ID`,
`GH_APP_INSTALLATION_ID`, and `GH_APP_PRIVATE_KEY_PATH`. The private key file
is kept outside the repository. Never print or commit the `.env` file, private
key, JWT, or installation token. `gh` does not load `.env` automatically.

To authenticate `gh`:

1. Read the app settings locally without logging secret values.
2. Sign a short-lived JWT with the app ID and private key.
3. Exchange the JWT at
   `POST /app/installations/{installation_id}/access_tokens`.
   Request only the `bipcompass` repository and the `issues: write` permission.
4. Pass the returned installation token to `gh` as `GH_TOKEN` for the command
   or process that needs it. Do not save it in the persistent `gh` credential
   store. Installation tokens expire after one hour, so mint a fresh one when
   needed.

The GitHub CLI uses `GH_TOKEN` for authentication. GitHub's documentation for
[installation tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)
and the CLI's [`GH_TOKEN` environment variable](https://cli.github.com/manual/gh_help_environment)
describes the token flow. A local helper must parse `.env` and pass the token
to `gh`; do not `source` untrusted env files or echo the token.

Keep the app installation limited to this repository. If another operation
needs permissions beyond `issues: write`, stop and request the app owner to
review the required scope before expanding it.

## Conventions

- Create: `gh issue create --title "..." --body-file <file>`.
- Read: `gh issue view <number> --comments`.
- List: `gh issue list --state open --json number,title,body,labels,comments`.
- Comment: `gh issue comment <number> --body-file <file>`.
- Apply labels: `gh issue edit <number> --add-label "..."`.
- Remove labels: `gh issue edit <number> --remove-label "..."`.
- Close: `gh issue close <number> --comment "..."`.

For multiline content, write the exact text to a file and use
`--body-file`. Infer the repository from the Git remote.

## Pull requests as a triage surface

PRs as a request surface: no.

## Skill terminology

"Publish to the issue tracker" means create a GitHub issue.
"Fetch the relevant ticket" means read the issue and its comments.
