import { mount } from '#tests/setup';
import { createForm } from '@oxform/solid';
import { expect, it } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import z from 'zod';

it('should render root message replacements and clearing while field errors keep the form invalid', async () => {
  mount(() => {
    const form = createForm({ schema: z.object({ name: z.string() }), defaultValues: { name: '' } });
    const state = form.state;
    form.field.setIssues('name', { error: [{ level: 'error', issue: { message: 'Name is unavailable' } }] });
    return (
      <>
        <output aria-label='Form summary'>{state.issues.error.map(entry => entry.issue.message).join(', ')}</output>
        <output aria-label='Form validity'>{state.status.valid ? 'Valid' : 'Invalid'}</output>
        <button onClick={() => form.setIssues({ error: [{ level: 'error', issue: { message: 'First failure' } }] })}>First failure</button>
        <button onClick={() => form.setIssues({ error: [{ level: 'error', issue: { message: 'Second failure' } }] })}>Second failure</button>
        <button onClick={() => form.setIssues({})}>Clear summary</button>
      </>
    );
  });
  const summary = page.getByLabelText('Form summary');
  await expect.element(summary).toHaveTextContent('');
  await page.getByRole('button', { name: 'First failure' }).click();
  await expect.element(summary).toHaveTextContent('First failure');
  await page.getByRole('button', { name: 'Second failure' }).click();
  await expect.element(summary).toHaveTextContent('Second failure');
  await page.getByRole('button', { name: 'Clear summary' }).click();
  await expect.element(summary).toHaveTextContent('');
  await expect.element(page.getByLabelText('Form validity')).toHaveTextContent('Invalid');
});
