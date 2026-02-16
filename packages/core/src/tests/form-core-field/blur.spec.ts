import { expect, it } from 'vitest';

import { setup } from './setup';

it('blurs a registered element reference', () => {
  using context = setup();
  const element = document.createElement('input');
  document.body.append(element);
  element.focus();

  context.field.register('name')(element);
  context.field.blur('name');

  expect(document.activeElement).not.toBe(element);
  element.remove();
});

it('marks the field as blurred', () => {
  using context = setup();

  context.field.blur('name');
  const meta = context.field.meta('name');

  expect(meta.blurred).toBe(true);
});

it('marks an ascendant field as blurred when blurring a nested field', () => {
  using context = setup();

  context.field.blur('nested.value');
  const meta = context.field.meta('nested');

  expect(meta.blurred).toBe(true);
});

it('does not mark a descendant field as blurred when blurring a parent field', () => {
  using context = setup();

  context.field.blur('nested');
  const meta = context.field.meta('nested.value');

  expect(meta.blurred).toBe(false);
});
