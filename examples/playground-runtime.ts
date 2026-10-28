export function connectPlayground(): void {
  const send = (type: string, message?: string) => {
    window.parent.postMessage({ type, message }, location.origin);
  };
  const ready = () => requestAnimationFrame(() => send('oxform-playground-ready'));
  if (document.readyState === 'complete') ready();
  else window.addEventListener('load', ready);
  const format = (value: unknown): string => {
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value, null, 2) ?? String(value);
    } catch {
      return String(value);
    }
  };

  for (const level of ['log', 'info', 'warn', 'error'] as const) {
    const original = console[level].bind(console);
    console[level] = (...values: unknown[]) => {
      original(...values);
      send('oxform-playground-log', values.map(format).join(' '));
    };
  }

  window.addEventListener('error', event => send('oxform-playground-error', event.message));
  window.addEventListener('unhandledrejection', event => send('oxform-playground-error', format(event.reason)));
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== window.parent) return;
    const data: unknown = event.data;
    if (!data || typeof data !== 'object' || !('type' in data) || data.type !== 'oxform-playground-theme') return;
    if (!('stylesheet' in data) || typeof data.stylesheet !== 'string') return;
    const url = new URL(data.stylesheet, location.origin);
    if (url.origin !== location.origin) return;
    let stylesheet = document.querySelector<HTMLLinkElement>('#playground-theme');
    if (!stylesheet) {
      stylesheet = document.createElement('link');
      stylesheet.id = 'playground-theme';
      stylesheet.rel = 'stylesheet';
      document.head.prepend(stylesheet);
    }
    stylesheet.href = url.href;
    document.documentElement.classList.toggle('dark', 'dark' in data && data.dark === true);
  });
}
