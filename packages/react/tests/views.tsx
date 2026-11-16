import type { ViewName, ViewProps, Views } from '@oxform/adapter-parity/driver';
import { fixtures } from '@oxform/adapter-parity/fixtures';
import { useLayoutEffect, type ComponentType } from 'react';
import { createParts } from '../export/index';

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
