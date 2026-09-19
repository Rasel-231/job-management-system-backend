export type TDisputeFilters = {
  status?: string;
};

export type TCreateDisputePayload = {
  jobId: string;
  taskId?: string;
  respondentId?: string;
  respondentEmail?: string;
  reason: string;
};