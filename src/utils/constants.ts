/**
 * Application-wide constants
 * Centralizes all magic strings and enums for consistency
 */

// User Roles
export const USER_ROLES = {
  MUNICIPALITY: 'municipality',
  DEVELOPER: 'developer',
  INTEGRATOR: 'integrator',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Project Statuses
export const PROJECT_STATUSES = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type ProjectStatus = typeof PROJECT_STATUSES[keyof typeof PROJECT_STATUSES];

// Project Phases
export const PROJECT_PHASES = {
  INITIATION: 'initiation',
  PLANNING: 'planning',
  EXECUTION: 'execution',
  MONITORING: 'monitoring',
  CLOSURE: 'closure',
} as const;

export type ProjectPhase = typeof PROJECT_PHASES[keyof typeof PROJECT_PHASES];

// Task Statuses
export const TASK_STATUSES = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
} as const;

export type TaskStatus = typeof TASK_STATUSES[keyof typeof TASK_STATUSES];

// Task Priorities
export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type TaskPriority = typeof TASK_PRIORITIES[keyof typeof TASK_PRIORITIES];

// RFP Statuses
export const RFP_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const;

export type RFPStatus = typeof RFP_STATUSES[keyof typeof RFP_STATUSES];

// Bid Statuses
export const BID_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;

export type BidStatus = typeof BID_STATUSES[keyof typeof BID_STATUSES];

// Document Categories
export const DOCUMENT_CATEGORIES = {
  CONTRACT: 'contract',
  REQUIREMENT: 'requirement',
  DESIGN: 'design',
  REPORT: 'report',
  OTHER: 'other',
} as const;

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[keyof typeof DOCUMENT_CATEGORIES];

// Workflow Categories
export const WORKFLOW_CATEGORIES = {
  SOFTWARE: 'software',
  INFRASTRUCTURE: 'infrastructure',
  SERVICE: 'service',
} as const;

export type WorkflowCategory = typeof WORKFLOW_CATEGORIES[keyof typeof WORKFLOW_CATEGORIES];

// Milestone Statuses
export const MILESTONE_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DELAYED: 'delayed',
  OVERDUE: 'overdue',
} as const;

export type MilestoneStatus = typeof MILESTONE_STATUSES[keyof typeof MILESTONE_STATUSES];

// Compliance Statuses
export const COMPLIANCE_STATUSES = {
  COMPLIANT: 'compliant',
  NON_COMPLIANT: 'non_compliant',
  PARTIAL: 'partial',
  PENDING: 'pending',
} as const;

export type ComplianceStatus = typeof COMPLIANCE_STATUSES[keyof typeof COMPLIANCE_STATUSES];

// Payment Statuses
export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUSES[keyof typeof PAYMENT_STATUSES];

// Connection Statuses
export const CONNECTION_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  BLOCKED: 'blocked',
} as const;

export type ConnectionStatus = typeof CONNECTION_STATUSES[keyof typeof CONNECTION_STATUSES];

// Audit Log Event Types
export const AUDIT_EVENT_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  EXPORT: 'export',
  IMPORT: 'import',
  ACCESS: 'access',
  FAILURE: 'failure',
} as const;

export type AuditEventType = typeof AUDIT_EVENT_TYPES[keyof typeof AUDIT_EVENT_TYPES];

// RFP Categories
export const RFP_CATEGORIES = {
  TRAFFIC_MANAGEMENT: 'Traffic Management',
  WASTE_MANAGEMENT: 'Waste Management',
  ENERGY_EFFICIENCY: 'Energy Efficiency',
  PUBLIC_SAFETY: 'Public Safety',
  WATER_MANAGEMENT: 'Water Management',
  PARKING_SOLUTIONS: 'Parking Solutions',
  ENVIRONMENTAL_MONITORING: 'Environmental Monitoring',
  CITIZEN_ENGAGEMENT: 'Citizen Engagement',
  INFRASTRUCTURE: 'Infrastructure',
  OTHER: 'Other',
} as const;

export type RFPCategory = typeof RFP_CATEGORIES[keyof typeof RFP_CATEGORIES];

// Regions
export const REGIONS = {
  NORTH_AMERICA: 'North America',
  EUROPE: 'Europe',
  ASIA_PACIFIC: 'Asia Pacific',
  LATIN_AMERICA: 'Latin America',
  MIDDLE_EAST: 'Middle East',
  AFRICA: 'Africa',
  OCEANIA: 'Oceania',
} as const;

export type Region = typeof REGIONS[keyof typeof REGIONS];

// Currencies
export const CURRENCIES = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  CAD: 'CAD',
  AUD: 'AUD',
  JPY: 'JPY',
  CNY: 'CNY',
  INR: 'INR',
  BRL: 'BRL',
  MXN: 'MXN',
} as const;

export type Currency = typeof CURRENCIES[keyof typeof CURRENCIES];

// Helper functions for type guards
export const isValidUserRole = (role: string): role is UserRole => {
  return Object.values(USER_ROLES).includes(role as UserRole);
};

export const isValidProjectStatus = (status: string): status is ProjectStatus => {
  return Object.values(PROJECT_STATUSES).includes(status as ProjectStatus);
};

export const isValidTaskStatus = (status: string): status is TaskStatus => {
  return Object.values(TASK_STATUSES).includes(status as TaskStatus);
};

export const isValidTaskPriority = (priority: string): priority is TaskPriority => {
  return Object.values(TASK_PRIORITIES).includes(priority as TaskPriority);
};

// Display labels for better UX
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [PROJECT_STATUSES.PLANNING]: 'Planning',
  [PROJECT_STATUSES.IN_PROGRESS]: 'In Progress',
  [PROJECT_STATUSES.ON_HOLD]: 'On Hold',
  [PROJECT_STATUSES.COMPLETED]: 'Completed',
  [PROJECT_STATUSES.CANCELLED]: 'Cancelled',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TASK_STATUSES.TODO]: 'To Do',
  [TASK_STATUSES.IN_PROGRESS]: 'In Progress',
  [TASK_STATUSES.REVIEW]: 'In Review',
  [TASK_STATUSES.COMPLETED]: 'Completed',
  [TASK_STATUSES.BLOCKED]: 'Blocked',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TASK_PRIORITIES.LOW]: 'Low',
  [TASK_PRIORITIES.MEDIUM]: 'Medium',
  [TASK_PRIORITIES.HIGH]: 'High',
  [TASK_PRIORITIES.CRITICAL]: 'Critical',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.MUNICIPALITY]: 'Municipality',
  [USER_ROLES.DEVELOPER]: 'Developer',
  [USER_ROLES.INTEGRATOR]: 'Integrator',
};
