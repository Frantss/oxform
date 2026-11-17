# Sign-in: specification

Every version renders this form and passes `suite.tsx`. A version adds nothing that this file does not state
(`plans/extension-api/07-comparison.md`, 4.6).

## Fields

| Field      | Element                                            | Rule (`schema.ts`)    | Message                                   |
| ---------- | -------------------------------------------------- | --------------------- | ----------------------------------------- |
| `email`    | A text box of type `email`, labelled "Email"       | An email address      | "Enter an email address."                 |
| `password` | A text box of type `password`, labelled "Password" | At least 8 characters | "The password has at least 8 characters." |

The form is a `form` element named "Sign in". It has one submit button, "Sign in".

## Behavior

1. Before the first submit, no field shows a message.
2. A submit validates every field. A message shows under its field, and it is the accessible description of
   that field. An invalid submit does not call the server.
3. After the first submit, each field validates on change: its message comes and goes as the user types.
4. A valid submit calls `server.signIn` with the values. The button is disabled until the server answers.
5. When `server.signIn` resolves `false`, the password field shows "The email or the password is wrong.". The
   form stays usable: a later valid submit calls the server again, and the message goes when it succeeds.
