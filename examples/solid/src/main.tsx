import { App } from '#app';
import { render } from 'solid-js/web';
import '#styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');
render(() => <App />, root);
