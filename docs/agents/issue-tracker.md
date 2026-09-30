# Issue tracker: GitHub

Issues and specs live in GitHub Issues for rangzen/bipcompass.
Use the `gh` CLI from this repository.

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
