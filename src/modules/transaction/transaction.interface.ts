export type TTransactionFilters = {
  userId?: string;
  type?: string;
};

export type TCreateWithdrawalPayload = {
  amount: number;
  method: "BKASH" | "NAGAD" | "ROCKET" | "BANK_TRANSFER";
  accountHolder: string;
  accountNumber: string;
};