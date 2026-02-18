import type { FieldMeta } from 'oxform-react';

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

type FieldStatusField = {
  options: {
    name: string;
  };
  state: {
    meta: FieldMeta;
    value?: unknown;
  };
};

export const FieldStatus = ({ field }: { field: FieldStatusField }) => {
  const { meta, value } = field.state;
  const fieldId = field.options.name;

  return (
    <div className='field-status'>
      <span className='status-tag' data-on={true}>
        <span className='status-dot' />
        id: {fieldId}
      </span>
      {typeof value !== 'undefined' && (
        <span className='status-tag' data-on={true}>
          <span className='status-dot' />
          value: {formatValue(value)}
        </span>
      )}
      {Object.entries(meta).map(([key, isOn]) => (
        <span key={key} className='status-tag' data-on={isOn}>
          <span className='status-dot' />
          {key}
        </span>
      ))}
    </div>
  );
};
