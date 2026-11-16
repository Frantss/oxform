// The depth guard (03-testing.md, "Depth guard"): long chains and large values compile without
// "Type instantiation is excessively deep". The file has no negative case.
import {
  defineExtension,
  defineForm,
  option,
  type ArrayItem,
  type ArrayPath,
  type ArrayValue,
  type Extendable,
  type Form,
  type ObjectPath,
  type PartsOf,
  type Path,
  type PathValue,
} from '@oxform/core';
import type { PartsFromSlots } from '@oxform/core/adapter';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expectTypeOf, it } from 'vite-plus/test';

/** Sixty fields: strings, nested objects and arrays of objects. */
type Large = {
  field1: string;
  field2: string;
  field3: string;
  field4: string;
  field5: string;
  field6: string;
  field7: string;
  field8: string;
  field9: string;
  field10: string;
  field11: string;
  field12: string;
  field13: string;
  field14: string;
  field15: string;
  field16: string;
  field17: string;
  field18: string;
  field19: string;
  field20: string;
  field21: string;
  field22: string;
  field23: string;
  field24: string;
  field25: string;
  field26: string;
  field27: string;
  field28: string;
  field29: string;
  field30: string;
  field31: string;
  field32: string;
  field33: string;
  field34: string;
  field35: string;
  field36: string;
  field37: string;
  field38: string;
  field39: string;
  field40: string;
  group1: { name: string; count: number; nested: { flag: boolean; when: Date } };
  group2: { name: string; count: number; nested: { flag: boolean; when: Date } };
  group3: { name: string; count: number; nested: { flag: boolean; when: Date } };
  group4: { name: string; count: number; nested: { flag: boolean; when: Date } };
  group5: { name: string; count: number; nested: { flag: boolean; when: Date } };
  group6: { name: string; count: number; nested: { flag: boolean; when: Date } };
  group7: { name: string; count: number; nested: { flag: boolean; when: Date } };
  group8: { name: string; count: number; nested: { flag: boolean; when: Date } };
  group9: { name: string; count: number; nested: { flag: boolean; when: Date } };
  group10: { name: string; count: number; nested: { flag: boolean; when: Date } };
  list1: { id: string; tags: string[] }[];
  list2: { id: string; tags: string[] }[];
  list3: { id: string; tags: string[] }[];
  list4: { id: string; tags: string[] }[];
  list5: { id: string; tags: string[] }[];
  list6: { id: string; tags: string[] }[];
  list7: { id: string; tags: string[] }[];
  list8: { id: string; tags: string[] }[];
  list9: { id: string; tags: string[] }[];
  list10: { id: string; tags: string[] }[];
};

const large = defineForm({ schema: {} as StandardSchemaV1<Large>, defaultValues: {} as Large });

const alpha = <Values,>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'alpha',
    options: { alphaLimit: option.number() },
    state: () => ({ alphaCount: 0 }),
    api: context => ({ alpha: () => context.state.alphaCount.get() }),
    slots: slot => ({ alphaPart: slot({ element: 'span', props: { name: 'key' }, state: () => ({ alpha: true }) }) }),
  });
const beta = <Values,>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'beta',
    options: { betaLimit: option.number() },
    state: () => ({ betaCount: 1 }),
    api: context => ({ beta: () => context.state.betaCount.get() }),
    slots: slot => ({ betaPart: slot({ element: 'span', props: { name: 'key' }, state: () => ({ beta: true }) }) }),
  });
const gamma = <Values,>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'gamma',
    options: { gammaLimit: option.number() },
    state: () => ({ gammaCount: 2 }),
    api: context => ({ gamma: () => context.state.gammaCount.get() }),
    slots: slot => ({ gammaPart: slot({ element: 'span', props: { name: 'key' }, state: () => ({ gamma: true }) }) }),
  });
const delta = <Values,>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'delta',
    options: { deltaLimit: option.number() },
    state: () => ({ deltaCount: 3 }),
    api: context => ({ delta: () => context.state.deltaCount.get() }),
    slots: slot => ({ deltaPart: slot({ element: 'span', props: { name: 'key' }, state: () => ({ delta: true }) }) }),
  });
