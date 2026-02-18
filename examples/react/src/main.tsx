import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Example_Basic } from './basic';
import { Example_Effect } from './effect';

const Main = () => {
  const [example, setExample] = useState('basic');

  return (
    <div>
      <button onClick={() => setExample('basic')}>Basic</button>
      <button onClick={() => setExample('effect')}>Effect</button>
      <Example example={example} />
    </div>
  );
};

const Example = ({ example }: { example: string }) => {
  switch (example) {
    case 'basic':
      return <Example_Basic />;
    case 'effect':
      return <Example_Effect />;
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Main />
  </StrictMode>,
);
