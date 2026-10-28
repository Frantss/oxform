import { createFileRoute } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { Playground } from '@/components/playground';
import { PlaygroundSelect } from '@/components/playground-select';
import { baseOptions } from '@/lib/layout.shared';
import { examplesFor, frameworks, playgroundSearch } from '@/lib/playground';

export const Route = createFileRoute('/playground')({
  ssr: false,
  pendingComponent: () => (
    <main className='playground' role='status'>
      Loading playground…
    </main>
  ),
  validateSearch: playgroundSearch,
  head: () => ({ meta: [{ title: 'Playground | Oxform' }] }),
  component: PlaygroundPage,
});

function PlaygroundPage() {
  const { framework, example } = Route.useSearch();
  const navigate = Route.useNavigate();
  const examples = examplesFor(framework);
  const selected = examples.find(entry => entry.id === example) ?? examples[0];

  return (
    <HomeLayout {...baseOptions(framework === 'react' ? 'react' : 'solid')}>
      <main className='playground'>
        <header className='playground-heading'>
          <h1>Playground</h1>
          <p>Try the forms, inspect their state, and read the source.</p>
        </header>
        <div className='playground-selectors'>
          <label>
            Framework
            <PlaygroundSelect
              value={framework}
              onChange={event => {
                const search = playgroundSearch({ framework: event.target.value });
                void navigate({ search, resetScroll: false });
              }}
            >
              {frameworks.map(entry => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </PlaygroundSelect>
          </label>
          <label>
            Example
            <PlaygroundSelect
              value={selected.id}
              onChange={event => {
                void navigate({ search: { framework, example: event.target.value }, resetScroll: false });
              }}
            >
              {examples.map(entry => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </PlaygroundSelect>
          </label>
        </div>
        <p className='playground-description'>{selected.description}</p>
        <Playground key={framework + '/' + selected.id} framework={framework} example={selected} />
      </main>
    </HomeLayout>
  );
}
