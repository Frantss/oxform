# Agent trial of the documentation

The trial of `plans/extension-api/04-documentation.md#7.5`, once per release, by hand.

## 0.7.0, 2026-11-18

- What: a Claude Sonnet subagent got only `apps/docs/dist/client/llms.txt` and the Markdown pages that it
  links, and the task "write the sign-in form as a lean chain, then add a `warning` check". It could read the
  compiler errors of its own code, and no other file of the repository.
- Pages read: `llms.txt`, `/docs/compose/lean-form.md`, `/docs/extend/second-check.md`, `/docs/behaviors/check.md`,
  `/docs/quick-start.md` (install), `/docs/core/create.md`.
- Result: success. Both forms type-check with `strict` (`tsc` exit 0) on the second attempt. The first attempt had no
  Oxform error, only the agent's own `.ts` import extension (TS5097). At runtime the sign-in form reports
  "Invalid email address" and the length error of the password. With a 10-character password, the second form
  is valid and has one warning, "A password of 12 characters or more is safer.".
- Gaps that the agent found:
  1. `compose/lean-form` and `extend/second-check` do not show how a second file imports the schema. Low.
  2. A non-exclusive check keeps one entry per event that ran (`01-public-api.md`, decision table, line 493). The
     agent gave the same schema to `change` and `submit` of `warning`, so a full run and a submit gave two
     identical entries for one issue. `behaviors/check` and `extend/second-check` do not warn about it.
  3. `extend/second-check` includes the kit's `warnings` and `warningSlots` with `no-check`, and does not show
     their import, so the `FieldWarning` part cannot be reproduced from the page alone.
  4. No page says where `check('warning')` goes in a lean chain. The agent put it after `check('error')`,
     before `status`, and it type-checked.
  5. The tuple that `validation.run` returns is shown only in an example, not in the "Returns" section.
- Why it matters: gap 2 shows the same warning twice in a real form. Gaps 1, 3, 4 and 5 cost an agent a guess.
