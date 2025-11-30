import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodSchema } from 'zod';

export function useValidatedForm<T extends Record<string, unknown>>(
  schema: ZodSchema<T>,
  defaultValues?: Partial<T>
): UseFormReturn<T> {
  return useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as T,
    mode: 'onBlur', // Validate on blur for better UX
  });
}

