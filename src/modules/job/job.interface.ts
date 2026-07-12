export type TJobFilters = {
  searchTerm?: string;
};

export type TCreateJobPayload = {
  title: string;
  description: string;
  reward: number;
  proofRequirements: string;
};
