import { App } from '#app';
import { render } from '@solidjs/web';
import { connectPlayground } from '../../playground-runtime';
import '#styles.css';
import '../../playground.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');
connectPlayground();
render(() => <App />, root);