const epsilon = <Values,>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'epsilon',
    options: { epsilonLimit: option.number() },
    state: () => ({ epsilonCount: 4 }),
    api: context => ({ epsilon: () => context.state.epsilonCount.get() }),
    slots: slot => ({
      epsilonPart: slot({ element: 'span', props: { name: 'key' }, state: () => ({ epsilon: true }) }),
    }),
  });
const zeta = <Values,>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'zeta',
    options: { zetaLimit: option.number() },
    state: () => ({ zetaCount: 5 }),
    api: context => ({ zeta: () => context.state.zetaCount.get() }),
    slots: slot => ({ zetaPart: slot({ element: 'span', props: { name: 'key' }, state: () => ({ zeta: true }) }) }),
  });
const eta = <Values,>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'eta',
    options: { etaLimit: option.number() },
    state: () => ({ etaCount: 6 }),
    api: context => ({ eta: () => context.state.etaCount.get() }),
    slots: slot => ({ etaPart: slot({ element: 'span', props: { name: 'key' }, state: () => ({ eta: true }) }) }),
  });
const theta = <Values,>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'theta',
    options: { thetaLimit: option.number() },
    state: () => ({ thetaCount: 7 }),
    api: context => ({ theta: () => context.state.thetaCount.get() }),
    slots: slot => ({ thetaPart: slot({ element: 'span', props: { name: 'key' }, state: () => ({ theta: true }) }) }),
  });
const iota = <Values,>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'iota',
    options: { iotaLimit: option.number() },
    state: () => ({ iotaCount: 8 }),
    api: context => ({ iota: () => context.state.iotaCount.get() }),
    slots: slot => ({ iotaPart: slot({ element: 'span', props: { name: 'key' }, state: () => ({ iota: true }) }) }),
  });

/** A preset that applies the nine extensions inside a chain. */
const nine = <Values, Api extends {}, Options, State extends {}, Slots, Fields>(
  form: Form<Values, Api, Options, State, Slots, Fields>,
) =>
  form
    .extend(alpha)
    .extend(beta)
    .extend(gamma)
    .extend(delta)
    .extend(epsilon)
    .extend(zeta)
    .extend(eta)
    .extend(theta)
    .extend(iota);

describe('depth guard', () => {
  it('compiles a chain of nine extensions', () => {
    const form = large
      .extend(alpha)
      .extend(beta)
      .extend(gamma)
      .extend(delta)
      .extend(epsilon)
      .extend(zeta)
      .extend(eta)
      .extend(theta)
      .extend(iota);

    expectTypeOf(form.create().iota()).toEqualTypeOf<number>();
  });

  it('compiles a preset of nine extensions inside a chain', () => {
    const extension = <Values,>(form: Extendable<Values>) =>
      defineExtension(form, { name: 'last', api: () => ({ last: true as const }) });
    const form = large.extend(nine).extend(extension);

    expectTypeOf(form.configure({ alphaLimit: 1, iotaLimit: 9 }).create().last).toEqualTypeOf<true>();
  });

  it('types the paths of sixty fields', () => {
    expectTypeOf<PathValue<Large, 'group10.nested.when'>>().toEqualTypeOf<Date>();
    expectTypeOf<ArrayItem<Large, 'list10'>>().toEqualTypeOf<{ id: string; tags: string[] }>();
    expectTypeOf<ArrayValue<Large, 'list3.0.tags'>>().toEqualTypeOf<string[]>();
    expectTypeOf<'list10.0.tags.0'>().toExtend<Path<Large>>();
    expectTypeOf<'group1.nested'>().toExtend<ObjectPath<Large>>();
    expectTypeOf<'list1'>().toExtend<ArrayPath<Large>>();
  });

  it('types every part of the chain', () => {
    const form = large.extend(nine);

    expectTypeOf<keyof PartsOf<typeof form>>().toEqualTypeOf<
      | 'alphaPart'
      | 'betaPart'
      | 'gammaPart'
      | 'deltaPart'
      | 'epsilonPart'
      | 'zetaPart'
      | 'etaPart'
      | 'thetaPart'
      | 'iotaPart'
    >();
    expectTypeOf<PartsOf<typeof form>['iotaPart']['state']>().toEqualTypeOf<{ iota: boolean }>();
    expectTypeOf<PartsFromSlots<{}>>().toEqualTypeOf<{}>();
  });
});
