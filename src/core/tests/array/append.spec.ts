import { FormApi } from '#/core/form-api';
import { describe, expect, it, vi } from 'vitest';
import z from 'zod';

const schema = z.object({
  tags: z.array(z.string()).default([]),
  users: z
    .array(
      z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email'),
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

describe('FormArrayFieldApi.append', () => {
  describe('basic functionality', () => {
    it('should append string to string array', () => {
      const { form } = setup();

      form.array.append('tags', 'tag3');

      const tags = form.field.get('tags');
      expect(tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should append object to object array', () => {
      const { form } = setup();

      const newUser = { name: 'Bob Wilson', email: 'bob@example.com' };
      form.array.append('users', newUser);

      const users = form.field.get('users');
      expect(users).toEqual([
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' },
        { name: 'Bob Wilson', email: 'bob@example.com' },
      ]);
    });

    it('should append number to number array', () => {
      const { form } = setup();

      form.array.append('numbers', 4);

      const numbers = form.field.get('numbers');
      expect(numbers).toEqual([1, 2, 3, 4]);
    });

    it('should append to nested array field', () => {
      const { form } = setup();

      form.array.append('nested.items', 'item3');

      const items = form.field.get('nested.items');
      expect(items).toEqual(['item1', 'item2', 'item3']);
    });
  });

  describe('edge cases', () => {
    it('should append to empty array', () => {
      const emptyForm = new FormApi({
        schema: z.object({
          emptyTags: z.array(z.string()).default([]),
        }),
        defaultValues: {
          emptyTags: [],
        },
      });
      emptyForm['~mount']();

      emptyForm.array.append('emptyTags', 'first-tag');

      const tags = emptyForm.field.get('emptyTags');
      expect(tags).toEqual(['first-tag']);
    });

    it('should append to undefined/null array field', () => {
      const formWithNullArray = new FormApi({
        schema: z.object({
          nullableArray: z.array(z.string()).optional(),
        }),
        defaultValues: {},
      });
      formWithNullArray['~mount']();

      formWithNullArray.array.append('nullableArray' as any, 'first-item');

      const items = formWithNullArray.field.get('nullableArray' as any);
      expect(items).toEqual(['first-item']);
    });

    it('should handle appending complex nested objects', () => {
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
              id: 1,
              data: {
                name: 'First',
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
        id: 2,
        data: {
          name: 'Second',
          settings: {
            enabled: false,
            config: ['option2', 'option3'],
          },
        },
      };

      complexForm.array.append('complexArray', newComplexItem);

      const complexArray = complexForm.field.get('complexArray');
      expect(complexArray).toHaveLength(2);
      expect(complexArray?.[1]).toEqual(newComplexItem);
    });
  });

  describe('options handling', () => {
    it('should respect field change options - skip validation', () => {
      const { form } = setup();

      // Mock validation to track if it was called
      const validateSpy = vi.fn();
      const originalValidate = form['context'].validate;
      form['context'].validate = validateSpy;

      form.array.append('tags', 'tag3', { should: { validate: false } });

      expect(validateSpy).not.toHaveBeenCalled();
      expect(form.field.get('tags')).toEqual(['tag1', 'tag2', 'tag3']);

      // Restore original validate method
      form['context'].validate = originalValidate;
    });

    it('should respect field change options - skip dirty state', () => {
      const { form } = setup();

      form.array.append('tags', 'tag3', { should: { dirty: false } });

      expect(form.field.get('tags')).toEqual(['tag1', 'tag2', 'tag3']);
      expect(form.field.meta('tags').dirty).toBe(false);
    });

    it('should respect field change options - skip touched state', () => {
      const { form } = setup();

      form.array.append('tags', 'tag3', { should: { touch: false } });

      expect(form.field.get('tags')).toEqual(['tag1', 'tag2', 'tag3']);
      expect(form.field.meta('tags').touched).toBe(false);
    });

    it('should set dirty and touched states by default', () => {
      const { form } = setup();

      form.array.append('tags', 'tag3');

      expect(form.field.get('tags')).toEqual(['tag1', 'tag2', 'tag3']);
      expect(form.field.meta('tags').dirty).toBe(true);
      expect(form.field.meta('tags').touched).toBe(true);
    });
  });

  describe('validation integration', () => {
    it('should call validation when appending with change validation enabled', async () => {
      const { form } = setup();

      const validateSpy = vi.fn();
      const originalValidate = form['context'].validate;
      form['context'].validate = validateSpy.mockImplementation(originalValidate);

      form.array.append('tags', 'new-tag');

      // Verify that validation was called
      expect(validateSpy).toHaveBeenCalledWith('tags', { type: 'change' });

      // Restore original validate method
      form['context'].validate = originalValidate;
    });

    it('should validate the entire array field when appending with constraints', async () => {
      const strictSchema = z.object({
        strictUsers: z
          .array(
            z.object({
              name: z.string().min(2, 'Name must be at least 2 characters'),
              email: z.string().email('Invalid email format'),
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
      strictForm.array.append('strictUsers', { name: 'Jane', email: 'jane@example.com' });

      // Wait for validation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(strictForm.field.get('strictUsers')).toHaveLength(2);
      expect(strictForm.field.errors('strictUsers')).toHaveLength(0);

      // This should trigger validation error (exceeds max length)
      strictForm.array.append('strictUsers', { name: 'Bob', email: 'bob@example.com' });

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

      form.array.append('tags', 'tag3');

      const newTags = form.field.get('tags');

      // The reference should be different (immutable update)
      expect(newTags).not.toBe(originalTagsRef);
      expect(originalTagsRef).toEqual(['tag1', 'tag2']); // Original unchanged
      expect(newTags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should work with multiple consecutive appends', () => {
      const { form } = setup();

      form.array.append('tags', 'tag3');
      form.array.append('tags', 'tag4');
      form.array.append('tags', 'tag5');

      const tags = form.field.get('tags');
      expect(tags).toEqual(['tag1', 'tag2', 'tag3', 'tag4', 'tag5']);
    });

    it('should preserve existing array elements when appending', () => {
      const { form } = setup();

      const originalUsers = form.field.get('users');
      const newUser = { name: 'New User', email: 'new@example.com' };

      form.array.append('users', newUser);

      const updatedUsers = form.field.get('users');

      // Check that original users are preserved
      expect(updatedUsers?.[0]).toEqual(originalUsers?.[0]);
      expect(updatedUsers?.[1]).toEqual(originalUsers?.[1]);
      expect(updatedUsers?.[2]).toEqual(newUser);
    });
  });

  describe('integration with form state', () => {
    it('should update form validity state when appending valid items', () => {
      const { form } = setup();

      const initialValid = form.status.valid;

      form.array.append('tags', 'valid-tag');

      // Form should remain valid after adding valid item
      expect(form.status.valid).toBe(initialValid);
    });

    it('should update form state when appending to multiple arrays', () => {
      const { form } = setup();

      form.array.append('tags', 'new-tag');
      form.array.append('numbers', 100);
      form.array.append('users', { name: 'Multi User', email: 'multi@example.com' });

      expect(form.field.get('tags')).toContain('new-tag');
      expect(form.field.get('numbers')).toContain(100);
      expect(form.field.get('users')).toHaveLength(3);
    });

    it('should work with form submission after appending', async () => {
      const { form } = setup();
      let submittedData: any = null;

      const onSuccess = (data: any) => {
        submittedData = data;
      };
      const onError = () => {};

      form.array.append('tags', 'pre-submit-tag');

      await form.submit(onSuccess, onError)();

      expect(submittedData).not.toBeNull();
      expect(submittedData.tags).toContain('pre-submit-tag');
    });
  });
});
