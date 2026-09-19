export enum Permission {
  USER_VIEW_ALL = "user:view_all",
  USER_UPDATE_STATUS = "user:update_status",

  JOB_CREATE = "job:create",
  JOB_UPDATE = "job:update",
  JOB_DELETE = "job:delete",
  JOB_VIEW = "job:view",
  JOB_LIKE = "job:like",
  JOB_COMMENT = "job:comment",

  TASK_APPLY = "task:apply",
  TASK_VIEW_OWN = "task:view_own",
  TASK_UPDATE_PROGRESS = "task:update_progress",
  TASK_VIEW_ALL = "task:view_all",
  TASK_REVIEW = "task:review",

  TRANSACTION_VIEW_ALL = "transaction:view_all",
  TRANSACTION_VIEW_OWN = "transaction:view_own",

  VERIFICATION_SUBMIT = "verification:submit",
  VERIFICATION_VIEW_ALL = "verification:view_all",
  VERIFICATION_REVIEW = "verification:review",

  WITHDRAWAL_CREATE = "withdrawal:create",
  WITHDRAWAL_VIEW_OWN = "withdrawal:view_own",
  WITHDRAWAL_VIEW_ALL = "withdrawal:view_all",
  WITHDRAWAL_REVIEW = "withdrawal:review",

  DISPUTE_CREATE = "dispute:create",
  DISPUTE_VIEW_OWN = "dispute:view_own",
  DISPUTE_VIEW_ALL = "dispute:view_all",
  DISPUTE_RESOLVE = "dispute:resolve",
}

export const RolePermissions: Record<string, Permission[]> = {
  ADMIN: [
    Permission.USER_VIEW_ALL,
    Permission.USER_UPDATE_STATUS,
    Permission.JOB_CREATE,
    Permission.JOB_UPDATE,
    Permission.JOB_DELETE,
    Permission.JOB_VIEW,
    Permission.JOB_LIKE,
    Permission.JOB_COMMENT,
    Permission.TASK_APPLY,
    Permission.TASK_UPDATE_PROGRESS,
    Permission.TASK_VIEW_OWN,
    Permission.TASK_VIEW_ALL,
    Permission.TASK_REVIEW,
    Permission.TRANSACTION_VIEW_ALL,
    Permission.TRANSACTION_VIEW_OWN,
    Permission.VERIFICATION_VIEW_ALL,
    Permission.VERIFICATION_REVIEW,
    Permission.WITHDRAWAL_VIEW_ALL,
    Permission.WITHDRAWAL_REVIEW,
    Permission.WITHDRAWAL_CREATE,
    Permission.WITHDRAWAL_VIEW_OWN,
    Permission.DISPUTE_CREATE,
    Permission.DISPUTE_VIEW_OWN,
    Permission.DISPUTE_VIEW_ALL,
    Permission.DISPUTE_RESOLVE,
  ],
  USER: [
    Permission.JOB_VIEW,
    Permission.JOB_LIKE,
    Permission.JOB_COMMENT,
    Permission.JOB_CREATE,
    Permission.JOB_UPDATE,
    Permission.JOB_DELETE,
    Permission.TASK_APPLY,
    Permission.TASK_VIEW_OWN,
    Permission.TASK_UPDATE_PROGRESS,
    Permission.TASK_REVIEW,
    Permission.TRANSACTION_VIEW_OWN,
    Permission.VERIFICATION_SUBMIT,
    Permission.WITHDRAWAL_CREATE,
    Permission.WITHDRAWAL_VIEW_OWN,
    Permission.DISPUTE_CREATE,
    Permission.DISPUTE_VIEW_OWN,
  ],
};

export const hasPermission = (role: string, permission: Permission): boolean => {
  return RolePermissions[role]?.includes(permission) ?? false;
};

export const isPoster = (accountType: string | undefined): boolean =>
  accountType === "JOB_POSTER" || accountType === "BOTH";

export const isSeeker = (accountType: string | undefined): boolean =>
  accountType === "JOB_SEEKER" || accountType === "BOTH";