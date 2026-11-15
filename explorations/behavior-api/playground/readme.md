# Behavior API playground

Nine forms built on the spike, one per page, with a live view of each form's state. Six use the preset. Three use a
customized form from `src/kit/`: an extension that masks inputs, two stacked extensions (autosave and warnings), and a
lean form composed from a few behaviors. The pages are plain app code. The kit is what a team that owns the form
system writes once.

The app imports the spike (`../spike/src`) and the sketched types (`../api.ts`) directly. It is outside the workspace
and resolves React, Zod and the store from the installed packages.

```bash
cd explorations/behavior-api/playground
pnpm exec vp dev        # http://localhost:5173
pnpm exec tsc -p .      # type-check the examples
```
