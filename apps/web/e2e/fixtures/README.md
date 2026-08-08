# E2E fixtures

Shared helpers live in `auth.ts`.

## Auth credentials

Provide Clerk test user credentials for authenticated specs:

- `E2E_CLERK_TEST_USER_EMAIL`
- `E2E_CLERK_TEST_USER_PASSWORD`

When these are missing, auth-dependent tests `test.skip` gracefully. Unauthenticated API assertions still run and expect `401`.

Optional: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` enables sign-in/sign-up UI assertions.
