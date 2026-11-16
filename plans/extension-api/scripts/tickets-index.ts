import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const planDirectory = join(import.meta.dirname, '..');
const ticketsDirectory = join(planDirectory, 'tickets');
const indexPath = join(planDirectory, '08-tickets.md');
const startMarker = '<!-- tickets:start -->';
const endMarker = '<!-- tickets:end -->';

const phaseNames: Record<string, string> = {
  '0': 'the reference and the integration branch',
  '1': 'workspace skeleton and packaging proof',
  '2': 'main APIs',
  '3': 'built-in extensions and slot groups',
  '4': '`standard` preset, integration tests and bundle checks',
  '5': 'React adapter and the parity suite',
  '6': 'Solid 1 and Solid 2 adapters',
  '7': 'example kit, example apps and comparison workspace',
  '8': 'documentation',
  '9': 'release 0.7.0 and cleanup',
};

type Ticket = {
  id: string;
  title: string;
  phase: string;
  workPackages: string[];
  status: string;
  dependsOn: string[];
  fileName: string;
};

const parseList = (value: string) =>
  value
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

const parseFrontmatter = (text: string, fileName: string) => {
  const match = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!match) throw new Error(`${fileName} has no frontmatter`);
  const fields = new Map<string, string>();
  let name = '';
  for (const line of match[1].split('\n')) {
    const field = /^(\w+):(.*)$/.exec(line);
    if (field) {
      name = field[1];
      fields.set(name, field[2].replace(/#.*$/, '').trim());
    } else if (name) {
      // The formatter wraps a long list over several lines.
      fields.set(name, `${fields.get(name)}${line.trim()}`);
    }
  }
  return fields;
};

const readTicket = (fileName: string): Ticket => {
  const fields = parseFrontmatter(readFileSync(join(ticketsDirectory, fileName), 'utf8'), fileName);
  const field = (name: string) => {
    const value = fields.get(name);
    if (value === undefined) throw new Error(`${fileName} has no "${name}" field`);
    return value;
  };
  return {
    id: field('id'),
    title: field('title'),
    phase: field('phase'),
    workPackages: parseList(field('work_package')),
    status: field('status'),
    dependsOn: parseList(field('depends_on')),
    fileName,
  };
};

const tickets = readdirSync(ticketsDirectory)
  .filter(fileName => /^TK-\d+.*\.md$/.test(fileName))
  .sort()
  .map(readTicket);

const statusById = new Map(tickets.map(ticket => [ticket.id, ticket.status]));

const displayStatus = (ticket: Ticket) => {
  if (ticket.status !== 'todo') return ticket.status;
  const unknown = ticket.dependsOn.filter(id => !statusById.has(id));
  if (unknown.length > 0) throw new Error(`${ticket.id} depends on unknown tickets: ${unknown.join(', ')}`);
  return ticket.dependsOn.every(id => statusById.get(id) === 'done') ? 'ready' : 'blocked';
};

const formatDependencies = (dependsOn: string[]) =>
  (dependsOn.length > 10 ? `${dependsOn[0]} to ${dependsOn.at(-1)}` : dependsOn.join(', ')) || 'None';

const phases = [...new Set(tickets.map(ticket => ticket.phase))];
const sections = phases.map(phase => {
  const rows = tickets
    .filter(ticket => ticket.phase === phase)
    .map(
      ticket =>
        `| [${ticket.id}](./tickets/${ticket.fileName}) | ${ticket.title} | ${ticket.workPackages.join(', ')} | ${displayStatus(ticket)} | ${formatDependencies(ticket.dependsOn)} |`,
    );
  return [
    `### Phase ${phase}: ${phaseNames[phase] ?? ''}`,
    '',
    '| Id | Title | Work package | Status | Depends on |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
  ].join('\n');
});

const index = readFileSync(indexPath, 'utf8');
const start = index.indexOf(startMarker);
const end = index.indexOf(endMarker);
if (start === -1 || end < start) throw new Error(`${indexPath} has no ticket markers`);

writeFileSync(
  indexPath,
  `${index.slice(0, start + startMarker.length)}\n\n${sections.join('\n\n')}\n\n${index.slice(end)}`,
);
console.log(`Wrote ${tickets.length} tickets to ${indexPath}`);
