import { ArrayField, Field, useForm } from "oxform-react";
import { useEffect } from "react";
import z from "zod";
import { FormStatus } from "../components/form-status";

const schema = z.object({
  directions: z.string().array(),
});

export const Example_Array = () => {
  const form = useForm({
    schema,
    defaultValues: { directions: [] },
    validate: { change: schema },
  });

  useEffect(() => {
    (window as any)["_form"] = form;
  }, [form]);

  return (
    <form
      className="form"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();

        return form.submit(console.log, console.error)();
      }}
    >
      <div className="field">
        <label className="field-label">Directions</label>
        <button
          className="btn"
          type="button"
          onClick={() =>
            form.array.append(
              "directions",
              (state) => `test ${state.length + 1}`,
            )
          }
        >
          + Add item
        </button>
      </div>

      <ArrayField form={form} name="directions">
        {(array) =>
          array.fields?.map((_, index) => (
            <div className="array-row" key={index}>
              <Field form={form} name={`directions.${index}`}>
                {(field) => (
                  <input
                    className="input"
                    type="text"
                    placeholder={`Item ${index + 1}`}
                    {...field.props}
                  />
                )}
              </Field>
              <div className="array-actions">
                <button
                  className="btn btn-sm"
                  type="button"
                  onClick={() => array.move(index, index - 1)}
                >
                  Up
                </button>
                <button
                  className="btn btn-sm"
                  type="button"
                  onClick={() => array.move(index, index + 1)}
                >
                  Down
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  type="button"
                  onClick={() => array.remove(index)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        }
      </ArrayField>

      <hr className="divider" />

      <button className="btn btn-primary" type="submit">
        Submit
      </button>

      <FormStatus form={form} />
    </form>
  );
};
