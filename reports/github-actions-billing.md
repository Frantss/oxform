# GitHub Actions billing

## 2026-10-28

- `.github/workflows/ci.yml:6`: GitHub Actions did not start the `ci` job for
  commit `81b2dfd`. The check annotation states: "The job was not started because
  your account is locked due to a billing issue." No workflow steps ran, so the
  pushed revision has no hosted CI validation. The local build, `check:all`, and
  all 522 tests passed. Evidence:
  [workflow run 40646410708](https://github.com/Frantss/oxform/actions/runs/40646410708),
  check run `122676147497`.
