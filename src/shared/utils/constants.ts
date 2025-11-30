// Константы приложения

export const GLOBAL_SOUTH_REGIONS = [
  'Sub-Saharan Africa',
  'Latin America & Caribbean',
  'South Asia',
  'Southeast Asia',
  'Middle East & North Africa',
  'Central Asia',
] as const;

export const SOLUTION_CATEGORIES = [
  'Traffic Management',
  'Energy & Utilities',
  'Water Management',
  'Waste Management',
  'Public Safety',
  'Environmental Monitoring',
  'Citizen Services',
  'Infrastructure',
] as const;

export const MATURITY_LEVELS = [
  'concept',
  'prototype',
  'pilot',
  'production',
] as const;

export const USER_ROLES = [
  'developer',
  'municipality',
  'integrator',
] as const;

export const PROJECT_STATUSES = [
  'planning',
  'in_progress',
  'completed',
  'on_hold',
] as const;

export const CONNECTION_STATUSES = [
  'pending',
  'accepted',
  'rejected',
] as const;

export const CONNECTION_TYPES = [
  'partnership',
  'inquiry',
  'collaboration',
] as const;

export const RFP_STATUSES = [
  'draft',
  'published',
  'closed',
  'awarded',
] as const;

