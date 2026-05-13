import { z } from 'zod';

export const MIN_DEADLINE_MS = 10 * 60 * 1000;
export const MAX_DEADLINE_MS = 30 * 24 * 60 * 60 * 1000;

export const createPollSchema = z.object({
  question: z.string().trim().min(1).max(200),
  options: z.array(z.string().trim().min(1).max(100)).min(2).max(10),
  deadline: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), { message: 'deadline must be ISO datetime' }),
  publicDetails: z.boolean().optional().default(false),
});

export type CreatePollInput = z.infer<typeof createPollSchema>;

export function validateDeadlineMs(deadlineMs: number, nowMs: number): string | null {
  const delta = deadlineMs - nowMs;
  if (delta < MIN_DEADLINE_MS) return 'deadline_too_soon';
  if (delta > MAX_DEADLINE_MS) return 'deadline_too_far';
  return null;
}
