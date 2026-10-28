# React example labels

## 2026-10-27

- `examples/react/src/examples/basic.tsx:50` renders a label next to an input
  without `htmlFor` or a containing label. The same pattern appears at
  `examples/react/src/examples/async.tsx:56` and
  `examples/react/src/examples/transform.tsx:48`. These existing controls
  do not receive their visible text as an accessible name, which affects
  screen-reader navigation and label-based interaction.
