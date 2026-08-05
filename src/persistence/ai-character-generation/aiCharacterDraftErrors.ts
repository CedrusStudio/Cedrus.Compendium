export class AiCharacterDraftNotFoundError extends Error {
  constructor() {
    super('AI character draft was not found.');
    this.name = 'AiCharacterDraftNotFoundError';
  }
}

export class AiCharacterDraftStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiCharacterDraftStateError';
  }
}
