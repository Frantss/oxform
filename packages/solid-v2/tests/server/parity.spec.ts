import { serverScenarios } from '@oxform/adapter-parity/server';
import { describe, it } from 'vite-plus/test';
import { driver } from './driver';

const setup = () => ({ driver, [Symbol.dispose]() {} });

describe('the server parity scenarios', () => {
  it.each(Object.entries(serverScenarios))('%s', async (_id, scenario) => {
    using subject = setup();

    await scenario.run(subject.driver);
  });
});
