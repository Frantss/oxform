import type { Updater } from '#utils/update/updater-';
import type { UpdaterFn } from '#utils/update/updater-fn';

export function update<TInput, TOutput = TInput>(updater: Updater<TInput, TOutput>, input: TInput): TOutput {
  return typeof updater === 'function' ? (updater as UpdaterFn<TInput, TOutput>)(input) : updater;
}
