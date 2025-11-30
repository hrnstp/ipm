import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .optional(),
  organization: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(200, 'Organization name must not exceed 200 characters')
    .optional(),
  country: z.string().min(2, 'Country is required').optional(),
  region: z.string().min(1, 'Region is required').optional(),
  bio: z.string().max(1000, 'Bio must not exceed 1000 characters').optional(),
  avatar_url: z.string().url('Invalid URL').optional().nullable(),
});

export const municipalityProfileSchema = z.object({
  city_name: z.string().min(2, 'City name is required'),
  population: z.number().int().positive().optional(),
  budget_range: z.string().optional(),
  language: z.string().min(2, 'Language is required'),
  priorities: z.array(z.string()).default([]),
  challenges: z.array(z.string()).default([]),
  existing_infrastructure: z.record(z.unknown()).default({}),
  preferred_solutions: z.array(z.string()).default([]),
  contact_info: z.record(z.unknown()).default({}),
});

export const integratorProfileSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  expertise_areas: z.array(z.string()).default([]),
  service_regions: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  past_projects: z.array(z.record(z.unknown())).default([]),
  languages: z.array(z.string()).default([]),
  capacity: z.string().max(200).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type MunicipalityProfileInput = z.infer<typeof municipalityProfileSchema>;
export type IntegratorProfileInput = z.infer<typeof integratorProfileSchema>;

