import { describe, expect, it } from 'vite-plus/test';
import { hasFilters, memberFilter } from './member-filter';

const setup = () => {
  const form = memberFilter.create();
  return { form, [Symbol.dispose]: () => form.destroy() };
};

describe('memberFilter', () => {
  it('has filters while one differs from its default, which shows "Clear filters"', () => {
    using subject = setup();
    subject.form.events.change('query', 'ada');
    const filtered = hasFilters(subject.form);
    subject.form.events.change('query', '');

    expect([filtered, hasFilters(subject.form)]).toEqual([true, false]);
  });

  it('has no validation and no submit', () => {
    using subject = setup();

    expect(['validation' in subject.form, 'submit' in subject.form]).toEqual([false, false]);
  });
});
