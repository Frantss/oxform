import type { StandardSchemaV1 } from '@standard-schema/spec';
import { defineExtension, defineForm, type Slot, type Updater } from '@oxform/core';
import {
  arrays,
  check,
  events,
  reset,
  rootSlots,
  type ArrayOperations,
  type ArraysApi,
  type EventsApi,
  type ResetApi,
  type ResetOptions,
  type FieldChangeOptions,
  type FieldFocusOptions,
  status,
  submit,
  validation,
  type FieldStatus,
  type FieldStatusDefaults,
  type FormStatus,
  type FormStatusDefaults,
  type StatusApi,
  type SubmitApi,
  type SubmitAttempt,
  type SubmitResult,
  type StatusState,
  type CheckApi,
  type CheckEntry,
  type CheckOptions,
  type CheckSetMode,
  type CheckState,
  type CheckSugar,
  values,
  type CheckValidator,
  type CheckValidators,
  type IssuesByCheck,
  type ValidationApi,
  type ValidationEvent,
  type ValidationRun,
  type ValidationRunOptions,
  type ValidatorInput,
  type Change,
  type ChangeApi,
  type ChangeDetails,
  type ChangeDetailsInput,
  type ChangeInterceptor,
  type ChangeListener,
  type ChangeReason,
  type ChangeSource,
  type ValuesApi,
} from '@oxform/core/behaviors';
import { describe, expectTypeOf, it } from 'vite-plus/test';

type Profile = { name: string; address: { city: string } };

const form = defineForm({
  schema: {} as StandardSchemaV1<Profile>,
  defaultValues: { name: '', address: { city: '' } },
});

/** Accepts a value of the given type. A negative case calls it with a value of another type. */
const accepts = <Type>(value: Type): Type => value;

describe('values', () => {
  it('adds the values api and the values state', () => {
    const instance = form.extend(values).create();

    expectTypeOf(instance.values).toEqualTypeOf<ValuesApi<Profile>>();
    expectTypeOf(instance.store.state.values).toEqualTypeOf<Profile>();
  });

  it('takes a form', () => {
    // @ts-expect-error values takes a form.
    values('form');
  });
});

describe('rootSlots', () => {
  it('is a slot group', () => {
    expectTypeOf(rootSlots).returns.toHaveProperty('root').toExtend<Slot<{}, {}, 'form'>>();
  });

  it('takes a slot factory', () => {
    // @ts-expect-error A slot group takes a slot factory.
    rootSlots({});
  });
});

describe('ValuesApi', () => {
  const instance = form.extend(values).create();

  it('types a read and a write by path', () => {
    expectTypeOf(instance.values.get('address.city')).toEqualTypeOf<string>();
    expectTypeOf(instance.values.set('name', current => `${current}!`)).toEqualTypeOf<boolean>();
  });

  it('rejects a path that the values do not have', () => {
    // @ts-expect-error Profile has no phone.
    instance.values.get('phone');
  });

  it('rejects a value of the wrong type', () => {
    // @ts-expect-error name is a string.
    instance.values.set('name', 1);
  });
});

describe('Change, ChangeInterceptor', () => {
  it('lets an interceptor return a replacement change or nothing', () => {
    expectTypeOf<ReturnType<ChangeInterceptor<Profile>>>().toEqualTypeOf<Change<Profile> | void>();
  });

  it('rejects a change at a path that the values do not have', () => {
    // @ts-expect-error Profile has no phone.
    accepts<Change<Profile>>({ path: 'phone', value: '' });
  });
});

describe('ChangeListener', () => {
  it('gets the change and the details', () => {
    expectTypeOf<Parameters<ChangeListener<Profile>>>().toEqualTypeOf<[Change<Profile>, ChangeDetails]>();
  });

  it('returns nothing', () => {
    // @ts-expect-error A listener takes a change.
    accepts<ChangeListener<Profile>>((change: number) => change);
  });
});

describe('ChangeApi', () => {
  it('runs a change with a write', () => {
    expectTypeOf<ChangeApi<Profile>['run']>().returns.toEqualTypeOf<boolean>();
  });

  it('rejects a write that does not report a change', () => {
    const change = {} as ChangeApi<Profile>;
    // @ts-expect-error The write returns whether it changed the values.
    change.run({ path: 'name', value: '' }, () => undefined);
  });
});

