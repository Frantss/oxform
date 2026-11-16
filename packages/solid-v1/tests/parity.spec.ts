import { browserScenarios } from '@oxform/adapter-parity/browser';
import { describe, it } from 'vite-plus/test';
import { driver } from './driver';

const setup = () => ({ driver, [Symbol.dispose]() {} });

describe('the parity scenarios', () => {
  it.each(Object.entries(browserScenarios))('%s', async (_id, scenario) => {
    using subject = setup();

    await scenario.run(subject.driver);
  });
});
