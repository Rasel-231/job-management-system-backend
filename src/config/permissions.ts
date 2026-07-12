// Centralized RBAC map — the single source of truth for what each role can do.
// Routes never hardcode role checks; they declare a Permission and this file
// decides which roles satisfy it. Adding a new role is a one-line change here.

export enum Permission {
  USER_VIEW_ALL = "user:view_all",
  USER_UPDATE_STATUS = "user:update_status",

  JOB_CREATE = "job:create",
  JOB_UPDATE = "job:update",
  JOB_DELETE = "job:delete",
  JOB_VIEW = "job:view",

  TASK_SUBMIT = "task:submit",
  TASK_VIEW_OWN = "task:view_own",
  TASK_VIEW_ALL = "task:view_all",
  TASK_REVIEW = "task:review",

  TRANSACTION_VIEW_ALL = "transaction:view_all",
  TRANSACTION_VIEW_OWN = "transaction:view_own",
}

export const RolePermissions: Record<string, Permission[]> = {
  ADMIN: [
    Permission.USER_VIEW_ALL,
    Permission.USER_UPDATE_STATUS,
    Permission.JOB_CREATE,
    Permission.JOB_UPDATE,
    Permission.JOB_DELETE,
    Permission.JOB_VIEW,
    Permission.TASK_VIEW_ALL,
    Permission.TASK_REVIEW,
    Permission.TRANSACTION_VIEW_ALL,
  ],
  USER: [
    Permission.JOB_VIEW,
    Permission.TASK_SUBMIT,
    Permission.TASK_VIEW_OWN,
    Permission.TRANSACTION_VIEW_OWN,
  ],
};

export const hasPermission = (role: string, permission: Permission): boolean => {
  return RolePermissions[role]?.includes(permission) ?? false;
};
