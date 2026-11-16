import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { connectPlayground } from '../../playground-runtime';
import '../../playground.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');

connectPlayground();
createRoot(root).render(
  <StrictMode>
    <main>The examples are being rewritten for Oxform 0.7.0.</main>
  </StrictMode>,
);
