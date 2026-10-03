import { HydrationForm } from '#hydration-fixture';
import { writeFileSync } from 'node:fs';
import { generateHydrationScript, renderToString } from '@solidjs/web';
import { expect, it, vi } from 'vite-plus/test';

it('should render hydration markup without serializing core APIs or DOM refs', () => {
  const onError = vi.fn();
  const html = generateHydrationScript() + renderToString(() => <HydrationForm />, { renderId: 'oxform', onError });
  expect(html).toContain('value="Ada"');
  expect(html).toContain('hydrated-name');
  expect(onError).not.toHaveBeenCalled();
  writeFileSync(new URL('../tests/fixtures/hydration.html', import.meta.url), html);
});
