import { defineExtension, optionTypes, type Extendable, type Needs } from '@oxform/core';

export type FunnelEvent =
  | { readonly type: 'invalid'; readonly paths: readonly string[] }
  | { readonly type: 'submitted'; readonly successful: boolean };

type IssuePath = readonly (PropertyKey | { readonly key: PropertyKey })[] | undefined;

const dotted = (path: IssuePath) =>
  (path ?? []).map(segment => String(typeof segment === 'object' ? segment.key : segment)).join('.');

/**
 * E09. The product team must know which checkout fields fail and how many orders complete. `funnel` reports the
 * failing paths of each validation run and the result of each submit to the `onTrack` option. It only observes.
 * The listeners live as long as the instance, so they need no cleanup.
 */
export const funnel = <Values>(form: Extendable<Values, Needs<Values, 'validation' | 'submit'>>) =>
  defineExtension(form, {
    name: 'funnel',
    needs: { api: ['validation', 'submit'] },
    options: optionTypes<{ onTrack: (event: FunnelEvent) => void }>(),
    api: (context, { validation, submit }) => {
      const track = (event: FunnelEvent) => context.options().onTrack?.(event);
      validation.onRun(run => {
        const paths = [
          ...new Set(Object.values(run.issues).flatMap(entries => entries.map(entry => dotted(entry.path)))),
        ];
        if (paths.length > 0) track({ type: 'invalid', paths });
      });
      submit.onResult(result => track({ type: 'submitted', successful: result.successful }));
      return {};
    },
  });
