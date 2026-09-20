export type TTaskFilters = {
  status?: string;
  jobId?: string;
};

export type TApplyToJobPayload = {
  jobId: string;
};

export type TSubmitProofPayload = {
  submissionLink?: string;
  proofNote?: string;
};