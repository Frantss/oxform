const show = (value: unknown) => JSON.stringify(value, null, 2);

type UseSelector = (selector: (state: any) => unknown) => unknown;

/** Shows the form's live state. Render it inside `Root` and pass the form's `useSelector`. */
export function Inspector({ useSelector }: { useSelector: UseSelector }) {
  const { values, status, ...checks } = useSelector(state => state) as {
    values: unknown;
    status: { form: unknown };
    [slice: string]: unknown;
  };

  return (
    <aside className='inspector' aria-label='Form state'>
      <h3>values</h3>
      <pre>{show(values)}</pre>
      <h3>status.form</h3>
      <pre>{show(status.form)}</pre>
      <h3>checks</h3>
      <pre>{show(checks)}</pre>
    </aside>
  );
}