describe('ChangeDetails, ChangeDetailsInput, ChangeReason', () => {
  it('takes a reason as input and gives it with the cancel state', () => {
    expectTypeOf<ChangeDetailsInput['reason']>().toEqualTypeOf<ChangeReason | undefined>();
    expectTypeOf<ChangeDetails['canceled']>().toEqualTypeOf<boolean>();
  });

  it('takes no source or event since G15', () => {
    // @ts-expect-error The details input has a reason only.
    accepts<ChangeDetailsInput>({ reason: 'input', source: 'mouse' });
  });

  it('rejects a reason that is not a string', () => {
    // @ts-expect-error A reason is a string.
    accepts<ChangeReason>(1);
  });
});

describe('ChangeSource', () => {
  it('names the source of a change', () => {
    expectTypeOf<'keyboard'>().toExtend<ChangeSource>();
  });

  it('rejects a source that is not in the list', () => {
    // @ts-expect-error A source is one of the listed names.
    accepts<ChangeSource>('voice');
  });
});

describe('validation', () => {
  it('adds the validation api and the validating state', () => {
    const instance = form.extend(values).extend(validation).create();

    expectTypeOf(instance.validation).toEqualTypeOf<ValidationApi<Profile, never>>();
    expectTypeOf(instance.store.state.validating).toEqualTypeOf<number>();
  });

  it('needs values', () => {
    // @ts-expect-error validation needs values.
    form.extend(validation);
  });
});

describe('ValidationApi, ValidationRunOptions', () => {
  const instance = form.extend(values).extend(validation).create();

  it('runs a path, a list or the whole form, with an event', () => {
    expectTypeOf(instance.validation.run(['name', 'address.city'], { type: 'blur' })).resolves.toEqualTypeOf<
      readonly [valid: boolean, issues: IssuesByCheck<never>]
    >();
  });

  it('rejects a target that the values do not have', () => {
    // @ts-expect-error Profile has no phone.
    void instance.validation.run('phone');
  });

  it('rejects an option type that is not an event', () => {
    // @ts-expect-error The type is an event.
    accepts<ValidationRunOptions>({ type: 'hover' });
  });
});

describe('ValidationRun, IssuesByCheck', () => {
  it('gives the issues by check name', () => {
    expectTypeOf<ValidationRun<'error'>['issues']>().toEqualTypeOf<IssuesByCheck<'error'>>();
  });

  it('rejects issues without the entries of a check', () => {
    // @ts-expect-error IssuesByCheck<'error'> has an `error` list.
    accepts<IssuesByCheck<'error'>>({});
  });
});

describe('ValidationEvent', () => {
  it('names the events of a validator', () => {
    expectTypeOf<ValidationEvent>().toEqualTypeOf<'change' | 'blur' | 'focus' | 'submit'>();
  });

  it('rejects another event', () => {
    // @ts-expect-error A validation event is change, blur, focus or submit.
    accepts<ValidationEvent>('input');
  });
});

describe('ValidatorInput, CheckValidator, CheckValidators', () => {
  it('gives a validator function the values only (G2)', () => {
    expectTypeOf<ValidatorInput<Profile>>().toEqualTypeOf<{ readonly values: Profile }>();
    expectTypeOf<Extract<CheckValidator<Profile>, Function>>().parameters.toEqualTypeOf<[ValidatorInput<Profile>]>();
  });

  it('reads no status in a validator function', () => {
    // @ts-expect-error The input has the values only.
    accepts<CheckValidators<Profile>>({ change: input => input.status });
  });

  it('rejects a validator for another event', () => {
    // @ts-expect-error The validators are by validation event.
    accepts<CheckValidators<Profile>>({ input: {} as StandardSchemaV1<Profile> });
  });
});

describe('check', () => {
  const checked = form.extend(values).extend(validation).extend(check('error')).extend(check('warning'));

  it('types the api member and the option of each name', () => {
    const instance = checked.create({ error: { change: {} as StandardSchemaV1<Profile> }, warning: {} });

    expectTypeOf(instance.error).toEqualTypeOf<CheckApi<Profile, 'error'>>();
    expectTypeOf(instance.warning).toEqualTypeOf<CheckApi<Profile, 'warning'>>();
  });

  it('types the check names of the validation api from the chain (D21)', () => {
    expectTypeOf(checked.create().validation.issues()).toEqualTypeOf<IssuesByCheck<'error' | 'warning'>>();
  });

  it('rejects an option of the check that is not a validator record', () => {
    // @ts-expect-error The `error` option holds validators by event.
    checked.create({ error: 'required' });
  });

  it('needs validation', () => {
    // @ts-expect-error check needs validation.
    form.extend(values).extend(check('error'));
  });
});

