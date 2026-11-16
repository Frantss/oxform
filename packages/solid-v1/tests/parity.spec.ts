import { browserScenarios } from '@oxform/adapter-parity/browser';
import { describe, it } from 'vite-plus/test';
import { driver } from './driver';

/** The scenarios of the Solid 1 risk probe (TK-043). */
const ids = ['P1', 'P8'] as const satisfies readonly (keyof typeof browserScenarios)[];

const setup = () => ({ driver, [Symbol.dispose]() {} });

describe('the parity scenarios', () => {
  it.each(ids.map(id => [id, browserScenarios[id]] as const))('%s', async (_id, scenario) => {
    using subject = setup();

    await scenario.run(subject.driver);
  });
});
