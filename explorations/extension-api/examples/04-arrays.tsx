// Type-checked: `tsc -p examples/tsconfig.json`. The types are in spike/src/api.ts and type-tests/.
//
// Use case: scalar and object arrays, every mutation, stable item ids, and item fields.
// `arrays` is an extension. `useArrayField` binds its handle to React.

import { defineForm } from '@oxform/core';
import { standard } from '@oxform/core/standard';
import { createParts } from '@oxform/react';
import z from 'zod';

const team = defineForm({
  name: 'team',
  schema: z.object({
    tags: z.array(z.string()),
    members: z.array(z.object({ name: z.string().min(1), role: z.string() })),
  }),
  defaultValues: { tags: ['alpha'], members: [] },
}).extend(standard); // `standard` includes `arrays`. A lean form adds `.extend(arrays)` after `values`, `status`, `validation`.

const { Root, Field, Submit, useArrayField } = createParts(team, { root: 'form', field: 'input', submit: 'button' });

// A list has no fixed parts, so it is a hook, not a component. This is UI SDK's "write your own part
// for data-driven lists". The hook returns the bound array handle and re-renders on array changes.
export function Members() {
  const members = useArrayField('members');

  return (
    <Root onSubmit={values => save(values)}>
      {members.get().map((_, index) => (
        // Ids follow items through swap, move, and remove.
        <fieldset key={members.ids[index]}>
          <Field name={`members.${index}.name`} />
          <button type='button' onClick={() => members.remove(index)}>
            Remove
          </button>
        </fieldset>
      ))}
      <button type='button' onClick={() => members.append({ name: '', role: 'member' })}>
        Add
      </button>
      <Submit>Save</Submit>
    </Root>
  );
}

// Every mutation accepts the same change options as field.change() and returns void.
const form = team.create();
const tags = form.array('tags');

tags.append('beta');
tags.prepend('first');
tags.insert(1, 'middle');
tags.swap(0, 1);
tags.move(0, 2);
tags.update(0, current => current.toUpperCase());
tags.remove(0, { should: { validate: false } }); // remove always skips validation
tags.replace(current => current.filter(Boolean));
tags.get();
tags.ids;
