import { render } from '@solidjs/web';
import { connectPlayground } from '../../playground-runtime';
import { App } from './app';
import '../../playground.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');

connectPlayground();
render(() => <App />, root);
