import type { ViewName, ViewProps, Views } from '@oxform/adapter-parity/driver';
import { fixtures } from '@oxform/adapter-parity/fixtures';
import type { Component } from 'solid-js';
import { createParts } from '../export/index';

const signIn = createParts(fixtures.signIn);
const profile = createParts(fixtures.profile);

/** Gives the driver the instance of the nearest `Root`. A Solid component runs once. */
const exposer = (useForm: () => unknown) => (props: Pick<ViewProps, 'expose'>) => {
  props.expose(useForm());
  return null;
};

const ExposeSignIn = exposer(signIn.useForm);
const ExposeProfile = exposer(profile.useForm);

/** The Solid views of the parity scenarios that the probe runs (TK-043). */
export const views: { readonly [Name in ViewName]?: Component<ViewProps & Views[Name]> } = {
  signIn: props => (
    <signIn.Root data-testid='root' {...props.root}>
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
      <profile.Field name='color' aria-label='Color' render={(fieldProps: object) => <select {...fieldProps} />}>
        <option value='red'>red</option>
        <option value='blue'>blue</option>
      </profile.Field>
      <profile.Field name='tags' aria-label='Tags' render={(fieldProps: object) => <select multiple {...fieldProps} />}>
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
