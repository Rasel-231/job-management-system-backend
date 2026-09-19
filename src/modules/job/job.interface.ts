export type TJobFilters = {
  searchTerm?: string;
  category?: string;
  status?: string;
};

export type TJobStepInput = {
  title: string;
  description?: string;
};

export type TCreateJobPayload = {
  title: string;
  description: string;
  requirements?: string;
  proofRequirements: string;
  reward: number;
  category: string;
  deadline?: string | null;
  steps?: string | TJobStepInput[];
};

export type TUpdateJobPayload = Partial<TCreateJobPayload> & {
  status?: "OPEN" | "IN_PROGRESS" | "CLOSED" | "CANCELLED";
};