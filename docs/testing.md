# Testing Patterns

See [Commands Reference](./commands.md) for test commands.

## Testing Checklist

- [ ] Use `*.spec.ts` extension for test files
- [ ] Place tests in a `/test` folder co-located with the actual code
- [ ] Tests a single component/function/class in each file
- [ ] Create a `setup()` helper that encapsulates any re-usable test initialization
- [ ] Mock modules with `vi.mock()` + `{ spy: true }` and access mocks with `vi.mocked()`
- [ ] Group related tests in `describe()` blocks by feature or scenario
- [ ] Use concise `it()` descriptions starting with "should"
- [ ] Test success, failure, and edge case scenarios in separate describe blocks
