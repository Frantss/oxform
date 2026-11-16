import { browserScenarios } from '@oxform/adapter-parity/browser';
import { describe, it } from 'vite-plus/test';
import { driver } from './driver';

/** The scenarios that the React adapter runs so far. */
const ids = ['P1', 'P1 bare', 'P2', 'P3', 'P4', 'P6', 'P7', 'P8', 'P9'] as const satisfies readonly (keyof typeof browserScenarios)[];

const setup = () => ({ driver, [Symbol.dispose]() {} });

describe('the parity scenarios', () => {
  it.each(ids.map(id => [id, browserScenarios[id]] as const))('%s', async (_id, scenario) => {
    using subject = setup();

    await scenario.run(subject.driver);
  });
});
