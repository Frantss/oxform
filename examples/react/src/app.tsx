import { useState } from 'react';
import { exampleOf, examples } from './examples';

/** The five domain forms, one at a time. The id of the shown form is in the address, as in the playground. */
export const App = () => {
  const [id, setId] = useState(() => new URLSearchParams(location.search).get('example'));
  const { Component, label } = exampleOf(id);
  const show = (next: string) => {
    history.replaceState(null, '', `?example=${next}`);
    setId(next);
  };

  return (
    <>
      <nav aria-label='Examples'>
        {examples.map(example => (
          <button
            key={example.id}
            type='button'
            aria-current={example.label === label || undefined}
            onClick={() => show(example.id)}
          >
            {example.label}
          </button>
        ))}
      </nav>
      <main>
        <h1>{label}</h1>
        <Component />
      </main>
    </>
  );
};
