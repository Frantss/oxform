---
'@oxform/core': patch
---

Fix validation issue paths containing Standard Schema `{ key }` segments, such as Valibot paths, so field errors, validity, targeted validation, and submit error callbacks retain the issues.
