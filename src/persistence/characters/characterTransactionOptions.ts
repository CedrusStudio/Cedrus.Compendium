// Character relation writes can exceed Prisma's default 5 seconds over a remote
// database connection. Keep both guarded form saves and scope writes consistent.
export const characterTransactionOptions = { timeout: 10_000 } as const;
