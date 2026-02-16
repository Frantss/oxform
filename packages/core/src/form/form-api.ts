import type { FormOptions } from '#form-api.types';
import { FormCore } from '#form/form-core';
import { FormCoreArray } from '#form/form-core-array-field';
import { FormCoreField } from '#form/form-core-field';
import { FormCoreFields } from '#form/form-core-fields';

export class FormApi<Values> {
  private core!: FormCore<Values>;
  public field: FormCoreField<Values>;
  public array: FormCoreArray<Values>;

  constructor(options: FormOptions<Values>) {
    this.core = new FormCore<Values>(options);
    const fields = new FormCoreFields<Values>({ core: this.core });

    this.field = new FormCoreField<Values>({ core: this.core, fields });
    this.array = new FormCoreArray<Values>({ core: this.core, fields, field: this.field });
  }

  public get options() {
    return this.core.options;
  }

  public get store() {
    return this.core.store;
  }

  public get validate() {
    return this.core.validate;
  }
}
