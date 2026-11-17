# Team invites: specification

Every version renders this form and passes `suite.tsx`. A version adds nothing that this file does not state
(`plans/extension-api/07-comparison.md`, 4.6).

## Fields

| Field             | Element                                                  | Rule (`schema.ts`)                   | Message                             |
| ----------------- | -------------------------------------------------------- | ------------------------------------ | ----------------------------------- |
| `team`            | A text box labelled "Team"                               | Not empty                            | "Enter a team name."                |
| `seats`           | A number box labelled "Seats", default 1                 | A whole number of at least 1         | "A team has at least one seat."     |
| `members[].email` | A text box labelled "Email", one per row                 | An email address                     | "Enter an email address."           |
| `members[].email` | The same box                                             | Not a member yet (`server.isMember`) | "This address is already a member." |
| `members[].role`  | A select labelled "Role", one per row: `member`, `admin` | One of the two, default `member`     | None                                |

The form is a `form` element named "Team invites". The rows are the items of a list named "Members". Each row
has the buttons "Move up" and "Remove". Under the list: "Add member". At the end: "Send invites" (submit) and
"Reset". The form starts with no member.

## Behavior

1. "Add member" appends an empty row. "Remove" removes its row. "Move up" swaps its row with the row above.
   The values move with their rows.
2. A member email validates its format on change, before any submit.
3. On blur, a member email with a valid format is looked up with `server.isMember`. A member shows "This
   address is already a member.".
4. A submit validates every field, the lookups too. An invalid submit does not call the server. A valid one
   calls `server.sendInvites` with the values.
5. "Reset" returns to the default values, with no message.
