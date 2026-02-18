import type { AnyFormApi } from 'oxform-react';
import { Subscribe } from 'oxform-react';

const tags = ['valid', 'dirty', 'submitted', 'submitting', 'validating', 'successful'] as const;

export const FormStatus = ({ form }: { form: AnyFormApi }) => {
  return (
    <Subscribe api={form} selector={state => state.status}>
      {status => (
        <div className='status'>
          <div className='status-title'>Status</div>
          <div className='status-tag'>
            submits <span className='stat-value'>{status.submits}</span>
          </div>
          {tags.map(key => (
            <div className='status-tag' data-on={status[key]} key={key}>
              <span className='status-dot' />
              {key}
            </div>
          ))}
        </div>
      )}
    </Subscribe>
  );
};
