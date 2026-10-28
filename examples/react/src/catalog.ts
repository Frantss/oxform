export const reactExamples = [
  { id: 'basic', label: 'Basic', description: 'Field interactions, validation, and form status.' },
  {
    id: 'checks',
    label: 'Account form',
    description: 'Nested fields, members, warnings, async blocking checks, manual review, and reset.',
  },
  { id: 'array', label: 'Array', description: 'Add, reorder, and remove items while observing field identity.' },
  { id: 'async', label: 'Async', description: 'Async validation and submission with simulated server checks.' },
  { id: 'issues', label: 'Issues', description: 'Non-blocking warnings and blocking issues alongside errors.' },
  { id: 'effect', label: 'Effect', description: 'Side effects driven by selected value and status changes.' },
  { id: 'transform', label: 'Transform', description: 'Derive and format selected form state.' },
] as const;

export type ReactExampleId = (typeof reactExamples)[number]['id'];
