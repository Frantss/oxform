import type { ViewName, ViewProps, Views } from '@oxform/adapter-parity/driver';
import { fixtures } from '@oxform/adapter-parity/fixtures';
import { For, Show, type Component } from 'solid-js';
import { createParts, usePart, type PartRender } from '../export/index';

const signIn = createParts(fixtures.signIn);
const bare = createParts(fixtures.bare);
const profile = createParts(fixtures.profile);

/** Gives the driver the instance of the nearest `Root`. A Solid component runs once. */
const exposer = (useForm: () => unknown) => (props: Pick<ViewProps, 'expose'>) => {
  props.expose(useForm());
  return null;
};

const ExposeSignIn = exposer(signIn.useForm);
const ExposeBare = exposer(bare.useForm);
const ExposeProfile = exposer(profile.useForm);

/** A `render` function that counts its calls under `probe`, and renders an `<input>`. */
const countedInput =
  (count: ViewProps['count'], probe: string): PartRender<{}> =>
  props => {
    count(probe);
    return <input {...props} />;
  };

const Selected = (props: Pick<ViewProps, 'count'>) => {
  const name = profile.useSelector(state => state.values.name);
  props.count('selector');
  return <output aria-label='selected'>{name()}</output>;
};

const EmailField = (props: Pick<ViewProps, 'count'>) => {
  const email = profile.useField('email');
  props.count('email field');
  return <output aria-label='email field'>{email.get()}</output>;
};

const Items = () => {
  const items = profile.useArray('items');
  return (
    <For each={items.ids}>
      {(_id, index) => (
        <label>
          {`Item ${index()}`} <profile.Field name={`items.${index()}.label`} />
        </label>
      )}
    </For>
  );
};

const Scopes = () => {
  const form = profile.useForm();
  const scope = profile.useScope('address');
  const geo = profile.useScope('geo', { scope });
  const street = profile.useField('street', { scope });
  const items = profile.useArray('items', { scope: form });
  return (
    <>
      <label>
        Street <profile.Field name='street' scope={scope} />
      </label>
      <label>
        Latitude <profile.Field name='lat' scope={geo} type='number' />
      </label>
      <label>
        Street again <profile.Field name='street' scope={form.scope('address')} />
      </label>
      <output aria-label='street'>{street.get()}</output>
      <output aria-label='items'>{items.get().length}</output>
    </>
  );
};

const ColorSelect = () =>
  usePart(
    fixtures.profile,
    'field',
    { name: 'color' },
    {
      'aria-label': 'Color',
      get children() {
        return (
          <>
            <option value='red'>red</option>
            <option value='blue'>blue</option>
          </>
        );
      },
    },
    'select',
  );

const SignInView = (props: ViewProps & Views['signIn']) => (
  <signIn.Root data-testid='root' {...(props.root as {})}>
    <ExposeSignIn expose={props.expose} />
    <label>
      Email <signIn.Field name='email' />
    </label>
    <signIn.FieldError name='email' />
    <label>
      Password <signIn.Field name='password' type='password' />
    </label>
    <signIn.FieldError name='password' />
    <signIn.Submit value='sign-in'>Sign in</signIn.Submit>
  </signIn.Root>
);

/** The views of `Views` that this adapter has, by name. */
export const views: { readonly [Name in ViewName]?: Component<ViewProps & Views[Name]> } = {
  signIn: SignInView,
  twoSignIns: props => (
    <>
      <section aria-label='first'>
        <SignInView expose={props.expose} count={props.count} />
      </section>
      <section aria-label='second'>
        <SignInView expose={() => {}} count={props.count} />
      </section>
    </>
  ),
  bare: props => (
    <bare.Root>
      <ExposeBare expose={props.expose} />
      <label>
        Name <bare.Field name='name' />
      </label>
    </bare.Root>
  ),
  profileName: props => (
    <profile.Root {...(props.root as {})}>
      <ExposeProfile expose={props.expose} />
      <Show when={props.show ?? true}>
        <label>
          Name{' '}
          <profile.Field
            name='name'
            class='author'
            data-author='yes'
            id='author-id'
            ref={props.ref}
            onInput={props.onInput}
          />
        </label>
      </Show>
    </profile.Root>
  ),
  readers: props => (
    <profile.Root>
      <ExposeProfile expose={props.expose} />
      <label>
        Name <profile.Field name='name' render={countedInput(props.count, 'name part')} />
      </label>
      <label>
        Email <profile.Field name='email' render={countedInput(props.count, 'email part')} />
      </label>
      <Selected count={props.count} />
      <EmailField count={props.count} />
    </profile.Root>
  ),
  otherElements: props => (
    <profile.Root>
      <ExposeProfile expose={props.expose} />
      <profile.Field name='name' aria-label='Name' render={fieldProps => <textarea {...fieldProps} />} />
      <ColorSelect />
    </profile.Root>
  ),
  scopes: props => (
    <profile.Root>
      <ExposeProfile expose={props.expose} />
      <Scopes />
    </profile.Root>
  ),
  list: props => (
    <profile.Root>
      <ExposeProfile expose={props.expose} />
      <Items />
    </profile.Root>
  ),
  inputs: props => (
    <profile.Root>
      <ExposeProfile expose={props.expose} />
      <label>
        Agree <profile.Field name='agree' type='checkbox' />
      </label>
      <label>
        Free <profile.Field name='plan' type='radio' value='free' />
      </label>
      <label>
        Pro <profile.Field name='plan' type='radio' value='pro' />
      </label>
      <profile.Field name='color' aria-label='Color' render={fieldProps => <select {...fieldProps} />}>
        <option value='red'>red</option>
        <option value='blue'>blue</option>
      </profile.Field>
      <profile.Field name='tags' aria-label='Tags' render={fieldProps => <select multiple {...fieldProps} />}>
        <option value='a'>a</option>
        <option value='b'>b</option>
      </profile.Field>
      <label>
        Age <profile.Field name='age' type='number' />
      </label>
      <label>
        Avatar <profile.Field name='avatar' type='file' />
      </label>
      <profile.Reset>Reset</profile.Reset>
    </profile.Root>
  ),
};
