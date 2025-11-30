import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  organization: z.string().min(2, 'Organization name is required').max(200),
  country: z.string().min(2, 'Country is required'),
  region: z.string().min(1, 'Region is required'),
  role: z.enum(['developer', 'municipality', 'integrator'], {
    errorMap: () => ({ message: 'Invalid role selected' })
  }),
  bio: z.string().max(1000).optional(),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

