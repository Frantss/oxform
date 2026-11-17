/**
 * The server of both reference forms, shared by every version. The shared tests replace its methods to control
 * what it answers and when.
 */
export const server = {
  /** Resolves `true` when the email and the password belong to an account. */
  async signIn(credentials: { readonly email: string; readonly password: string }) {
    return credentials.email === 'ada@example.com' && credentials.password === 'analytical';
  },
  /** Resolves `true` when the email already belongs to a member of the team. */
  async isMember(email: string) {
    return email === 'ada@example.com';
  },
  async sendInvites(_invites: unknown) {},
};
