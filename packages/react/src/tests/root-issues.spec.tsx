import type { UseFormReturn } from '#types/use-form-return';
import { useForm } from '#use-form';
import { memo } from 'react';
import { expect, it } from 'vite-plus/test';
import { render } from 'vitest-browser-react';
import z from 'zod';

const schema = z.object({ name: z.string() });
const Summary = memo(({ form }: { form: UseFormReturn<z.infer<typeof schema>, 'error'> }) => (
  <>
    <output aria-label='Form summary'>{form.state.issues.error.map(entry => entry.issue.message).join(', ')}</output>
    <output aria-label='Form validity'>{form.state.status.valid ? 'Valid' : 'Invalid'}</output>
  </>
));

it('updates a memoized form summary when root messages change without a validity change', async () => {
  const Component = () => {
    const form = useForm({ schema, defaultValues: { name: '' } });
    return (
      <>
        <Summary form={form} />
        <button onClick={() => form.field.setIssues('name', { error: [{ level: 'error', issue: { message: 'Name is unavailable' } }] })}>
          Field failure
        </button>
        <button onClick={() => form.setIssues({ error: [{ level: 'error', issue: { message: 'First failure' } }] })}>First failure</button>
        <button onClick={() => form.setIssues({ error: [{ level: 'error', issue: { message: 'Second failure' } }] })}>Second failure</button>
        <button onClick={() => form.setIssues({})}>Clear summary</button>
      </>
    );
  };
  const ui = await render(<Component />);
  const summary = ui.getByLabelText('Form summary');
  await ui.getByRole('button', { name: 'Field failure' }).click();
  await expect.element(summary).toHaveTextContent('');
  await expect.element(ui.getByLabelText('Form validity')).toHaveTextContent('Invalid');
  await ui.getByRole('button', { name: 'First failure' }).click();
  await expect.element(summary).toHaveTextContent('First failure');
  await ui.getByRole('button', { name: 'Second failure' }).click();
  await expect.element(summary).toHaveTextContent('Second failure');
  await ui.getByRole('button', { name: 'Clear summary' }).click();
  await expect.element(summary).toHaveTextContent('');
  await expect.element(ui.getByLabelText('Form validity')).toHaveTextContent('Invalid');
});
