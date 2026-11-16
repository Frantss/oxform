import { readdirSync, readFileSync } from 'node:fs';
import { defineForm } from '@oxform/core';
import { slotsOf } from '@oxform/core/adapter';
import { standard } from '@oxform/core/presets';
import { describe, expect, it } from 'vite-plus/test';
import { entryPoints, exportedNames, type EntryPoint } from '../../scripts/declarations.ts';

const dist = new URL('../../dist/', import.meta.url);
const entries = Object.keys(entryPoints) as EntryPoint[];

const sourcesOfChunk = (map: string): string[] => (JSON.parse(readFileSync(new URL(map, dist), 'utf8')) as { sources: string[] }).sources;

describe('built entry points', () => {
  it('share one instance of a module-private channel', () => {
    const form = defineForm().extend(standard);

    expect(slotsOf(form)).toEqual(['values']);
  });

  it('emit each source module in one chunk only', () => {
    const maps = readdirSync(dist).filter(name => name.endsWith('.js.map'));
    const chunksBySource = new Map<string, string[]>();
    for (const map of maps) {
      for (const source of sourcesOfChunk(map)) chunksBySource.set(source, [...(chunksBySource.get(source) ?? []), map]);
    }
    const duplicated = [...chunksBySource].filter(([, chunks]) => chunks.length > 1);

    expect(duplicated).toEqual([]);
  });

  it.each(entries)('export no internal channel from %s at runtime', async entry => {
    const module = (await import(new URL(`${entry}.js`, dist).href)) as Record<string, unknown>;

    expect(Object.keys(module).filter(name => name.endsWith('Internals'))).toEqual([]);
  });

  it.each(entries)('export no internal channel from %s in declarations', entry => {
    const names = exportedNames(entry);

    expect(names.filter(name => name.endsWith('Internals'))).toEqual([]);
  });
});
