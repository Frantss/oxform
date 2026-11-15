import { useState, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { Arrays } from './examples/arrays';
import { AsyncValidation } from './examples/async-validation';
import { Checkout } from './examples/checkout';
import { DraftEditor } from './examples/draft-editor';
import { Login } from './examples/login';
import { Newsletter } from './examples/newsletter';
import { Payment } from './examples/payment';
import { Profile } from './examples/profile';
import { Signup } from './examples/signup';
import './styles.css';

type Example = { id: string; group: string; title: string; summary: string; Component: ComponentType };

const examples: Example[] = [
  {
    id: 'signup',
    group: 'The preset',
    title: 'Signup',
    summary: 'The preset with a Zod schema: errors on change, all errors on submit, a submit result.',
    Component: Signup,
  },
  {
    id: 'login',
    group: 'The preset',
    title: 'Login',
    summary: 'A server error written back into a field from the submit handler.',
    Component: Login,
  },
  {
    id: 'profile',
    group: 'The preset',
    title: 'Profile (status and reset)',
    summary: 'Dirty, touched and default status, a select and a checkbox, reset with options.',
    Component: Profile,
  },
  {
    id: 'arrays',
    group: 'The preset',
    title: 'Team (arrays)',
    summary: 'Scalar and object arrays: every mutation, stable item ids, item errors that follow their item.',
    Component: Arrays,
  },
  {
    id: 'checkout',
    group: 'The preset',
    title: 'Checkout (fragments and scopes)',
    summary: 'One address fragment mounted twice, one block of fields written once and given a scope.',
    Component: Checkout,
  },
  {
    id: 'async-validation',
    group: 'The preset',
    title: 'Async validation',
    summary: 'A username check that asks the server on blur, with the form-wide validating flag.',
    Component: AsyncValidation,
  },
  {
    id: 'payment',
    group: 'Customized forms',
    title: 'Payment (masks)',
    summary:
      'An extension adds a `masks` option and `field.unmasked()`. The input formats as you type, and the submit handler reads the digits.',
    Component: Payment,
  },
  {
    id: 'draft-editor',
    group: 'Customized forms',
    title: 'Draft editor (autosave and warnings)',
    summary:
      'Two extensions stacked: autosave (options, state, api, a status part) and a non-blocking warning check with its own part.',
    Component: DraftEditor,
  },
  {
    id: 'newsletter',
    group: 'Customized forms',
    title: 'Newsletter (lean form)',
    summary: 'A form composed from only the behaviors it needs: no reset, arrays or field handles.',
    Component: Newsletter,
  },
];

const groups = [...new Set(examples.map(example => example.group))];

const initialId = () => examples.find(example => example.id === location.hash.slice(1))?.id ?? examples[0]!.id;

function App() {
  const [activeId, setActiveId] = useState(initialId);
  const active = examples.find(example => example.id === activeId)!;

  const select = (id: string) => {
    location.hash = id;
    setActiveId(id);
  };

  return (
    <div className='shell'>
      <nav aria-label='Examples'>
        <h1>Behavior API</h1>
        {groups.map(group => (
          <section key={group}>
            <h2>{group}</h2>
            <ul>
              {examples
                .filter(example => example.group === group)
                .map(example => (
                  <li key={example.id}>
                    <button type='button' aria-current={example.id === activeId} onClick={() => select(example.id)}>
                      {example.title}
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </nav>
      <main>
        <h2>{active.title}</h2>
        <p className='summary'>{active.summary}</p>
        {/* A new key remounts the example, so every visit starts from the defaults. */}
        <active.Component key={active.id} />
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
