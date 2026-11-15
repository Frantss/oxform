import z from 'zod';
import { configureForm } from '../../../spike/src/form';
import { createParts } from '../../../spike/src/react/create-parts';
import { standardForm } from '../../../spike/src/standard';
import { Inspector } from '../inspector';

const schema = z.object({
  tags: z.array(z.string().min(1, 'A tag cannot be empty')),
  members: z.array(z.object({ name: z.string().min(1, 'Name is required'), role: z.string() })),
});

const team = configureForm(standardForm, {
  schema,
  defaultValues: {
    tags: ['alpha', 'beta'],
    members: [
      { name: 'Ada', role: 'lead' },
      { name: 'Grace', role: 'member' },
    ],
  },
  error: { change: schema, submit: schema },
});

const { Root, Field, FieldError, Submit, useArrayField, useSelector } = createParts(team);

function Tags() {
  const tags = useArrayField('tags');

  return (
    <fieldset>
      <legend>Tags (scalar array)</legend>
      {tags.get().map((_, index) => (
        // The ids follow each item through swap, move and remove, so its input keeps focus and its errors.
        <div key={tags.ids[index]}>
          <div className='actions'>
            <Field name={`tags.${index}`} aria-label={`Tag ${index + 1}`} />
            <button type='button' onClick={() => tags.remove(index)} aria-label={`Remove tag ${index + 1}`}>
              ×
            </button>
          </div>
          <FieldError name={`tags.${index}`} />
        </div>
      ))}
      <div className='actions'>
        <button type='button' onClick={() => tags.append('')}>
          Append
        </button>
        <button type='button' onClick={() => tags.prepend('first')}>
          Prepend
        </button>
        <button type='button' onClick={() => tags.insert(1, 'middle')}>
          Insert at 1
        </button>
        <button type='button' onClick={() => tags.swap(0, tags.get().length - 1)}>
          Swap ends
        </button>
        <button type='button' onClick={() => tags.move(0, tags.get().length - 1)}>
          Move first to last
        </button>
        <button type='button' onClick={() => tags.update(0, current => current.toUpperCase())}>
          Uppercase first
        </button>
        <button type='button' onClick={() => tags.replace(current => current.filter(Boolean))}>
          Drop empty
        </button>
      </div>
    </fieldset>
  );
}

function Members() {
  const members = useArrayField('members');
  const count = members.get().length;

  return (
    <fieldset>
      <legend>Members (object array)</legend>
      {members.get().map((_, index) => (
        <div key={members.ids[index]}>
          <div className='actions'>
            <Field name={`members.${index}.name`} aria-label={`Member ${index + 1} name`} />
            <Field name={`members.${index}.role`} aria-label={`Member ${index + 1} role`} />
            <button type='button' disabled={index === 0} onClick={() => members.move(index, index - 1)}>
              ↑
            </button>
            <button type='button' disabled={index === count - 1} onClick={() => members.move(index, index + 1)}>
              ↓
            </button>
            <button type='button' onClick={() => members.remove(index)} aria-label={`Remove member ${index + 1}`}>
              ×
            </button>
          </div>
          <FieldError name={`members.${index}.name`} />
        </div>
      ))}
      <div className='actions'>
        <button type='button' onClick={() => members.append({ name: '', role: 'member' })}>
          Add member
        </button>
      </div>
    </fieldset>
  );
}

export function Arrays() {
  return (
    <Root className='layout'>
      <div className='card'>
        <p className='hint'>
          Add an empty item, then reorder or remove items. Errors stay with the item that has them.
        </p>
        <Tags />
        <Members />
        <div className='actions'>
          <Submit>Save team</Submit>
        </div>
      </div>
      <Inspector useSelector={useSelector} />
    </Root>
  );
}
