# Plan: rebuild Oxform on the extension API

Status: complete, revision 4. Ready for implementation. Nothing is implemented. Every decision is made, and no
question to the owner remains. The plan describes a ground-up rewrite of every package, test, example and
document for the `0.7.0` release. The reference is the spike in
[explorations/extension-api/](../../explorations/extension-api/readme.md).

## Reading order

| File                                             | Read it to learn                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [00-direction.md](./00-direction.md)             | The goal, principles, glossary, entry points, canonical names, settled decisions |
| [01-public-api.md](./01-public-api.md)           | Every export of every entry point, the adapter surface, the design items         |
| [02-structure.md](./02-structure.md)             | The workspace, source layout, build, manifests, tooling and CI                   |
| [03-testing.md](./03-testing.md)                 | Test layers, coverage, the type-test matrix, bundle checks, the test inventory   |
| [04-documentation.md](./04-documentation.md)     | The example catalogue, site map, page templates, agent-first delivery            |
| [05-migration-guide.md](./05-migration-guide.md) | The draft of the agent-focused guide from 0.x                                    |
| [06-roadmap.md](./06-roadmap.md)                 | Phases, work packages, the decision register, the risk register                  |
| [07-comparison.md](./07-comparison.md)           | The comparison with TanStack Form, React Hook Form and Formisch                  |

`00-direction.md` is the source of truth. Each fact has one owner file (see its ownership table). The other
files link to the owner.

## Start here

1. Read `00-direction.md`. Its "Owner decisions" section records what the owner decided.
2. Start phase 0 of `06-roadmap.md`: P0-03 tags the last commit where the spike builds, and P0-04 creates the
   integration branch `codex/extension-api-rebuild`. Both are side effects, so each needs the owner's approval
   when it runs (`AGENTS.md`, "Autonomy").
3. Then start phase 1 with P1-01. The decision register of `06-roadmap.md` gives the answer to each choice
   that a work package meets.
4. To map a name of the spike to its name in the plan, use the rename record in `01-public-api.md`,
   section 7.1.

## Rules for changing the plan

- Change `00-direction.md` first, then the files that depend on the changed fact.
- A file that must differ from the direction records it under "Deviations and decisions".
- Use the glossary terms only.
- Format with `pnpm exec vp fmt plans/extension-api`.
