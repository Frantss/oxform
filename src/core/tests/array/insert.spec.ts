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
  tags: ['tag1', 'tag2', 'tag3'],
  users: [
    { name: 'John Doe', email: 'john@example.com' },
    { name: 'Jane Smith', email: 'jane@example.com' },
    { name: 'Bob Wilson', email: 'bob@example.com' },
  ],
  numbers: [1, 2, 3, 4, 5],
  nested: {
    items: ['item1', 'item2', 'item3'],
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

describe('FormArrayFieldApi.insert', () => {
  describe('basic functionality', () => {
    it('should insert string at beginning (index 0)', () => {
      const { form } = setup();

      form.array.insert('tags', 0, 'inserted-at-start');

      const tags = form.field.get('tags');
      expect(tags).toEqual(['inserted-at-start', 'tag1', 'tag2', 'tag3']);
    });

    it('should insert string at middle index', () => {
      const { form } = setup();

      form.array.insert('tags', 1, 'inserted-at-middle');

      const tags = form.field.get('tags');
      expect(tags).toEqual(['tag1', 'inserted-at-middle', 'tag2', 'tag3']);
    });

    it('should insert string at end (index equal to length)', () => {
      const { form } = setup();

      form.array.insert('tags', 3, 'inserted-at-end');

      const tags = form.field.get('tags');
      expect(tags).toEqual(['tag1', 'tag2', 'tag3', 'inserted-at-end']);
    });

    it('should insert object at specific index', () => {
      const { form } = setup();

      const newUser = { name: 'Alice Cooper', email: 'alice@example.com' };
      form.array.insert('users', 1, newUser);

      const users = form.field.get('users');
      expect(users).toEqual([
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Alice Cooper', email: 'alice@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' },
        { name: 'Bob Wilson', email: 'bob@example.com' },
      ]);
    });

    it('should insert number at specific index', () => {
      const { form } = setup();

      form.array.insert('numbers', 2, 99);

      const numbers = form.field.get('numbers');
      expect(numbers).toEqual([1, 2, 99, 3, 4, 5]);
    });

    it('should insert into nested array field', () => {
      const { form } = setup();

      form.array.insert('nested.items', 1, 'inserted-item');

      const items = form.field.get('nested.items');
      expect(items).toEqual(['item1', 'inserted-item', 'item2', 'item3']);
    });
  });

  describe('index handling and edge cases', () => {
    it('should insert at index 0 in empty array', () => {
      const emptyForm = new FormApi({
        schema: z.object({
          emptyTags: z.array(z.string()).default([]),
        }),
        defaultValues: {
          emptyTags: [],
        },
      });
      emptyForm['~mount']();

      emptyForm.array.insert('emptyTags', 0, 'first-item');

      const tags = emptyForm.field.get('emptyTags');
      expect(tags).toEqual(['first-item']);
    });

    it('should insert into undefined/null array field', () => {
      const formWithNullArray = new FormApi({
        schema: z.object({
          nullableArray: z.array(z.string()).optional(),
        }),
        defaultValues: {},
      });
      formWithNullArray['~mount']();

      formWithNullArray.array.insert('nullableArray' as any, 0, 'first-item');

      const items = formWithNullArray.field.get('nullableArray' as any);
      expect(items).toEqual(['first-item']);
    });

    it('should clamp negative index to 0', () => {
      const { form } = setup();

      form.array.insert('tags', -5, 'negative-index');

      const tags = form.field.get('tags');
      expect(tags).toEqual(['negative-index', 'tag1', 'tag2', 'tag3']);
    });

    it('should clamp index greater than length to end', () => {
      const { form } = setup();

      form.array.insert('tags', 10, 'beyond-length');

      const tags = form.field.get('tags');
      expect(tags).toEqual(['tag1', 'tag2', 'tag3', 'beyond-length']);
    });

    it('should handle decimal index by flooring to integer', () => {
      const { form } = setup();

      form.array.insert('tags', 1.7, 'decimal-index');

      const tags = form.field.get('tags');
      // Math.min/max will handle the decimal, effectively flooring it
      expect(tags).toEqual(['tag1', 'decimal-index', 'tag2', 'tag3']);
    });

    it('should handle complex nested objects insertion', () => {
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
            {
              id: 3,
              data: {
                name: 'Third',
                settings: {
                  enabled: false,
                  config: ['option3'],
                },
              },
            },
          ],
        },
      });
      complexForm['~mount']();

      const insertedItem = {
        id: 2,
        data: {
          name: 'Second',
          settings: {
            enabled: true,
            config: ['option2a', 'option2b'],
          },
        },
      };

      complexForm.array.insert('complexArray', 1, insertedItem);

      const complexArray = complexForm.field.get('complexArray');
      expect(complexArray).toHaveLength(3);
      expect(complexArray?.[0]?.id).toBe(1);
      expect(complexArray?.[1]?.id).toBe(2);
      expect(complexArray?.[2]?.id).toBe(3);
      expect(complexArray?.[1]).toEqual(insertedItem);
    });
  });

  describe('options handling', () => {
    it('should respect field change options - skip validation', () => {
      const { form } = setup();

      // Mock validation to track if it was called
      const validateSpy = vi.fn();
      const originalValidate = form['context'].validate;
      form['context'].validate = validateSpy;

      form.array.insert('tags', 1, 'inserted-tag', { should: { validate: false } });

      expect(validateSpy).not.toHaveBeenCalled();
      expect(form.field.get('tags')).toEqual(['tag1', 'inserted-tag', 'tag2', 'tag3']);

      // Restore original validate method
      form['context'].validate = originalValidate;
    });

    it('should respect field change options - skip dirty state', () => {
      const { form } = setup();

      form.array.insert('tags', 1, 'inserted-tag', { should: { dirty: false } });

      expect(form.field.get('tags')).toEqual(['tag1', 'inserted-tag', 'tag2', 'tag3']);
      expect(form.field.meta('tags').dirty).toBe(false);
    });

    it('should respect field change options - skip touched state', () => {
      const { form } = setup();

      form.array.insert('tags', 1, 'inserted-tag', { should: { touch: false } });

      expect(form.field.get('tags')).toEqual(['tag1', 'inserted-tag', 'tag2', 'tag3']);
      expect(form.field.meta('tags').touched).toBe(false);
    });

    it('should set dirty and touched states by default', () => {
      const { form } = setup();

      form.array.insert('tags', 1, 'inserted-tag');

      expect(form.field.get('tags')).toEqual(['tag1', 'inserted-tag', 'tag2', 'tag3']);
      expect(form.field.meta('tags').dirty).toBe(true);
      expect(form.field.meta('tags').touched).toBe(true);
    });
  });

  describe('validation integration', () => {
    it('should call validation when inserting with change validation enabled', async () => {
      const { form } = setup();

      const validateSpy = vi.fn();
      const originalValidate = form['context'].validate;
      form['context'].validate = validateSpy.mockImplementation(originalValidate);

      form.array.insert('tags', 1, 'new-tag');

      // Verify that validation was called
      expect(validateSpy).toHaveBeenCalledWith('tags', { type: 'change' });

      // Restore original validate method
      form['context'].validate = originalValidate;
    });

    it('should validate the entire array field when inserting with constraints', async () => {
      const strictSchema = z.object({
        strictUsers: z
          .array(
            z.object({
              name: z.string().min(2, 'Name must be at least 2 characters'),
              email: z.string().email({ message: 'Invalid email format' }),
            }),
          )
          .max(3, 'Maximum 3 users allowed'),
      });

      const strictForm = new FormApi({
        schema: strictSchema,
        defaultValues: {
          strictUsers: [
            { name: 'John', email: 'john@example.com' },
            { name: 'Bob', email: 'bob@example.com' },
          ],
        },
        validate: {
          change: strictSchema,
        },
      });
      strictForm['~mount']();

      // This should succeed
      strictForm.array.insert('strictUsers', 1, { name: 'Jane', email: 'jane@example.com' });

      // Wait for validation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(strictForm.field.get('strictUsers')).toHaveLength(3);
      expect(strictForm.field.errors('strictUsers')).toHaveLength(0);

      // This should trigger validation error (exceeds max length)
      strictForm.array.insert('strictUsers', 2, { name: 'Alice', email: 'alice@example.com' });

      // Wait for validation and use poll to wait for errors
      await expect.poll(() => strictForm.field.errors('strictUsers').length).toBeGreaterThan(0);

      expect(strictForm.field.get('strictUsers')).toHaveLength(4);
      const errors = strictForm.field.errors('strictUsers');
      expect(errors.some(error => error.message?.includes('Maximum 3 users allowed'))).toBe(true);
    });
  });

  describe('type safety and error handling', () => {
    it('should maintain immutability of original array', () => {
      const { form } = setup();

      const originalTags = form.field.get('tags');
      const originalTagsRef = originalTags;

      form.array.insert('tags', 1, 'inserted-tag');

      const newTags = form.field.get('tags');

      // The reference should be different (immutable update)
      expect(newTags).not.toBe(originalTagsRef);
      expect(originalTagsRef).toEqual(['tag1', 'tag2', 'tag3']); // Original unchanged
      expect(newTags).toEqual(['tag1', 'inserted-tag', 'tag2', 'tag3']);
    });

    it('should work with multiple consecutive inserts', () => {
      const { form } = setup();

      form.array.insert('tags', 1, 'first-insert');
      form.array.insert('tags', 2, 'second-insert');
      form.array.insert('tags', 0, 'third-insert');

      const tags = form.field.get('tags');
      expect(tags).toEqual(['third-insert', 'tag1', 'first-insert', 'second-insert', 'tag2', 'tag3']);
    });

    it('should preserve existing array elements when inserting', () => {
      const { form } = setup();

      const originalUsers = form.field.get('users');
      const newUser = { name: 'Inserted User', email: 'inserted@example.com' };

      form.array.insert('users', 1, newUser);

      const updatedUsers = form.field.get('users');

      // Check that original users are preserved in their new positions
      expect(updatedUsers?.[0]).toEqual(originalUsers?.[0]); // John stays at 0
      expect(updatedUsers?.[1]).toEqual(newUser); // New user inserted at 1
      expect(updatedUsers?.[2]).toEqual(originalUsers?.[1]); // Jane moved to 2
      expect(updatedUsers?.[3]).toEqual(originalUsers?.[2]); // Bob moved to 3
    });

    it('should handle all valid index positions correctly', () => {
      // Test inserting at each valid position in a 3-element array
      const testForm = new FormApi({
        schema: z.object({ test: z.array(z.string()).default([]) }),
        defaultValues: { test: ['a', 'b', 'c'] },
      });
      testForm['~mount']();

      // Insert at beginning
      testForm.array.insert('test', 0, 'start');
      expect(testForm.field.get('test')).toEqual(['start', 'a', 'b', 'c']);

      // Reset and insert at position 1
      testForm.field.change('test', ['a', 'b', 'c']);
      testForm.array.insert('test', 1, 'middle1');
      expect(testForm.field.get('test')).toEqual(['a', 'middle1', 'b', 'c']);

      // Reset and insert at position 2
      testForm.field.change('test', ['a', 'b', 'c']);
      testForm.array.insert('test', 2, 'middle2');
      expect(testForm.field.get('test')).toEqual(['a', 'b', 'middle2', 'c']);

      // Reset and insert at end
      testForm.field.change('test', ['a', 'b', 'c']);
      testForm.array.insert('test', 3, 'end');
      expect(testForm.field.get('test')).toEqual(['a', 'b', 'c', 'end']);
    });
  });

  describe('interaction with append and prepend', () => {
    it('should work correctly when mixing insert with append and prepend', () => {
      const { form } = setup();

      // Start with ['tag1', 'tag2', 'tag3']
      form.array.insert('tags', 1, 'insert1'); // ['tag1', 'insert1', 'tag2', 'tag3']
      form.array.append('tags', 'append1'); // ['tag1', 'insert1', 'tag2', 'tag3', 'append1']
      form.array.prepend('tags', 'prepend1'); // ['prepend1', 'tag1', 'insert1', 'tag2', 'tag3', 'append1']
      form.array.insert('tags', 3, 'insert2'); // ['prepend1', 'tag1', 'insert1', 'insert2', 'tag2', 'tag3', 'append1']

      const tags = form.field.get('tags');
      expect(tags).toEqual(['prepend1', 'tag1', 'insert1', 'insert2', 'tag2', 'tag3', 'append1']);
    });

    it('should maintain correct positioning with complex operations', () => {
      const { form } = setup();

      // Start with ['tag1', 'tag2', 'tag3']
      form.array.insert('tags', 0, 'pos0'); // ['pos0', 'tag1', 'tag2', 'tag3']
      form.array.insert('tags', 2, 'pos2'); // ['pos0', 'tag1', 'pos2', 'tag2', 'tag3']
      form.array.insert('tags', 5, 'pos5'); // ['pos0', 'tag1', 'pos2', 'tag2', 'tag3', 'pos5']

      const tags = form.field.get('tags');
      expect(tags).toEqual(['pos0', 'tag1', 'pos2', 'tag2', 'tag3', 'pos5']);
    });

    it('should behave like append when index equals array length', () => {
      const { form } = setup();

      const originalLength = form.field.get('tags')?.length ?? 0;
      form.array.insert('tags', originalLength, 'insert-at-end');

      const tags = form.field.get('tags');
      expect(tags).toEqual(['tag1', 'tag2', 'tag3', 'insert-at-end']);
    });

    it('should behave like prepend when index is 0', () => {
      const { form } = setup();

      form.array.insert('tags', 0, 'insert-at-start');

      const tags = form.field.get('tags');
      expect(tags).toEqual(['insert-at-start', 'tag1', 'tag2', 'tag3']);
    });
  });

  describe('integration with form state', () => {
    it('should update form validity state when inserting valid items', () => {
      const { form } = setup();

      const initialValid = form.status.valid;

      form.array.insert('tags', 1, 'valid-tag');

      // Form should remain valid after adding valid item
      expect(form.status.valid).toBe(initialValid);
    });

    it('should update form state when inserting into multiple arrays', () => {
      const { form } = setup();

      form.array.insert('tags', 1, 'new-tag');
      form.array.insert('numbers', 2, 100);
      form.array.insert('users', 1, { name: 'Inserted User', email: 'inserted@example.com' });

      expect(form.field.get('tags')).toEqual(['tag1', 'new-tag', 'tag2', 'tag3']);
      expect(form.field.get('numbers')).toEqual([1, 2, 100, 3, 4, 5]);
      expect(form.field.get('users')?.[1]).toEqual({ name: 'Inserted User', email: 'inserted@example.com' });
      expect(form.field.get('users')).toHaveLength(4);
    });

    it('should work with form submission after inserting', async () => {
      const { form } = setup();
      let submittedData: any = null;

      const onSuccess = (data: any) => {
        submittedData = data;
      };
      const onError = () => {};

      form.array.insert('tags', 1, 'pre-submit-tag');

      await form.submit(onSuccess, onError)();

      expect(submittedData).not.toBeNull();
      expect(submittedData.tags).toEqual(['tag1', 'pre-submit-tag', 'tag2', 'tag3']);
      expect(submittedData.tags[1]).toBe('pre-submit-tag');
    });

    it('should handle insertion with form reset', () => {
      const { form } = setup();

      form.array.insert('tags', 1, 'inserted-tag');
      expect(form.field.get('tags')).toEqual(['tag1', 'inserted-tag', 'tag2', 'tag3']);

      form.reset();
      expect(form.field.get('tags')).toEqual(['tag1', 'tag2', 'tag3']); // Back to original
    });
  });
});
