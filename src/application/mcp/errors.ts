export class CompendiumToolError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

export function unavailable(): never {
  throw new CompendiumToolError(404, 'The requested entry is unavailable.');
}
