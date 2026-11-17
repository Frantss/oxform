import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { connectPlayground } from '../../playground-runtime';
import { exampleOf } from './examples';
import '../../playground.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');

const { Component, label } = exampleOf(new URLSearchParams(location.search).get('example'));

connectPlayground();
createRoot(root).render(
  <StrictMode>
    <main>
      <h1>{label}</h1>
      <Component />
    </main>
  </StrictMode>,
);