describe('CheckApi, CheckSetMode', () => {
  const instance = form.extend(values).extend(validation).extend(check('error')).create();

  it('reads and writes a path or the root', () => {
    expectTypeOf(instance.error.at('')).toEqualTypeOf<readonly CheckEntry[]>();
    expectTypeOf<Parameters<typeof instance.error.set>>().toEqualTypeOf<
      [
        path: 'address' | 'address.city' | 'name' | '',
        entries: readonly CheckEntry[],
        options?: { readonly mode?: CheckSetMode },
      ]
    >();
  });

  it('rejects a path that the values do not have', () => {
    // @ts-expect-error Profile has no phone.
    instance.error.at('phone');
  });

  it('rejects another set mode', () => {
    // @ts-expect-error The modes are replace, append and keep.
    accepts<CheckSetMode>('merge');
  });
});

describe('CheckOptions', () => {
  it('takes blocking and exclusive', () => {
    expectTypeOf<CheckOptions>().toEqualTypeOf<{ readonly blocking?: boolean; readonly exclusive?: boolean }>();
  });

  it('rejects another option', () => {
    // @ts-expect-error A check takes blocking and exclusive.
    check('error', { required: true });
  });
});

describe('CheckEntry, CheckState', () => {
  it('holds a Standard Schema issue with the event, by path', () => {
    expectTypeOf<CheckEntry['type']>().toEqualTypeOf<ValidationEvent | undefined>();
    expectTypeOf<CheckState>().toEqualTypeOf<Readonly<Record<string, readonly CheckEntry[]>>>();
  });

  it('needs a message', () => {
    // @ts-expect-error An issue has a message.
    accepts<CheckEntry>({ type: 'change' });
  });

  it('holds lists of entries', () => {
    // @ts-expect-error The state holds lists of entries.
    accepts<CheckState>({ email: { message: 'a' } });
  });
});

describe('CheckSugar', () => {
  it('reads and sets the entries of each check on a field', () => {
    expectTypeOf<keyof CheckSugar<'error'>>().toEqualTypeOf<'error' | 'setError'>();
  });

  it('rejects a set without entries', () => {
    const sugar = {} as CheckSugar<'error'>;
    // @ts-expect-error setError takes the entries.
    sugar.setError();
  });
});

describe('status', () => {
  const statused = form.extend(values).extend(status);

  it('adds the status api and the derived status state', () => {
    const instance = statused.create();

    expectTypeOf(instance.status).toEqualTypeOf<StatusApi<Profile>>();
    expectTypeOf(instance.store.state.status).toEqualTypeOf<StatusState>();
  });

  it('keys defaultFieldStatus by path or the wildcard (G8)', () => {
    expectTypeOf(
      statused.create({ defaultFieldStatus: { '*': { touched: true }, 'address.city': {} } }).status,
    ).toEqualTypeOf<StatusApi<Profile>>();
  });

  it('rejects a defaultFieldStatus path that the values do not have', () => {
    // @ts-expect-error Profile has no phone.
    statused.create({ defaultFieldStatus: { phone: { touched: true } } });
  });

  it('needs values', () => {
    // @ts-expect-error status needs values.
    form.extend(status);
  });
});

describe('StatusApi', () => {
  const instance = form.extend(values).extend(status).create();

  it('reads the form and a field', () => {
    expectTypeOf(instance.status.form).toEqualTypeOf<FormStatus>();
    expectTypeOf(instance.status.at('address.city')).toEqualTypeOf<FieldStatus>();
  });

  it('rejects a path that the values do not have', () => {
    // @ts-expect-error Profile has no phone.
    instance.status.at('phone');
  });
});

describe('StatusState, FieldStatus, FormStatus', () => {
  it('holds the form and the fields by path', () => {
    expectTypeOf<StatusState['fields']>().toEqualTypeOf<Readonly<Record<string, FieldStatus>>>();
    expectTypeOf<FormStatus['successful']>().toEqualTypeOf<boolean | null>();
  });

  it('rejects a field status without its flags', () => {
    // @ts-expect-error A field status has every flag.
    accepts<FieldStatus>({ dirty: true });
  });

  it('rejects a form status without its flags', () => {
    // @ts-expect-error A form status has every flag.
    accepts<StatusState>({ form: { valid: true }, fields: {} });
  });
});

