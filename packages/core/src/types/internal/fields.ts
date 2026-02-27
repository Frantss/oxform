export type Fields<Issue = unknown> = Record<
  string,
  {
    id: string;
    status: {
      blurred: boolean;
      touched: boolean;
      dirty: boolean;
      default: boolean;
      valid: boolean;
      pristine: boolean;
    };
    errors: Issue[];
    ref: HTMLElement | null;
  }
>;
