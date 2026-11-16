import { readdirSync, readFileSync } from 'node:fs';
import { defineForm, slots } from '@oxform/core';
import { adapterControlsOf, slotsOf } from '@oxform/core/adapter';
import { rootSlots } from '@oxform/core/behaviors';
import { standard } from '@oxform/core/presets';
import { describe, expect, it } from 'vite-plus/test';
import { entryPoints, exportedNames, type EntryPoint } from '../../scripts/declarations.ts';

const schemaOf = <Values>() => ({ '~standard': { version: 1 as const, vendor: 'test', validate: (value: unknown) => ({ value: value as Values }) } });

const dist = new URL('../../dist/', import.meta.url);
const entries = Object.keys(entryPoints) as EntryPoint[];

/** A form and readers, all from the built package. */
const setup = () => ({
  form: () => defineForm({ schema: schemaOf<object>(), defaultValues: {} }).extend(standard),
  /** The chunks of `dist` that hold each source module, from the source maps. */
  chunksBySource: () => {
    const chunks = new Map<string, string[]>();
    for (const map of readdirSync(dist).filter(name => name.endsWith('.js.map'))) {
      const { sources } = JSON.parse(readFileSync(new URL(map, dist), 'utf8')) as { sources: string[] };
      for (const source of sources) chunks.set(source, [...(chunks.get(source) ?? []), map]);
    }

    return chunks;
  },
  load: async (entry: EntryPoint) => (await import(new URL(`${entry}.js`, dist).href)) as Record<string, unknown>,
  declaredNames: exportedNames,
  [Symbol.dispose]() {},
});

describe('built entry points', () => {
  it('share one instance of a module-private channel', () => {
    using built = setup();
    const form = built.form();

    expect(Object.keys(slotsOf(form.extend(slots(slot => ({ ...rootSlots(slot) })))))).toEqual(['root']);
  });

  it('know an instance of @oxform/core in @oxform/core/adapter', () => {
    using built = setup();
    const instance = built.form().create();
    const controls = adapterControlsOf(instance);
    instance.destroy();

    expect(Object.keys(controls)).toEqual(['setOptions', 'unmount']);
  });

  it('emit each source module in one chunk only', () => {
    using built = setup();
    const duplicated = [...built.chunksBySource()].filter(([, chunks]) => chunks.length > 1);

    expect(duplicated).toEqual([]);
  });

  it.each(entries)('export no internal channel from %s at runtime', async entry => {
    using built = setup();
    const module = await built.load(entry);

    expect(Object.keys(module).filter(name => name.endsWith('Internals'))).toEqual([]);
  });

  it.each(entries)('export no internal channel from %s in declarations', entry => {
    using built = setup();
    const names = built.declaredNames(entry);

    expect(names.filter(name => name.endsWith('Internals'))).toEqual([]);
  });
});
