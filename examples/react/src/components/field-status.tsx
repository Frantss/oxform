import type { FieldApi } from 'oxform-react';

const formatValue = (value: unknown) => {
  if (typeof value === 'string') {
    return value.length > 0 ? `"${value}"` : '""';
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return String(value);
  }

  if (typeof value === 'undefined') {
    return 'undefined';
  }

  return JSON.stringify(value);
};

export const FieldStatus = ({ field }: { field: FieldApi<any> }) => {
  return (
    <div className='field-status'>
      <span className='status-tag' data-on={true}>
        <span className='status-dot' />
        id: {field.id}
      </span>

      {typeof field.state.value !== 'undefined' && (
        <span className='status-tag' data-on={true}>
          <span className='status-dot' />
          value: {formatValue(field.state.value)}
        </span>
      )}

      {Object.entries(field.state.meta).map(([key, isOn]) => (
        <span key={key} className='status-tag' data-on={isOn}>
          <span className='status-dot' />
          {key}
        </span>
      ))}
    </div>
  );
};
