export type Extension = { readonly name: string };

export type Form = {
  readonly extend: (extension: (form: Form) => Extension | Form) => Form;
};

const extensionsOf = new WeakMap<Form, readonly Extension[]>();
const extensions = new WeakSet<Extension>();

const createForm = (chain: readonly Extension[]): Form => {
  const form: Form = {
    extend: extension => {
      const result = extension(form);
      return extensions.has(result as Extension) ? createForm([...chain, result as Extension]) : (result as Form);
    },
  };
  extensionsOf.set(form, chain);
  return form;
};

export const defineForm = (): Form => createForm([]);

export const defineExtension = (_form: Form, definition: { name: string }): Extension => {
  const extension: Extension = { name: definition.name };
  extensions.add(extension);
  return extension;
};

export const slotsOf = (form: Form): readonly string[] => {
  const chain = extensionsOf.get(form);
  if (!chain) throw new TypeError('slotsOf expects a form made by defineForm.');
  return chain.map(extension => extension.name);
};
