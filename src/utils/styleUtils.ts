/**
 * Style utility functions
 * Provides consistent color schemes and CSS classes across the application
 */

import {
  PROJECT_STATUSES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  RFP_STATUSES,
  BID_STATUSES,
  MILESTONE_STATUSES,
  COMPLIANCE_STATUSES,
  PAYMENT_STATUSES,
  CONNECTION_STATUSES,
  DOCUMENT_CATEGORIES,
  WORKFLOW_CATEGORIES,
  type ProjectStatus,
  type TaskStatus,
  type TaskPriority,
  type RFPStatus,
  type BidStatus,
  type MilestoneStatus,
  type ComplianceStatus,
  type PaymentStatus,
  type ConnectionStatus,
  type DocumentCategory,
  type WorkflowCategory,
} from './constants';

/**
 * Color scheme for different status types
 * Using Tailwind CSS classes
 */

export const getProjectStatusColor = (status: ProjectStatus): string => {
  const colorMap: Record<ProjectStatus, string> = {
    [PROJECT_STATUSES.PLANNING]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    [PROJECT_STATUSES.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    [PROJECT_STATUSES.ON_HOLD]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    [PROJECT_STATUSES.COMPLETED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [PROJECT_STATUSES.CANCELLED]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

export const getTaskStatusColor = (status: TaskStatus): string => {
  const colorMap: Record<TaskStatus, string> = {
    [TASK_STATUSES.TODO]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    [TASK_STATUSES.IN_PROGRESS]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    [TASK_STATUSES.REVIEW]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    [TASK_STATUSES.COMPLETED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [TASK_STATUSES.BLOCKED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

export const getTaskPriorityColor = (priority: TaskPriority): string => {
  const colorMap: Record<TaskPriority, string> = {
    [TASK_PRIORITIES.LOW]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    [TASK_PRIORITIES.MEDIUM]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    [TASK_PRIORITIES.HIGH]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    [TASK_PRIORITIES.CRITICAL]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  return colorMap[priority] || 'bg-gray-100 text-gray-800';
};

export const getRFPStatusColor = (status: RFPStatus): string => {
  const colorMap: Record<RFPStatus, string> = {
    [RFP_STATUSES.DRAFT]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    [RFP_STATUSES.PUBLISHED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [RFP_STATUSES.CLOSED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    [RFP_STATUSES.CANCELLED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

export const getBidStatusColor = (status: BidStatus): string => {
  const colorMap: Record<BidStatus, string> = {
    [BID_STATUSES.DRAFT]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    [BID_STATUSES.SUBMITTED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    [BID_STATUSES.UNDER_REVIEW]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    [BID_STATUSES.ACCEPTED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [BID_STATUSES.REJECTED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    [BID_STATUSES.WITHDRAWN]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

export const getMilestoneStatusColor = (status: MilestoneStatus): string => {
  const colorMap: Record<MilestoneStatus, string> = {
    [MILESTONE_STATUSES.PENDING]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    [MILESTONE_STATUSES.IN_PROGRESS]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    [MILESTONE_STATUSES.COMPLETED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [MILESTONE_STATUSES.DELAYED]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    [MILESTONE_STATUSES.OVERDUE]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

export const getComplianceStatusColor = (status: ComplianceStatus): string => {
  const colorMap: Record<ComplianceStatus, string> = {
    [COMPLIANCE_STATUSES.COMPLIANT]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [COMPLIANCE_STATUSES.NON_COMPLIANT]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    [COMPLIANCE_STATUSES.PARTIAL]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    [COMPLIANCE_STATUSES.PENDING]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

export const getPaymentStatusColor = (status: PaymentStatus): string => {
  const colorMap: Record<PaymentStatus, string> = {
    [PAYMENT_STATUSES.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    [PAYMENT_STATUSES.PAID]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [PAYMENT_STATUSES.OVERDUE]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    [PAYMENT_STATUSES.CANCELLED]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

export const getConnectionStatusColor = (status: ConnectionStatus): string => {
  const colorMap: Record<ConnectionStatus, string> = {
    [CONNECTION_STATUSES.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    [CONNECTION_STATUSES.ACCEPTED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [CONNECTION_STATUSES.REJECTED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    [CONNECTION_STATUSES.BLOCKED]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

export const getDocumentCategoryColor = (category: DocumentCategory): string => {
  const colorMap: Record<DocumentCategory, string> = {
    [DOCUMENT_CATEGORIES.CONTRACT]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    [DOCUMENT_CATEGORIES.REQUIREMENT]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    [DOCUMENT_CATEGORIES.DESIGN]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [DOCUMENT_CATEGORIES.REPORT]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    [DOCUMENT_CATEGORIES.OTHER]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };
  return colorMap[category] || 'bg-gray-100 text-gray-800';
};

export const getWorkflowCategoryColor = (category: WorkflowCategory): string => {
  const colorMap: Record<WorkflowCategory, string> = {
    [WORKFLOW_CATEGORIES.SOFTWARE]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    [WORKFLOW_CATEGORIES.INFRASTRUCTURE]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    [WORKFLOW_CATEGORIES.SERVICE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  };
  return colorMap[category] || 'bg-gray-100 text-gray-800';
};

/**
 * Icon color classes (for lucide-react icons)
 */
export const getTaskPriorityIconColor = (priority: TaskPriority): string => {
  const colorMap: Record<TaskPriority, string> = {
    [TASK_PRIORITIES.LOW]: 'text-gray-500',
    [TASK_PRIORITIES.MEDIUM]: 'text-blue-500',
    [TASK_PRIORITIES.HIGH]: 'text-orange-500',
    [TASK_PRIORITIES.CRITICAL]: 'text-red-500',
  };
  return colorMap[priority] || 'text-gray-500';
};

export const getTaskStatusIconColor = (status: TaskStatus): string => {
  const colorMap: Record<TaskStatus, string> = {
    [TASK_STATUSES.TODO]: 'text-gray-500',
    [TASK_STATUSES.IN_PROGRESS]: 'text-blue-500',
    [TASK_STATUSES.REVIEW]: 'text-purple-500',
    [TASK_STATUSES.COMPLETED]: 'text-green-500',
    [TASK_STATUSES.BLOCKED]: 'text-red-500',
  };
  return colorMap[status] || 'text-gray-500';
};

/**
 * Border color classes
 */
export const getTaskPriorityBorderColor = (priority: TaskPriority): string => {
  const colorMap: Record<TaskPriority, string> = {
    [TASK_PRIORITIES.LOW]: 'border-gray-300',
    [TASK_PRIORITIES.MEDIUM]: 'border-blue-300',
    [TASK_PRIORITIES.HIGH]: 'border-orange-300',
    [TASK_PRIORITIES.CRITICAL]: 'border-red-300',
  };
  return colorMap[priority] || 'border-gray-300';
};

/**
 * Generic status color function
 * Use this when the status type is dynamic
 */
export const getStatusColor = (
  status: string,
  type: 'project' | 'task' | 'rfp' | 'bid' | 'milestone' | 'compliance' | 'payment' | 'connection'
): string => {
  switch (type) {
    case 'project':
      return getProjectStatusColor(status as ProjectStatus);
    case 'task':
      return getTaskStatusColor(status as TaskStatus);
    case 'rfp':
      return getRFPStatusColor(status as RFPStatus);
    case 'bid':
      return getBidStatusColor(status as BidStatus);
    case 'milestone':
      return getMilestoneStatusColor(status as MilestoneStatus);
    case 'compliance':
      return getComplianceStatusColor(status as ComplianceStatus);
    case 'payment':
      return getPaymentStatusColor(status as PaymentStatus);
    case 'connection':
      return getConnectionStatusColor(status as ConnectionStatus);
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Common CSS class combinations
 */
export const BADGE_CLASSES = 'px-3 py-1 rounded-full text-sm font-medium inline-block';
export const BUTTON_PRIMARY_CLASSES =
  'px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium disabled:opacity-50';
export const BUTTON_SECONDARY_CLASSES =
  'px-4 py-2 border border-themed-primary text-themed-secondary hover:bg-themed-hover rounded-lg transition font-medium';
export const BUTTON_DANGER_CLASSES =
  'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50';
export const INPUT_CLASSES =
  'w-full px-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary';
export const CARD_CLASSES = 'bg-white dark:bg-[#111111] rounded-xl p-6 border border-gray-200 dark:border-[#1a1a1a]';
export const MODAL_OVERLAY_CLASSES = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
export const MODAL_CONTENT_CLASSES =
  'bg-themed-secondary rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-themed-primary';