describe('FormStatusDefaults, FieldStatusDefaults', () => {
  it('takes the flags that a default can set', () => {
    expectTypeOf<keyof FormStatusDefaults>().toEqualTypeOf<'dirty' | 'submits' | 'successful'>();
    expectTypeOf<keyof FieldStatusDefaults>().toEqualTypeOf<'dirty' | 'touched' | 'blurred'>();
  });

  it('rejects a derived flag as a form default', () => {
    // @ts-expect-error `valid` is derived.
    accepts<FormStatusDefaults>({ valid: true });
  });

  it('rejects a derived flag as a field default', () => {
    // @ts-expect-error `pristine` is derived.
    accepts<FieldStatusDefaults>({ pristine: true });
  });
});

describe('events', () => {
  it('adds the events api', () => {
    expectTypeOf(form.extend(values).extend(status).extend(events).create().events).toEqualTypeOf<EventsApi<Profile>>();
  });

  it('needs values', () => {
    // @ts-expect-error events needs values.
    form.extend(events);
  });

  it('needs status', () => {
    // @ts-expect-error events needs status.
    form.extend(values).extend(events);
  });
});

describe('EventsApi, FieldChangeOptions', () => {
  const instance = form.extend(values).extend(status).extend(events).create();

  it('types a change by path, with its options', () => {
    const change: (path: 'name', updater: Updater<string>, options?: FieldChangeOptions) => void = (...args) =>
      instance.events.change(...args);

    expectTypeOf(change).returns.toBeVoid();
  });

  it('rejects a value of the wrong type', () => {
    // @ts-expect-error name is a string.
    instance.events.change('name', 1);
  });

  it('rejects a should flag that change does not have', () => {
    // @ts-expect-error The change flags are dirty, touch and validate.
    accepts<FieldChangeOptions>({ should: { blur: true } });
  });
});

describe('FieldFocusOptions', () => {
  it('takes should.validate', () => {
    expectTypeOf<NonNullable<FieldFocusOptions['should']>>().toEqualTypeOf<{ readonly validate?: boolean }>();
  });

  it('rejects should.dirty', () => {
    // @ts-expect-error focus and blur take validate only.
    accepts<FieldFocusOptions>({ should: { dirty: true } });
  });
});

type Listed = { tags: string[]; people: { name: string }[] };

const listed = defineForm({ schema: {} as StandardSchemaV1<Listed>, defaultValues: { tags: [], people: [] } });

describe('arrays', () => {
  it('adds the arrays api', () => {
    expectTypeOf(listed.extend(values).extend(status).extend(arrays).create().arrays).toEqualTypeOf<
      ArraysApi<Listed>
    >();
  });

  it('needs values', () => {
    // @ts-expect-error arrays needs values.
    listed.extend(arrays);
  });

  it('needs status', () => {
    // @ts-expect-error arrays needs status.
    listed.extend(values).extend(arrays);
  });
});

describe('ArraysApi', () => {
  const instance = listed.extend(values).extend(status).extend(arrays).create();

  it('takes an item of the array, and an updater for update and replace', () => {
    const update: (path: 'people', index: number, item: Updater<{ name: string }>) => void = (...args) =>
      instance.arrays.update(...args);

    expectTypeOf(update).returns.toBeVoid();
  });

  it('rejects a path that is not an array', () => {
    // @ts-expect-error `people.0.name` is not an array.
    instance.arrays.append('people.0.name', 'a');
  });

  it('rejects an updater as an inserted item', () => {
    // @ts-expect-error append takes an item, not an updater (01-public-api.md, 8).
    instance.arrays.append('tags', (current: string) => current);
  });
});

describe('ArrayOperations', () => {
  it('has the operations of one array, without the path', () => {
    expectTypeOf<Parameters<ArrayOperations<string, string[]>['append']>>().toEqualTypeOf<
      [item: string, options?: FieldChangeOptions]
    >();
  });

  it('rejects an item of another type', () => {
    const operations = {} as ArrayOperations<string, string[]>;
    // @ts-expect-error The items are strings.
    operations.append(1);
  });
});

