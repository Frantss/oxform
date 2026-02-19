import type { UpdaterFn } from '#utils/update/updater-fn';

export type Updater<TInput, TOutput = TInput> = TOutput | UpdaterFn<TInput, TOutput>;
