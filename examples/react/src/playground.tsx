import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { reactExamples } from './catalog';
import { Example_Array } from './examples/array';
import { Example_Async } from './examples/async';
import { Example_Basic } from './examples/basic';
import { Example_Checks } from './examples/checks';
import { Example_Effect } from './examples/effect';
import { Example_Issues } from './examples/issues';
import { Example_Transform } from './examples/transform';
import { connectPlayground } from '../../playground-runtime';
import './styles.css';
import '../../playground.css';

const components = {
  basic: Example_Basic,
  checks: Example_Checks,
  array: Example_Array,
  async: Example_Async,
  issues: Example_Issues,
  effect: Example_Effect,
  transform: Example_Transform,
};
const selected = new URLSearchParams(location.search).get('example');
const example = reactExamples.find(entry => entry.id === selected) ?? reactExamples[0];
const Example = components[example.id];
const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');

connectPlayground();
createRoot(root).render(
  <StrictMode>
    <main aria-label={example.label}>
      <Example />
    </main>
  </StrictMode>,
);
