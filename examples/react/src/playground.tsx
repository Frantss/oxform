import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { connectPlayground } from '../../playground-runtime';
import { App } from './app';
import '../../playground.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');

connectPlayground();
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
