import type { StateOf } from '@oxform/core';
import type { articleEditor } from './article-editor';

/**
 * E22. The writer must see unsaved changes, and "Publish" must wait for validation. A selector of the store
 * state, so a component updates only when one of the two flags changes.
 */
export const articleStatus = (state: StateOf<typeof articleEditor>) => ({
  unsaved: state.status.form.dirty,
  publishDisabled: state.status.form.validating || state.status.form.submitting,
});
