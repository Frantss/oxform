import { useEffect, useRef, useState } from 'react';
import type { PlaygroundExample, PlaygroundFramework } from '@/lib/playground';
import { sourceFiles } from '@/lib/playground';
import appCss from '@/styles/app.css?url';

type PlaygroundProps = { framework: PlaygroundFramework; example: PlaygroundExample };

export function Playground({ framework, example }: PlaygroundProps) {
  const files = sourceFiles(framework, example.id);
  const [filename, setFilename] = useState(files[0].name);
  const file = files.find(entry => entry.name === filename) ?? files[0];
  const [copyMessage, setCopyMessage] = useState('');
  const [reset, setReset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const preview = useRef<HTMLIFrameElement>(null);

  const syncTheme = () => {
    const frame = preview.current;
    if (!frame || frame.contentDocument?.location.origin !== window.location.origin) return;
    frame.contentWindow?.postMessage(
      {
        type: 'oxform-playground-theme',
        dark: document.documentElement.classList.contains('dark'),
        stylesheet: appCss,
      },
      window.location.origin,
    );
  };

  useEffect(() => {
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const receive = (event: MessageEvent<unknown>) => {
      if (event.origin !== location.origin || event.source !== preview.current?.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== 'object' || !('type' in data)) return;
      if (data.type === 'oxform-playground-ready') {
        syncTheme();
        setLoading(false);
      }
      if (!('message' in data) || typeof data.message !== 'string') return;
      if (data.type === 'oxform-playground-log') {
        const message = data.message.slice(0, 20000);
        setLogs(current => [...current.slice(-49), message]);
      }
      if (data.type === 'oxform-playground-error') {
        setError(data.message);
        setLoading(false);
      }
    };
    window.addEventListener('message', receive);
    return () => {
      observer.disconnect();
      window.removeEventListener('message', receive);
    };
  }, []);

  useEffect(() => {
    if (!loading) return;
    const timeout = window.setTimeout(() => {
      setError('The preview did not load. Reload the demo to try again.');
      setLoading(false);
    }, 15000);
    return () => window.clearTimeout(timeout);
  }, [loading, reset]);

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(message);
    } catch {
      setCopyMessage('Copy failed. Select and copy the source or address manually.');
    }
  };

  return (
    <>
      <div className='playground-actions'>
        <button
          type='button'
          onClick={() => {
            setLoading(true);
            setError('');
            setLogs([]);
            setReset(current => current + 1);
          }}
        >
          Reset demo
        </button>
        <button type='button' onClick={() => void copy(location.href, 'Playground link copied.')}>
          Copy link
        </button>
        <span role='status'>{copyMessage}</span>
      </div>
      <div className='playground-panels'>
        <section className='playground-preview' aria-labelledby='preview-title' aria-busy={loading}>
          <div className='playground-panel-heading'>
            <h2 id='preview-title'>Preview</h2>
            {loading && <span role='status'>Loading demo…</span>}
          </div>
          {error && (
            <p className='playground-error' role='alert'>
              {error}
            </p>
          )}
          <iframe
            key={reset}
            ref={preview}
            title={example.label + ' live preview'}
            src={'/playground/demos/' + framework + '/playground.html?example=' + example.id}
            onLoad={syncTheme}
          />
        </section>
        <section className='playground-source' aria-labelledby='source-title'>
          <div className='playground-panel-heading'>
            <h2 id='source-title'>Source</h2>
            <button type='button' onClick={() => void copy(file.code, 'Source copied.')}>
              Copy source
            </button>
          </div>
          <label className='playground-file'>
            File
            <select value={file.name} onChange={event => setFilename(event.target.value)}>
              {files.map(entry => (
                <option key={entry.name} value={entry.name}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          <pre tabIndex={0} aria-label={file.name + ' source'}>
            <code>{file.code}</code>
          </pre>
        </section>
      </div>
      <section className='playground-console' aria-labelledby='console-title'>
        <div className='playground-panel-heading'>
          <h2 id='console-title'>Demo console</h2>
          <button type='button' disabled={logs.length === 0} onClick={() => setLogs([])}>
            Clear console
          </button>
        </div>
        {logs.length === 0 ? (
          <p>Submit a form or interact with the demo to see its console output here.</p>
        ) : (
          <ol>
            {logs.map((message, index) => (
              <li key={index}>
                <pre>{message}</pre>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
