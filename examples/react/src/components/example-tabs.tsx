type ExampleTabsProps = {
  active: 'basic' | 'array' | 'async' | 'effect' | 'subscribe_transform';
  steps: Array<{
    id: 'basic' | 'array' | 'async' | 'effect' | 'subscribe_transform';
    label: string;
  }>;
  onChange: (example: 'basic' | 'array' | 'async' | 'effect' | 'subscribe_transform') => void;
};

export const ExampleTabs = ({ active, steps, onChange }: ExampleTabsProps) => {
  return (
    <nav className='tab-nav'>
      {steps.map(step => (
        <button key={step.id} className='tab-btn' data-active={active === step.id} onClick={() => onChange(step.id)}>
          {step.label}
        </button>
      ))}
    </nav>
  );
};
