import type { StandardSchemaV1 } from '@standard-schema/spec';
import { configureForm } from './form';
import { standardForm } from './standard';

export type Profile = { name: string; tags: string[]; address: { city: string } };

export const defaultProfile: Profile = { name: '', tags: ['a', 'b', 'c'], address: { city: '' } };

/** A schema that accepts anything and carries `Values` for inference. */
export const schemaOf = <Values>(): StandardSchemaV1<Values> => ({
  '~standard': { version: 1, vendor: 'spike', validate: value => ({ value: value as Values }) },
});

type Issue = { message: string; path?: (PropertyKey | { key: PropertyKey })[] };

export const failing = (...issues: Issue[]): StandardSchemaV1<any> => ({
  '~standard': { version: 1, vendor: 'spike', validate: () => ({ issues }) },
});

/** A schema whose result is released by the test. */
export const deferred = (issues: Issue[] = []) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => (release = resolve));
  const schema: StandardSchemaV1<any> = {
    '~standard': { version: 1, vendor: 'spike', validate: async () => (await gate, { issues }) },
  };
  return { schema, release };
};

export const createProfileForm = (options: Partial<Parameters<typeof configureForm<any, Profile>>[1]> = {}) =>
  configureForm(standardForm, {
    schema: schemaOf<Profile>(),
    defaultValues: defaultProfile,
    id: 'profile',
    ...options,
  })();

/** A stand-in for a DOM element that records focus and blur. */
export const fakeElement = () => {
  const calls: string[] = [];
  return {
    calls,
    element: { focus: () => calls.push('focus'), blur: () => calls.push('blur') } as unknown as HTMLElement,
  };
};
