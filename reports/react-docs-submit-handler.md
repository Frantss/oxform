# React quick-start submission

- `apps/docs/content/docs/react/index.mdx:51` creates a submit handler inside
  `onSubmit` without invoking it. Submitting the documented first form therefore
  does not run validation or the success callback.
