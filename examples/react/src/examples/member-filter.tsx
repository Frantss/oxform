import { createParts } from '@oxform/react';
import { hasFilters, memberFilter } from 'example-oxform-kit/member-filter';

const { Root, Field, useForm, useSelector } = createParts(memberFilter);

const people = [
  { name: 'Ada Lovelace', email: 'ada@example.com', role: 'admin' },
  { name: 'Grace Hopper', email: 'grace@example.com', role: 'member' },
  { name: 'Linus Torvalds', email: 'linus@example.com', role: 'member' },
] as const;

const Results = () => {
  const form = useForm();
  const { query, role } = useSelector(state => state.values);
  const shown = people.filter(
    person => person.name.toLowerCase().includes(query.toLowerCase()) && (role === '' || person.role === role),
  );
  const clear = () => {
    form.events.change('query', '');
    form.events.change('role', '');
  };

  return (
    <>
      {hasFilters(form) && (
        <button type='button' onClick={clear}>
          Clear filters
        </button>
      )}
      <ul aria-label='Members'>
        {shown.map(person => (
          <li key={person.email}>
            {person.name} ({person.role})
          </li>
        ))}
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
