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
     - Fixed: the complete example of `compose/lean-form` says that the kit file imports the schema from
       `schemas/sign-in.ts`, and that another file imports the form with `import { signIn } from './sign-in';`.
  2. A non-exclusive check keeps one entry per event that ran (`01-public-api.md`, decision table, line 493). The
     agent gave the same schema to `change` and `submit` of `warning`, so a full run and a submit gave two
     identical entries for one issue. `behaviors/check` and `extend/second-check` do not warn about it.
     - Fixed: a probe on the built packages confirmed it. Non-exclusive, `change` and `submit`: a change and then a
       submit give two entries, typed `change` and `submit`. With `exclusive: true`, a change and then a submit
       give one entry, but a run of every event (`validation.run()`) still gives two. With the schema on one event,
       every sequence gives one entry. `behaviors/check` states it in Rules and in a common-mistakes row, and so
       does `extend/second-check`, with both remedies and the limit of `exclusive`. The kit advice
       (`examples/kit/src/article-advice.ts`) and the "Set its validators" step now use `change` only, and
       `warnings.spec.ts` checks one entry after a change, a submit and a full run.
  3. `extend/second-check` includes the kit's `warnings` and `warningSlots` with `no-check`, and does not show
     their import, so the `FieldWarning` part cannot be reproduced from the page alone.
     - Fixed: the "Apply both to the form" step says that `warnings` and `warningSlots` are project code, not
       Oxform exports. They are the first and third steps, which the kit keeps in `warnings.ts`. The step shows
       `import { warningSlots, warnings } from './warnings';`.
  4. No page says where `check('warning')` goes in a lean chain. The agent put it after `check('error')`,
     before `status`, and it type-checked.
     - Fixed: the "Add the check" step of `extend/second-check` lists the place. It is required after `validation`
       (a type error, and `create` throws `The "check:warning" extension needs "validation", which no earlier
       extension provides.`), and before `handles` and before `warningSlots` for what they give. Any other place is
       free; a probe with the check last in a lean chain works. By convention it goes next to `check('error')`.
       `compose/lean-form` links to it.
  5. The tuple that `validation.run` returns is shown only in an example, not in the "Returns" section.
     - Fixed: `behaviors/validation` is an extension page, so it has no "Returns" section. Its "Adds" table and its
       Rules now state that `run` resolves the tuple `[valid, issues]`, with `const [valid, issues] = await
       form.validation.run()`. `core/create` does not document `run`.
- Why it matters: gap 2 shows the same warning twice in a real form. Gaps 1, 3, 4 and 5 cost an agent a guess.
