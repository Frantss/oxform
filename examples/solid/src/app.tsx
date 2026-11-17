import { createSignal, For } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { exampleOf, examples } from './examples';

/** The five domain forms, one at a time. The id of the shown form is in the address, as in the playground. */
export const App = () => {
  const [id, setId] = createSignal(new URLSearchParams(location.search).get('example'));
  const shown = () => exampleOf(id());
  const show = (next: string) => {
    history.replaceState(null, '', `?example=${next}`);
    setId(next);
  };

  return (
    <>
      <nav aria-label='Examples'>
        <For each={examples}>
          {example => (
            <button type='button' aria-current={example === shown() || undefined} onClick={() => show(example.id)}>
              {example.label}
            </button>
          )}
        </For>
      </nav>
      <main>
        <h1>{shown().label}</h1>
        <Dynamic component={shown().Component} />
      </main>
    </>
  );
};
