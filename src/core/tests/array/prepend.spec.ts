import { FormApi } from '#/core/form-api';
import { describe, expect, it, vi } from 'vitest';
import z from 'zod';

const schema = z.object({
  tags: z.array(z.string()).default([]),
  users: z
    .array(
      z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email({ message: 'Invalid email' }),
      }),
    )
    .default([]),
  numbers: z.number().array().default([]),
  nested: z.object({
    items: z.array(z.string()).default([]),
  }),
});

const defaultValues = {
  tags: ['tag1', 'tag2'],
  users: [
    { name: 'John Doe', email: 'john@example.com' },
    { name: 'Jane Smith', email: 'jane@example.com' },
  ],
  numbers: [1, 2, 3],
  nested: {
    items: ['item1', 'item2'],
  },
};

const setup = () => {
  const form = new FormApi({
    schema,
    defaultValues,
  });
  form['~mount']();

  return { form };
};

describe('FormArrayFieldApi.prepend', () => {
  describe('basic functionality', () => {
    it('should prepend string to string array', () => {
      const { form } = setup();

      form.array.prepend('tags', 'tag0');

      const tags = form.field.get('tags');
      expect(tags).toEqual(['tag0', 'tag1', 'tag2']);
    });

    it('should prepend object to object array', () => {
      const { form } = setup();

      const newUser = { name: 'Alice Cooper', email: 'alice@example.com' };
      form.array.prepend('users', newUser);

      const users = form.field.get('users');
      expect(users).toEqual([
        { name: 'Alice Cooper', email: 'alice@example.com' },
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' },
      ]);
    });

    it('should prepend number to number array', () => {
      const { form } = setup();

      form.array.prepend('numbers', 0);

      const numbers = form.field.get('numbers');
      expect(numbers).toEqual([0, 1, 2, 3]);
    });

    it('should prepend to nested array field', () => {
      const { form } = setup();

      form.array.prepend('nested.items', 'item0');

      const items = form.field.get('nested.items');
      expect(items).toEqual(['item0', 'item1', 'item2']);
    });
  });

  describe('edge cases', () => {
    it('should prepend to empty array', () => {
      const emptyForm = new FormApi({
        schema: z.object({
          emptyTags: z.array(z.string()).default([]),
        }),
        defaultValues: {
          emptyTags: [],
        },
      });
      emptyForm['~mount']();

      emptyForm.array.prepend('emptyTags', 'first-tag');

      const tags = emptyForm.field.get('emptyTags');
      expect(tags).toEqual(['first-tag']);
    });

    it('should prepend to undefined/null array field', () => {
      const formWithNullArray = new FormApi({
        schema: z.object({
          nullableArray: z.array(z.string()).optional(),
        }),
        defaultValues: {},
      });
      formWithNullArray['~mount']();

      formWithNullArray.array.prepend('nullableArray' as any, 'first-item');

      const items = formWithNullArray.field.get('nullableArray' as any);
      expect(items).toEqual(['first-item']);
    });

    it('should handle prepending complex nested objects', () => {
      const complexSchema = z.object({
        complexArray: z
          .array(
            z.object({
              id: z.number(),
              data: z.object({
                name: z.string(),
                settings: z.object({
                  enabled: z.boolean(),
                  config: z.array(z.string()),
                }),
              }),
            }),
          )
          .default([]),
      });

      const complexForm = new FormApi({
        schema: complexSchema,
        defaultValues: {
          complexArray: [
            {
              id: 2,
              data: {
                name: 'Second',
                settings: {
                  enabled: true,
                  config: ['option1'],
                },
              },
            },
          ],
        },
      });
      complexForm['~mount']();

      const newComplexItem = {
        id: 1,
        data: {
          name: 'First',
          settings: {
            enabled: false,
            config: ['option2', 'option3'],
          },
        },
      };

      complexForm.array.prepend('complexArray', newComplexItem);

      const complexArray = complexForm.field.get('complexArray');
      expect(complexArray).toHaveLength(2);
      expect(complexArray?.[0]).toEqual(newComplexItem);
      expect(complexArray?.[0]?.id).toBe(1);
      expect(complexArray?.[1]?.id).toBe(2);
    });
  });

  describe('options handling', () => {
    it('should respect field change options - skip validation', () => {
      const { form } = setup();

      // Mock validation to track if it was called
      const validateSpy = vi.fn();
      const originalValidate = form['context'].validate;
      form['context'].validate = validateSpy;

      form.array.prepend('tags', 'tag0', { should: { validate: false } });

      expect(validateSpy).not.toHaveBeenCalled();
      expect(form.field.get('tags')).toEqual(['tag0', 'tag1', 'tag2']);

      // Restore original validate method
      form['context'].validate = originalValidate;
    });

    it('should respect field change options - skip dirty state', () => {
      const { form } = setup();

      form.array.prepend('tags', 'tag0', { should: { dirty: false } });

      expect(form.field.get('tags')).toEqual(['tag0', 'tag1', 'tag2']);
      expect(form.field.meta('tags').dirty).toBe(false);
    });

    it('should respect field change options - skip touched state', () => {
      const { form } = setup();

      form.array.prepend('tags', 'tag0', { should: { touch: false } });

      expect(form.field.get('tags')).toEqual(['tag0', 'tag1', 'tag2']);
      expect(form.field.meta('tags').touched).toBe(false);
    });

    it('should set dirty and touched states by default', () => {
      const { form } = setup();

      form.array.prepend('tags', 'tag0');

      expect(form.field.get('tags')).toEqual(['tag0', 'tag1', 'tag2']);
      expect(form.field.meta('tags').dirty).toBe(true);
      expect(form.field.meta('tags').touched).toBe(true);
    });
  });

  describe('validation integration', () => {
    it('should call validation when prepending with change validation enabled', async () => {
      const { form } = setup();

      const validateSpy = vi.fn();
      const originalValidate = form['context'].validate;
      form['context'].validate = validateSpy.mockImplementation(originalValidate);

      form.array.prepend('tags', 'new-tag');

      // Verify that validation was called
      expect(validateSpy).toHaveBeenCalledWith('tags', { type: 'change' });

      // Restore original validate method
      form['context'].validate = originalValidate;
    });

    it('should validate the entire array field when prepending with constraints', async () => {
      const strictSchema = z.object({
        strictUsers: z
          .array(
            z.object({
              name: z.string().min(2, 'Name must be at least 2 characters'),
              email: z.string().email({ message: 'Invalid email format' }),
            }),
          )
          .max(2, 'Maximum 2 users allowed'),
      });

      const strictForm = new FormApi({
        schema: strictSchema,
        defaultValues: {
          strictUsers: [{ name: 'John', email: 'john@example.com' }],
        },
        validate: {
          change: strictSchema,
        },
      });
      strictForm['~mount']();

      // This should succeed
      strictForm.array.prepend('strictUsers', { name: 'Jane', email: 'jane@example.com' });

      // Wait for validation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(strictForm.field.get('strictUsers')).toHaveLength(2);
      expect(strictForm.field.errors('strictUsers')).toHaveLength(0);

      // This should trigger validation error (exceeds max length)
      strictForm.array.prepend('strictUsers', { name: 'Bob', email: 'bob@example.com' });

      // Wait for validation and use poll to wait for errors
      await expect.poll(() => strictForm.field.errors('strictUsers').length).toBeGreaterThan(0);

      expect(strictForm.field.get('strictUsers')).toHaveLength(3);
      const errors = strictForm.field.errors('strictUsers');
      expect(errors.some(error => error.message?.includes('Maximum 2 users allowed'))).toBe(true);
    });
  });

  describe('type safety and error handling', () => {
    it('should maintain immutability of original array', () => {
      const { form } = setup();

      const originalTags = form.field.get('tags');
      const originalTagsRef = originalTags;

      form.array.prepend('tags', 'tag0');

      const newTags = form.field.get('tags');

      // The reference should be different (immutable update)
      expect(newTags).not.toBe(originalTagsRef);
      expect(originalTagsRef).toEqual(['tag1', 'tag2']); // Original unchanged
      expect(newTags).toEqual(['tag0', 'tag1', 'tag2']);
    });

    it('should work with multiple consecutive prepends', () => {
      const { form } = setup();

      form.array.prepend('tags', 'tag0');
      form.array.prepend('tags', 'tag-1');
      form.array.prepend('tags', 'tag-2');

      const tags = form.field.get('tags');
      expect(tags).toEqual(['tag-2', 'tag-1', 'tag0', 'tag1', 'tag2']);
    });

    it('should preserve existing array elements when prepending', () => {
      const { form } = setup();

      const originalUsers = form.field.get('users');
      const newUser = { name: 'New User', email: 'new@example.com' };

      form.array.prepend('users', newUser);

      const updatedUsers = form.field.get('users');

      // Check that original users are preserved in their new positions
      expect(updatedUsers?.[0]).toEqual(newUser);
      expect(updatedUsers?.[1]).toEqual(originalUsers?.[0]);
      expect(updatedUsers?.[2]).toEqual(originalUsers?.[1]);
    });
  });

  describe('interaction with append', () => {
    it('should work correctly when mixing prepend and append operations', () => {
      const { form } = setup();

      form.array.prepend('tags', 'tag0');
      form.array.append('tags', 'tag3');
      form.array.prepend('tags', 'tag-1');

      const tags = form.field.get('tags');
      expect(tags).toEqual(['tag-1', 'tag0', 'tag1', 'tag2', 'tag3']);
    });

    it('should maintain correct order when alternating prepend and append', () => {
      const { form } = setup();

      // Start with ['tag1', 'tag2']
      form.array.append('tags', 'append1'); // ['tag1', 'tag2', 'append1']
      form.array.prepend('tags', 'prepend1'); // ['prepend1', 'tag1', 'tag2', 'append1']
      form.array.append('tags', 'append2'); // ['prepend1', 'tag1', 'tag2', 'append1', 'append2']
      form.array.prepend('tags', 'prepend2'); // ['prepend2', 'prepend1', 'tag1', 'tag2', 'append1', 'append2']

      const tags = form.field.get('tags');
      expect(tags).toEqual(['prepend2', 'prepend1', 'tag1', 'tag2', 'append1', 'append2']);
    });
  });

  describe('integration with form state', () => {
    it('should update form validity state when prepending valid items', () => {
      const { form } = setup();

      const initialValid = form.status.valid;

      form.array.prepend('tags', 'valid-tag');

      // Form should remain valid after adding valid item
      expect(form.status.valid).toBe(initialValid);
    });

    it('should update form state when prepending to multiple arrays', () => {
      const { form } = setup();

      form.array.prepend('tags', 'new-tag');
      form.array.prepend('numbers', 0);
      form.array.prepend('users', { name: 'First User', email: 'first@example.com' });

      expect(form.field.get('tags')).toEqual(['new-tag', 'tag1', 'tag2']);
      expect(form.field.get('numbers')).toEqual([0, 1, 2, 3]);
      expect(form.field.get('users')?.[0]).toEqual({ name: 'First User', email: 'first@example.com' });
      expect(form.field.get('users')).toHaveLength(3);
    });

    it('should work with form submission after prepending', async () => {
      const { form } = setup();
      let submittedData: any = null;

      const onSuccess = (data: any) => {
        submittedData = data;
      };
      const onError = () => {};

      form.array.prepend('tags', 'pre-submit-tag');

      await form.submit(onSuccess, onError)();

      expect(submittedData).not.toBeNull();
      expect(submittedData.tags).toEqual(['pre-submit-tag', 'tag1', 'tag2']);
      expect(submittedData.tags[0]).toBe('pre-submit-tag');
    });
  });
});
