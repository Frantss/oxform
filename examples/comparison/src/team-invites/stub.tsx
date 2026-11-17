/** The markup of the specification with no behavior and no row. Each case of the suite fails against it. */
export const TeamInvitesStub = () => (
  <form aria-label='Team invites' noValidate onSubmit={event => event.preventDefault()}>
    <label>
      Team
      <input name='team' />
    </label>
    <label>
      Seats
      <input name='seats' type='number' defaultValue={1} />
    </label>
    <ul aria-label='Members' />
    <button type='button'>Add member</button>
    <button type='submit'>Send invites</button>
    <button type='reset'>Reset</button>
  </form>
);
