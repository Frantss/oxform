import { cp, rm } from 'node:fs/promises';

// The published package serves Solid 1 at "." and Solid 2 at "./v2" from the builds of the private workspaces.
const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await cp(new URL('../../solid-v1/dist/', import.meta.url), output, { recursive: true });
await cp(new URL('../../solid-v2/dist/', import.meta.url), new URL('v2/', output), { recursive: true });
