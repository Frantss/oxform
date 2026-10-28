import { init } from 'react-scan/install-hook';

init();

void import('./playground');

let isEnabled = false;
let scanner: Promise<typeof import('react-scan')> | undefined;

window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== window.parent) return;
  const data: unknown = event.data;
  if (!data || typeof data !== 'object' || !('type' in data) || data.type !== 'oxform-playground-scan') return;
  if (!('enabled' in data) || typeof data.enabled !== 'boolean') return;
  isEnabled = data.enabled;
  if (!isEnabled && !scanner) return;

  scanner ??= import('react-scan').then(module => {
    module.scan({
      enabled: true,
      showToolbar: false,
      allowInIframe: true,
      dangerouslyForceRunInProduction: true,
    });
    return module;
  });
  void scanner
    .then(module => {
      module.setOptions({ enabled: isEnabled, showToolbar: false });
    })
    .catch(() => {
      scanner = undefined;
      window.parent.postMessage({ type: 'oxform-playground-scan-error' }, location.origin);
    });
});
