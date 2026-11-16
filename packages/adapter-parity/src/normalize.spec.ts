import { describe, expect, it } from 'vite-plus/test';
import { normalizeHtml } from './normalize';

const setup = (html: string, formId = '_R_1_') => ({ normalized: normalizeHtml(html, formId), [Symbol.dispose]() {} });

describe('normalizeHtml', () => {
  it('replaces each use of the form id', () => {
    using subject = setup('<input id="_R_1_-email" aria-describedby="_R_1_-email-error">');

    expect(subject.normalized).toBe('<input id="FORM-email" aria-describedby="FORM-email-error">');
  });

  it('removes the comments and the hydration attributes of a framework', () => {
    using subject = setup('<form data-hk="0-0"><!--$-->Sign in<!--/--><!-- --></form>');

    expect(subject.normalized).toBe('<form>Sign in</form>');
  });

  it('keeps an id that is not the form id', () => {
    using subject = setup('<input id="other-email">');

    expect(subject.normalized).toBe('<input id="other-email">');
  });
});
