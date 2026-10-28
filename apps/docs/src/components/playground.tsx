import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { memo, useEffect, useRef, useState } from 'react';
import { PlaygroundSelect } from '@/components/playground-select';
import type { PlaygroundExample, PlaygroundFramework } from '@/lib/playground';
import { sourceFiles } from '@/lib/playground';
import appCss from '@/styles/app.css?url';

type PlaygroundProps = { framework: PlaygroundFramework; example: PlaygroundExample };

const SourceCode = memo(function SourceCode({ name, code }: { name: string; code: string }) {
  return (
    <DynamicCodeBlock
      lang='tsx'
      code={code}
      codeblock={{
        allowCopy: false,
        className: 'playground-code',
        viewportProps: {
          'aria-label': name + ' source',
          className: 'playground-code-viewport',
        },
      }}
    />
  );
});

export function Playground({ framework, example }: PlaygroundProps) {
  const files = sourceFiles(framework, example.id);
  const [filename, setFilename] = useState(files[0].name);
  const file = files.find(entry => entry.name === filename) ?? files[0];
  const [copyMessage, setCopyMessage] = useState('');
  const [reset, setReset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isScanEnabled, setIsScanEnabled] = useState(false);
  const [scanError, setScanError] = useState('');
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
      if (data.type === 'oxform-playground-scan-error') {
        setIsScanEnabled(false);
        setScanError('React Scan could not load. Toggle it on to try again.');
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
    if (framework !== 'react' || loading) return;
    preview.current?.contentWindow?.postMessage(
      { type: 'oxform-playground-scan', enabled: isScanEnabled },
      location.origin,
    );
  }, [framework, isScanEnabled, loading]);

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
            setScanError('');
            setLogs([]);
            setReset(current => current + 1);
          }}
        >
          Reset demo
        </button>
        <button type='button' onClick={() => void copy(location.href, 'Playground link copied.')}>
          Copy link
        </button>
        {framework === 'react' && (
          <button
            type='button'
            className='playground-scan'
            title='Highlight React component renders in the preview'
            aria-label='React Scan'
            aria-pressed={isScanEnabled}
            disabled={loading}
            onClick={() => {
              setIsScanEnabled(current => !current);
              setScanError('');
            }}
          >
            React Scan: {isScanEnabled ? 'on' : 'off'}
          </button>
        )}
        <span role='status'>{copyMessage}</span>
      </div>
      {scanError && (
        <p className='playground-error' role='alert'>
          {scanError}
        </p>
      )}
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
            <PlaygroundSelect value={file.name} onChange={event => setFilename(event.target.value)}>
              {files.map(entry => (
                <option key={entry.name} value={entry.name}>
                  {entry.name}
                </option>
              ))}
            </PlaygroundSelect>
          </label>
          <SourceCode name={file.name} code={file.code} />
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
