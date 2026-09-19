export type TVerificationFilters = {
  status?: string;
  type?: string;
};

export type TCreateVerificationPayload = {
  type: "NID" | "BIRTH_CERTIFICATE";
  documentNumber?: string;
};