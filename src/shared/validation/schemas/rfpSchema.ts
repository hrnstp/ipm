import { z } from 'zod';

export const createRFPSchema = z.object({
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must not exceed 200 characters'),
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .max(5000, 'Description must not exceed 5000 characters'),
  category: z.string().min(1, 'Category is required'),
  budget_min: z.number()
    .positive('Minimum budget must be positive')
    .refine((val) => val > 0, 'Minimum budget must be greater than 0'),
  budget_max: z.number()
    .positive('Maximum budget must be positive')
    .refine((val, ctx) => {
      const min = ctx.parent.budget_min;
      return val >= min;
    }, 'Maximum budget must be greater than or equal to minimum budget'),
  currency: z.string().length(3, 'Currency must be a 3-letter code (e.g., USD)'),
  deadline: z.string()
    .refine((val) => {
      const date = new Date(val);
      return date > new Date();
    }, 'Deadline must be in the future'),
  requirements: z.object({
    technical: z.array(z.string()).optional(),
    functional: z.array(z.string()).optional(),
    compliance: z.array(z.string()).optional(),
    timeline: z.string().optional(),
    budget: z.string().optional(),
  }).default({}),
  evaluation_criteria: z.object({
    technical_score: z.number().min(0).max(100).optional(),
    price_score: z.number().min(0).max(100).optional(),
    experience_score: z.number().min(0).max(100).optional(),
    timeline_score: z.number().min(0).max(100).optional(),
    total_weight: z.number().min(0).max(100).optional(),
  }).default({}),
  status: z.enum(['draft', 'published', 'closed', 'awarded']).default('draft'),
  municipality_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
}).refine((data) => {
  const total = (data.evaluation_criteria.technical_score || 0) +
                (data.evaluation_criteria.price_score || 0) +
                (data.evaluation_criteria.experience_score || 0) +
                (data.evaluation_criteria.timeline_score || 0);
  return total <= 100;
}, {
  message: 'Total evaluation criteria weights must not exceed 100%',
  path: ['evaluation_criteria'],
});

export const updateRFPSchema = createRFPSchema.partial();

export const createBidSchema = z.object({
  rfp_id: z.string().uuid('Invalid RFP ID'),
  solution_id: z.string().uuid('Invalid solution ID'),
  proposal_text: z.string()
    .min(100, 'Proposal must be at least 100 characters')
    .max(10000, 'Proposal must not exceed 10000 characters'),
  price: z.number()
    .positive('Price must be positive'),
  currency: z.string().length(3, 'Currency must be a 3-letter code'),
  timeline: z.string()
    .min(1, 'Timeline is required')
    .max(200, 'Timeline must not exceed 200 characters'),
});

export type CreateRFPInput = z.infer<typeof createRFPSchema>;
export type UpdateRFPInput = z.infer<typeof updateRFPSchema>;
export type CreateBidInput = z.infer<typeof createBidSchema>;

