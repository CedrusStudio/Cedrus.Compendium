export class AiCharacterDraftAcceptanceConflictError extends Error
{
  readonly issues: string[];

  constructor(issues: string[])
  {
    super('AI character draft cannot be accepted in its current form.');
    this.name = 'AiCharacterDraftAcceptanceConflictError';
    this.issues = issues;
  }
}
