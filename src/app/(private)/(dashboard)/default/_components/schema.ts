import { z } from 'zod';

export const sectionSchema = z.object({
  id: z.number(),
  type: z.string(),
  limit: z.string(),
  header: z.string(),
  status: z.string(),
  target: z.string(),
  reviewer: z.string(),
});
