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

const { Root, Field, FieldError, FieldWarning, AutosaveStatus, Submit, useForm, useSelector } = createParts(post, {
  root: 'form',
  field: 'input',
  fieldError: 'p',
  fieldWarning: 'p',
  autosaveStatus: 'p',
  submit: 'button',
});

function SaveNow() {
  const form = useForm();
  return (
    <button type='button' onClick={() => form.autosave.flush()}>
      Save draft now
    </button>
  );
}

export function DraftEditor() {
  return (
    <Root className='layout' onSubmit={() => wait(500)}>
      <div className='card'>
        <p className='hint'>A draft saves 0.8 seconds after you stop typing, once the title is valid.</p>
        <label>
          Title
          <Field name='title' />
          <FieldError name='title'>{({ messages }) => messages[0]}</FieldError>
          <FieldWarning name='title'>{({ messages }) => messages[0]}</FieldWarning>
        </label>
        <label>
          Body
          <Field name='body' render={<textarea rows={6} />} />
        </label>
        <AutosaveStatus>
          {({ saving, savedAt }) =>
            saving ? 'Saving draft…' : savedAt ? `Draft saved at ${savedAt.toLocaleTimeString()}` : 'No draft yet'
          }
        </AutosaveStatus>
        <div className='actions'>
          <Submit>{({ submitting }) => (submitting ? 'Publishing…' : 'Publish')}</Submit>
          <SaveNow />
        </div>
      </div>
      <Inspector useSelector={useSelector} />
    </Root>
  );
}
