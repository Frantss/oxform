import type { AnyFormApi } from 'oxform-react';
import { Subscribe } from 'oxform-react';

export const FormStatus = ({ form }: { form: AnyFormApi }) => {
  return (
    <Subscribe api={form} selector={state => state.status}>
      {({ submits, ...status }) => (
        <div className='status'>
          <div className='status-title'>Status</div>
          <div className='status-tag'>
            submits <span className='stat-value'>{submits}</span>
          </div>
          {Object.entries(status).map(([key, value]) => (
            <div className='status-tag' data-on={value} key={key}>
              <span className='status-dot' />
              {key}
            </div>
          ))}
        </div>
      )}
    </Subscribe>
  );
};
