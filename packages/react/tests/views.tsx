import type { ViewName, ViewProps, Views } from '@oxform/adapter-parity/driver';
import { fixtures } from '@oxform/adapter-parity/fixtures';
import { useLayoutEffect, type ComponentType } from 'react';
import { createParts, usePart, type PartRender } from '../export/index';

const signIn = createParts(fixtures.signIn);
const bare = createParts(fixtures.bare);
const profile = createParts(fixtures.profile);

/** Gives the driver the instance of the nearest `Root`: the one of the render, then the one that committed. */
const exposer = (useForm: () => unknown) => {
  const Expose = ({ expose }: Pick<ViewProps, 'expose'>) => {
    const instance = useForm();
    expose(instance);
    useLayoutEffect(() => expose(instance));
    return null;
  };
  return Expose;
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

const Selected = ({ count }: Pick<ViewProps, 'count'>) => {
  const name = profile.useSelector(state => state.values.name);
  count('selector');
  return <output aria-label='selected'>{name}</output>;
};

const EmailField = ({ count }: Pick<ViewProps, 'count'>) => {
  const email = profile.useField('email');
  count('email field');
  return <output aria-label='email field'>{email.get()}</output>;
};

const Items = () => {
  const items = profile.useArray('items');
  return items.ids.map((id, index) => (
    <label key={id}>
      {`Item ${index}`} <profile.Field name={`items.${index}.label`} />
    </label>
  ));
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
      children: (
        <>
          <option value='red'>red</option>
          <option value='blue'>blue</option>
        </>
      ),
    },
    'select',
  );

const SignInView = ({ expose, root }: ViewProps & Views['signIn']) => (
  <signIn.Root data-testid='root' {...(root as {})}>
    <ExposeSignIn expose={expose} />
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
export const views: { readonly [Name in ViewName]?: ComponentType<ViewProps & Views[Name]> } = {
  signIn: SignInView,
  twoSignIns: ({ expose, count }) => (
    <>
      <section aria-label='first'>
        <SignInView expose={expose} count={count} />
      </section>
      <section aria-label='second'>
        <SignInView expose={() => {}} count={count} />
      </section>
    </>
  ),
  bare: ({ expose }) => (
    <bare.Root>
      <ExposeBare expose={expose} />
      <label>
        Name <bare.Field name='name' />
      </label>
    </bare.Root>
  ),
  profileName: ({ expose, root, show = true, ref, onInput }) => (
    <profile.Root {...(root as {})}>
      <ExposeProfile expose={expose} />
      {show && (
        <label>
          Name{' '}
          <profile.Field name='name' className='author' data-author='yes' id='author-id' ref={ref} onInput={onInput} />
        </label>
      )}
    </profile.Root>
  ),
  readers: ({ expose, count }) => (
    <profile.Root>
      <ExposeProfile expose={expose} />
      <label>
        Name <profile.Field name='name' render={countedInput(count, 'name part')} />
      </label>
      <label>
        Email <profile.Field name='email' render={countedInput(count, 'email part')} />
      </label>
      <Selected count={count} />
      <EmailField count={count} />
    </profile.Root>
  ),
  otherElements: ({ expose }) => (
    <profile.Root>
      <ExposeProfile expose={expose} />
      <profile.Field name='name' aria-label='Name' render={props => <textarea {...props} />} />
      <ColorSelect />
    </profile.Root>
  ),
  scopes: ({ expose }) => (
    <profile.Root>
      <ExposeProfile expose={expose} />
      <Scopes />
    </profile.Root>
  ),
  list: ({ expose }) => (
    <profile.Root>
      <ExposeProfile expose={expose} />
      <Items />
    </profile.Root>
  ),
  inputs: ({ expose }) => (
    <profile.Root>
      <ExposeProfile expose={expose} />
      <label>
        Agree <profile.Field name='agree' type='checkbox' />
      </label>
      <label>
        Free <profile.Field name='plan' type='radio' value='free' />
      </label>
      <label>
        Pro <profile.Field name='plan' type='radio' value='pro' />
      </label>
      <profile.Field name='color' aria-label='Color' render={<select />}>
        <option value='red'>red</option>
        <option value='blue'>blue</option>
      </profile.Field>
      <profile.Field name='tags' aria-label='Tags' render={<select multiple />}>
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
