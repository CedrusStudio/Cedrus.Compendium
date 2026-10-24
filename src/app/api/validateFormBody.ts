import { NextResponse } from 'next/server';
import type { ZodType } from 'zod';

export function validateFormBody<T>(body: unknown, schema: ZodType<T>)
{
  const parsed = schema.safeParse(body);
  if (parsed.success) return { success: true as const, data: parsed.data };
  return { success: false as const, response: NextResponse.json({
    message: parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane formularza',
    issues: parsed.error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })),
  }, { status: 400 }) };
}
