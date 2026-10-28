import { ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';

export function PlaygroundSelect(props: ComponentProps<'select'>) {
  return (
    <span className='playground-select'>
      <select {...props} />
      <ChevronDown aria-hidden='true' focusable='false' />
    </span>
  );
}
