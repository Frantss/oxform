# Legacy readme plan links

## 2026-10-27

- `.claude/plans/update-the-readme-document-swirling-storm.md:5`, `:7`, `:8`,
  and `:17` link to root-level files using paths relative to the plan directory.
  Those targets do not exist under `.claude/plans/`, so the links fail when
  rendered as Markdown. Observed during dependency-update link checks.
