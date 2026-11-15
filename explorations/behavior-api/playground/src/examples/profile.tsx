import z from 'zod';
import { configureForm } from '../../../spike/src/form';
import { createParts } from '../../../spike/src/react/create-parts';
import { standardForm } from '../../../spike/src/standard';
import { Inspector } from '../inspector';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  bio: z.string().max(60, 'Keep the bio under 60 characters'),
  role: z.enum(['developer', 'designer', 'manager']),
  newsletter: z.boolean(),
});

const profile = configureForm(standardForm, {
  schema,
  defaultValues: { name: 'Ada', bio: '', role: 'developer', newsletter: false },
  error: { change: schema, submit: schema },
});

const { Root, Field, FieldError, Submit, Reset, useForm, useField, useSelector } = createParts(profile, {
  root: 'form',
  field: 'input',
  fieldError: 'p',
  submit: 'button',
  reset: 'button',
});

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

/** The field slot reads `value`, so a checkbox is bound by hand through the field handle. */
function NewsletterToggle() {
  const newsletter = useField('newsletter');
  return (
    <label>
      <span>
        <input
          type='checkbox'
          checked={newsletter.state.value}
          onChange={event => newsletter.change(event.target.checked)}
          onFocus={() => newsletter.focus()}
          onBlur={() => newsletter.blur()}
        />{' '}
        Send me the newsletter
      </span>
    </label>
  );
}

/** A field's status, as the handle reports it. */
function StatusChips({ name }: { name: 'name' | 'bio' | 'role' | 'newsletter' }) {
  const { status } = useField(name).state;
  const active = (['dirty', 'touched', 'blurred', 'default'] as const).filter(flag => status[flag]);
  return (
    <p className='hint'>
      {name}: {active.join(', ') || 'untouched'}
    </p>
  );
}

function ResetActions() {
  const form = useForm();
  return (
    <>
      <Reset>Reset</Reset>
      <button
        type='button'
        onClick={() =>
          form.reset.all({ values: { name: 'Grace', bio: 'Compilers', role: 'manager', newsletter: true } })
        }
      >
        Reset to Grace
      </button>
      <button type='button' onClick={() => form.reset.all({ keep: { checks: true } })}>
        Reset, keep errors
      </button>
    </>
  );
}

export function Profile() {
  return (
    <Root className='layout' onSubmit={() => wait(500)}>
      <div className='card'>
        <label>
          Name
          <Field name='name' />
          <FieldError name='name'>{({ messages }) => messages[0]}</FieldError>
        </label>
        <label>
          Bio
          <Field name='bio' />
          <FieldError name='bio'>{({ messages }) => messages[0]}</FieldError>
        </label>
        <label>
          Role
          {/* `render` puts the part's props, value and listeners on another element. */}
          <Field
            name='role'
            render={
              <select>
                <option value='developer'>Developer</option>
                <option value='designer'>Designer</option>
                <option value='manager'>Manager</option>
              </select>
            }
          />
        </label>
        <NewsletterToggle />
        <fieldset>
          <legend>Field status</legend>
          <StatusChips name='name' />
          <StatusChips name='bio' />
          <StatusChips name='role' />
          <StatusChips name='newsletter' />
        </fieldset>
        <div className='actions'>
          <Submit>{({ submitting, submits }) => (submitting ? 'Saving…' : `Save (${submits})`)}</Submit>
          <ResetActions />
        </div>
      </div>
      <Inspector useSelector={useSelector} />
    </Root>
  );
}
