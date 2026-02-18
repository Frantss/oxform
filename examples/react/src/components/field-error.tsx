type FieldErrorField = {
  state: {
    meta: {
      valid: boolean;
    };
    errors: Array<{
      message: string;
    }>;
  };
};

export const FieldError = ({ field }: { field: FieldErrorField }) => {
  if (field.state.meta.valid) {
    return null;
  }

  return <span className='field-error'>{field.state.errors.map(error => error.message).join(', ')}</span>;
};
