import { useState } from 'react';
import z from 'zod';
import { configureForm } from '../../../spike/src/form';
import { createParts } from '../../../spike/src/react/create-parts';
import { standardForm } from '../../../spike/src/standard';
import { withAutosave } from '../kit/autosave';
import { withWarnings } from '../kit/warnings';
import { Inspector } from '../inspector';

const schema = z.object({
  title: z.string().min(1, 'A post needs a title'),
  body: z.string(),
});

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

// Two extensions stack. The form gets the options, state, api and parts of both.
const post = configureForm(withAutosave(withWarnings(standardForm)), {
  schema,
  defaultValues: { title: '', body: '' },
  error: { change: schema, submit: schema },
  warning: {
    change: z.object({ title: z.string().max(40, 'Titles over 40 characters are cut off in search results') }),
  },
  autosaveDelay: 800,
  saveDraft: () => wait(400),
});

const { Root, Field, FieldError, FieldWarning, AutosaveStatus, Submit, useSelector } = createParts(post);

export function DraftEditor() {
  const [published, setPublished] = useState(false);

  // Each submit button names its action through its `value`, and `onSubmit` receives it as the intent.
  return (
    <Root
      className='layout'
      onSubmit={async (_values, form, intent) => {
        if (intent === 'draft') return form.autosave.flush();
        await wait(500);
        setPublished(true);
      }}
    >
      <div className='card'>
        <p className='hint'>A draft saves 0.8 seconds after you stop typing, once the title is valid.</p>
        <label>
          Title
          <Field name='title' />
          <FieldError name='title' />
          <FieldWarning name='title' />
        </label>
        <label>
          Body
          <Field name='body' render={<textarea rows={6} />} />
        </label>
        <AutosaveStatus>
          {({ saving, dirty, savedAt }) =>
            saving
              ? 'Saving draft…'
              : dirty
                ? 'Unsaved changes'
                : savedAt
                  ? `Draft saved at ${savedAt.toLocaleTimeString()}`
                  : 'No draft yet'
          }
        </AutosaveStatus>
        <div className='actions'>
          <Submit value='draft'>Save draft</Submit>
          <Submit>Publish</Submit>
        </div>
        {published && (
          <p className='result' role='status'>
            Published.
          </p>
        )}
      </div>
      <Inspector useSelector={useSelector} />
    </Root>
  );
}
