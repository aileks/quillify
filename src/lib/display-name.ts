import { z } from 'zod';

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(25, 'Name must be at most 25 characters')
  .regex(/^[a-zA-Z0-9 ]+$/, 'Name can only contain letters, numbers, and spaces');
