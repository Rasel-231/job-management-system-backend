export type TTaskFilters = {
  status?: string;
  jobId?: string;
};

export type TCreateTaskPayload = {
  jobId: string;
  submissionLink: string;
};
