# TypeScript Conventions

**When writing TypeScript code, verify:**

- [ ] Public APIs have explicit return types
- [ ] Use `satisfies` operator for type assertions preserving literal types
- [ ] Use native `#private` fields (not underscore prefix)
- [ ] Use types over interfaces
- [ ] Prefix internal methods with `~` (tilde)
- [ ] Use `type` keyword for type-only imports
- [ ] All file paths are absolute (using `#*` aliases)
