import { createParts } from '@oxform/solid';
import { hasFilters, memberFilter } from 'example-oxform-kit/member-filter';
import { For, Show } from 'solid-js';

const { Root, Field, useForm, useSelector } = createParts(memberFilter);

const people = [
  { name: 'Ada Lovelace', email: 'ada@example.com', role: 'admin' },
  { name: 'Grace Hopper', email: 'grace@example.com', role: 'member' },
  { name: 'Linus Torvalds', email: 'linus@example.com', role: 'member' },
] as const;

const Results = () => {
  const form = useForm();
  const values = useSelector(state => state.values);
  // The selector reads the status of the instance, which the store state carries.
  const filtering = useSelector(() => hasFilters(form));
  const shown = () =>
    people.filter(
      person =>
        person.name.toLowerCase().includes(values().query.toLowerCase()) &&
        (values().role === '' || person.role === values().role),
    );
  const clear = () => {
    form.events.change('query', '');
    form.events.change('role', '');
  };

  return (
    <>
      <Show when={filtering()}>
        <button type='button' onClick={clear}>
          Clear filters
        </button>
      </Show>
      <ul aria-label='Members'>
        <For each={shown()}>
          {person => (
            <li>
              {person.name} ({person.role})
            </li>
          )}
        </For>
      </ul>
    </>
  );
};

/** E02. The filter has no submit, so `Root` renders no element: the fields sit in a plain search region. */
export const MemberFilter = () => (
  <Root>
    <search>
      <label>
        Search
        <Field name='query' type='search' />
      </label>
      <label>
        Role
        <Field
          name='role'
          render={props => (
            <select {...props}>
              <option value=''>Any role</option>
              <option value='admin'>Admin</option>
              <option value='member'>Member</option>
            </select>
          )}
        />
      </label>
    </search>
    <Results />
  </Root>
);
