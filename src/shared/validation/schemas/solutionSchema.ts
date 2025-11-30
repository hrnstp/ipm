import { z } from 'zod';

export const createSolutionSchema = z.object({
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must not exceed 200 characters'),
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .max(5000, 'Description must not exceed 5000 characters'),
  category: z.string().min(1, 'Category is required'),
  maturity_level: z.enum(['concept', 'prototype', 'pilot', 'production'], {
    errorMap: () => ({ message: 'Invalid maturity level' })
  }),
  technologies: z.array(z.string()).default([]),
  target_regions: z.array(z.string()).default([]),
  price_model: z.string().max(200).optional(),
  implementation_time: z.string().max(100).optional(),
  adaptability_score: z.number()
    .int()
    .min(1, 'Adaptability score must be between 1 and 10')
    .max(10, 'Adaptability score must be between 1 and 10')
    .optional(),
  case_studies: z.array(z.object({
    title: z.string(),
    location: z.string(),
    description: z.string(),
    results: z.string().optional(),
    year: z.number().int().positive().optional(),
  })).default([]),
  requirements: z.object({
    infrastructure: z.array(z.string()).optional(),
    technical: z.array(z.string()).optional(),
    regulatory: z.array(z.string()).optional(),
    budget_min: z.number().positive().optional(),
    budget_max: z.number().positive().optional(),
    timeline: z.string().optional(),
  }).default({}),
});

export const updateSolutionSchema = createSolutionSchema.partial();

export type CreateSolutionInput = z.infer<typeof createSolutionSchema>;
export type UpdateSolutionInput = z.infer<typeof updateSolutionSchema>;

