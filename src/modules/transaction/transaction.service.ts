import prisma from "../../config/db";
import pick from "../../utils/pick";
import { calculatePagination, buildMeta, TPaginationOptions } from "../../utils/paginationHelper";
import { TTransactionFilters } from "./transaction.interface";

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

const getMyEarningsSummary = async (userId: string) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const totalEarnings = transactions
    .filter((t) => t.type === "EARNING" && t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawn = transactions
    .filter((t) => t.type === "WITHDRAWAL" && t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalEarnings,
    totalWithdrawn,
    availableBalance: totalEarnings - totalWithdrawn,
    history: transactions,
  };
};

export const TransactionService = { getAllTransactions, getMyEarningsSummary };
