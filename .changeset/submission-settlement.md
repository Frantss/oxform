---
'@oxform/core': patch
---

Make submissions single-flight and exception-safe. Validators and submit callbacks share a captured values snapshot; stale validation aborts without invoking either callback. Rejected attempts clear submitting, remain retryable, and count as settled attempts.
