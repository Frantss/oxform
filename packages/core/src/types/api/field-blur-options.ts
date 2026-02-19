export type FieldBlurOptions = {
  should?: {
    /** Whether to validate the field after blurring. Defaults to true only when a blur validator is configured. */
    validate?: boolean;
  };
};
