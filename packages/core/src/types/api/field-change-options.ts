export type FieldChangeOptions = {
  should?: {
    /** Whether to validate the field after changing its value. Defaults to true only when a change validator is configured. */
    validate?: boolean;
    /** Whether to mark the field as dirty after changing its value. Defaults to true. */
    dirty?: boolean;
    /** Whether to mark the field as touched after changing its value. Defaults to true. */
    touch?: boolean;
  };
};
