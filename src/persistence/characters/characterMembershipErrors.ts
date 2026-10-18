export class CharacterMembershipError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export class CharacterMembershipConflictError extends CharacterMembershipError {
  constructor() {
    super(409, 'Repertuar postaci zmienił się w innym miejscu. Wczytaj ponownie postać przed zapisem. Niezapisane zmiany pozostają w formularzu.');
  }
}