describe('reset', () => {
  const chain = form.extend(values).extend(status).extend(events);

  it('adds the reset api', () => {
    expectTypeOf(chain.extend(reset).create().reset).toEqualTypeOf<ResetApi<Profile>>();
  });

  it('needs values', () => {
    // @ts-expect-error reset needs values.
    form.extend(reset);
  });

  it('needs status', () => {
    // @ts-expect-error reset needs status.
    form.extend(values).extend(reset);
  });

  it('needs events', () => {
    // @ts-expect-error reset needs events.
    form.extend(values).extend(status).extend(reset);
  });
});

describe('ResetApi, ResetOptions', () => {
  const instance = form.extend(values).extend(status).extend(events).extend(reset).create();

  it('takes the values, a status override and the keep flags', () => {
    expectTypeOf<NonNullable<ResetOptions<Profile>['keep']>>().toEqualTypeOf<{
      readonly checks?: boolean | readonly string[];
      readonly refs?: boolean;
      readonly fields?: boolean;
    }>();
  });

  it('rejects a value of the wrong type for one path', () => {
    // @ts-expect-error name is a string.
    instance.reset.at('name', { value: 1 });
  });

  it('takes no keep flags for one path (01-public-api.md, 8)', () => {
    // @ts-expect-error reset.at takes a value only.
    instance.reset.at('name', { keep: { refs: true } });
  });

  it('rejects values of another shape', () => {
    // @ts-expect-error The values are a Profile.
    accepts<ResetOptions<Profile>>({ values: { name: 1 } });
  });
});

describe('submit', () => {
  const submitting = form
    .extend(values)
    .extend(validation)
    .extend(check('error'))
    .extend(status)
    .extend(submit)
    .extend(base =>
      defineExtension(base, {
        name: 'later',
        needs: {
          api: ['values', 'validation', 'error', 'status', 'submit'],
          state: ['values', 'validating', 'error', 'status'],
        },
        api: () => ({ later: true as const }),
      }),
    );

  it('gives onSubmit the values and the instance of the whole chain', () => {
    submitting.create({
      onSubmit: (submitted, instance) => {
        expectTypeOf(submitted).toEqualTypeOf<Profile>();
        expectTypeOf(instance.later).toEqualTypeOf<true>();
      },
    });
  });

  it('gives onInvalid the issues by the check names of the chain (D21)', () => {
    submitting.create({ onInvalid: issues => expectTypeOf(issues).toEqualTypeOf<IssuesByCheck<'error'>>() });
  });

  it('types the result of submit.onResult by the check names of the chain', () => {
    expectTypeOf(submitting.create().submit).toEqualTypeOf<SubmitApi<Profile, 'error'>>();
  });

  it('rejects a member that the instance does not have', () => {
    // @ts-expect-error The instance has no `missing` member.
    submitting.create({ onSubmit: (_submitted, instance) => instance.missing });
  });

  it('rejects a check name that the chain does not have', () => {
    // @ts-expect-error The chain has no `warning` check.
    submitting.create({ onInvalid: issues => issues.warning });
  });

  it('needs values', () => {
    // @ts-expect-error submit needs values.
    form.extend(submit);
  });

  it('needs status', () => {
    // @ts-expect-error submit needs status.
    form.extend(values).extend(submit);
  });
});

describe('SubmitApi, SubmitAttempt, SubmitResult', () => {
  it('takes an interceptor of the attempt and a listener of the result', () => {
    expectTypeOf<Parameters<SubmitApi<Profile, 'error'>['intercept']>[0]>().parameters.toEqualTypeOf<
      [attempt: SubmitAttempt<Profile>]
    >();
    expectTypeOf<SubmitResult<'error'>['issues']>().toEqualTypeOf<IssuesByCheck<'error'>>();
  });

  it('rejects an intent that is not a string', () => {
    const api = {} as SubmitApi<Profile>;
    // @ts-expect-error The intent is a string.
    void api.run(1);
  });

  it('rejects an attempt without cancel', () => {
    // @ts-expect-error An attempt can cancel.
    accepts<SubmitAttempt<Profile>>({ values: { name: '', address: { city: '' } }, canceled: false });
  });

  it('rejects a result without issues', () => {
    // @ts-expect-error A result has the issues.
    accepts<SubmitResult<'error'>>({ successful: true });
  });
});
