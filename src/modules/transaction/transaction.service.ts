import prisma from "../../config/db";
import AppError from "../../utils/AppError";
import pick from "../../utils/pick";
import { calculatePagination, buildMeta, TPaginationOptions } from "../../utils/paginationHelper";
import { TCreateWithdrawalPayload, TTransactionFilters } from "./transaction.interface";

const getAllTransactions = async (query: Record<string, unknown>) => {
  const filters = pick(query, ["userId", "type"]) as TTransactionFilters;
  const paginationOptions = pick(query, ["page", "limit", "sortBy", "sortOrder"]) as TPaginationOptions;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const where = {
    ...(filters.userId && { userId: filters.userId }),
    ...(filters.type && { type: filters.type as never }),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { meta: buildMeta(page, limit, total), data: transactions };
};

const computeWallet = (transactions: { type: string; status: string; amount: number }[]) => {
  const totalEarnings = transactions
    .filter((t) => t.type === "EARNING" && t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawn = transactions
    .filter((t) => t.type === "WITHDRAWAL" && t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.amount, 0);

  return { totalEarnings, totalWithdrawn, availableBalance: totalEarnings - totalWithdrawn };
};

const getMyEarningsSummary = async (userId: string) => {
  const [transactions, withdrawals] = await Promise.all([
    prisma.transaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.withdrawal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);

  const { totalEarnings, totalWithdrawn, availableBalance } = computeWallet(transactions);

  return {
    totalEarnings,
    totalWithdrawn,
    availableBalance,
    pendingWithdrawals: withdrawals
      .filter((w) => w.status === "PENDING")
      .reduce((sum, w) => sum + w.amount, 0),
    history: transactions,
    withdrawals,
  };
};

// Withdraw request — allowed only up to the available balance.
const requestWithdrawal = async (userId: string, payload: TCreateWithdrawalPayload) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId, status: "COMPLETED" },
  });

  const { availableBalance } = computeWallet(transactions);

  if (payload.amount > availableBalance) {
    throw new AppError(400, `Insufficient balance — available ${availableBalance.toFixed(2)}`);
  }
  if (payload.amount < 50) {
    throw new AppError(400, "Minimum withdrawal amount is 50");
  }

  return prisma.withdrawal.create({
    data: {
      userId,
      amount: payload.amount,
      method: payload.method,
      accountHolder: payload.accountHolder,
      accountNumber: payload.accountNumber,
    },
  });
};

const getMyWithdrawals = async (userId: string) => {
  return prisma.withdrawal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
};

const getAllWithdrawals = async (query: Record<string, unknown>) => {
  const filters = pick(query, ["status", "method"]) as { status?: string; method?: string };
  const paginationOptions = pick(query, ["page", "limit", "sortBy", "sortOrder"]) as TPaginationOptions;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const where = {
    ...(filters.status && { status: filters.status as never }),
    ...(filters.method && { method: filters.method as never }),
  };

  const [withdrawals, total] = await Promise.all([
    prisma.withdrawal.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.withdrawal.count({ where }),
  ]);

  return { meta: buildMeta(page, limit, total), data: withdrawals };
};

// Admin approval sends the payment via the configured gateway (Bkash/Nagad/
// Rocket/Bank). For now the gateway is stubbed — the request transitions to
// COMPLETED and the wallet ledger records the payout atomically.
const reviewWithdrawal = async (
  id: string,
  status: "COMPLETED" | "REJECTED",
  adminNote?: string
) => {
  const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
  if (!withdrawal) throw new AppError(404, "Withdrawal request not found");
  if (withdrawal.status !== "PENDING") {
    throw new AppError(400, `This request has already been ${withdrawal.status.toLowerCase()}`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.withdrawal.update({
      where: { id },
      data: { status, adminNote, resolvedAt: new Date() },
    });

    if (status === "COMPLETED") {
      await tx.transaction.create({
        data: {
          userId: withdrawal.userId,
          amount: withdrawal.amount,
          type: "WITHDRAWAL",
          status: "COMPLETED",
          note: `Withdrawal via ${withdrawal.method} → ${withdrawal.accountNumber}`,
        },
      });
    }

    return updated;
  });
};

export const TransactionService = {
  getAllTransactions,
  getMyEarningsSummary,
  requestWithdrawal,
  getMyWithdrawals,
  getAllWithdrawals,
  reviewWithdrawal,
};