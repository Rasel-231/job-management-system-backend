import prisma from "../../config/db";
import AppError from "../../utils/AppError";
import pick from "../../utils/pick";
import { buildWhereClause } from "../../utils/queryBuilder";
import { calculatePagination, buildMeta, TPaginationOptions } from "../../utils/paginationHelper";
import { TUserFilters } from "./user.interface";

const searchableFields = ["name", "email"];

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatarUrl: true,
  role: true,
  accountType: true,
  authProvider: true,
  status: true,
  isVerified: true,
  isPhoneVerified: true,
  warnings: true,
  createdAt: true,
} as const;

const getAllUsers = async (query: Record<string, unknown>) => {
  const filters = pick(query, ["searchTerm", "status", "role", "accountType", "isVerified"]) as TUserFilters;
  const paginationOptions = pick(query, ["page", "limit", "sortBy", "sortOrder"]) as TPaginationOptions;

  const { searchTerm, ...restFilters } = filters;
  const where = buildWhereClause({ searchTerm, searchableFields, filters: restFilters });
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: safeUserSelect,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { meta: buildMeta(page, limit, total), data: users };
};

const getSingleUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id }, select: safeUserSelect });
  if (!user) throw new AppError(404, "User not found");
  return user;
};

const updateUserStatus = async (id: string, status: "PENDING" | "ACTIVE" | "BLOCKED") => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, "User not found");

  return prisma.user.update({ where: { id }, data: { status }, select: safeUserSelect });
};

const updateUserWarnings = async (id: string, action: "warn" | "clear") => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, "User not found");

  const warnings = action === "warn" ? user.warnings + 1 : 0;

  return prisma.user.update({ where: { id }, data: { warnings }, select: safeUserSelect });
};

const updateUser = async (
  id: string,
  payload: {
    name?: string;
    email?: string;
    phone?: string | null;
    role?: "ADMIN" | "USER";
    accountType?: "JOB_SEEKER" | "JOB_POSTER" | "BOTH";
    status?: "PENDING" | "ACTIVE" | "BLOCKED";
    isVerified?: boolean;
    isPhoneVerified?: boolean;
  }
) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, "User not found");

  if (payload.email && payload.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) throw new AppError(409, "Email is already in use");
  }

  const data = pick(payload, [
    "name",
    "email",
    "phone",
    "role",
    "accountType",
    "status",
    "isVerified",
    "isPhoneVerified",
  ]);

  return prisma.user.update({ where: { id }, data, select: safeUserSelect });
};

const deleteUser = async (id: string, actingUserId: string) => {
  if (id === actingUserId) {
    throw new AppError(400, "You cannot delete your own account");
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, "User not found");

  return prisma.user.delete({ where: { id }, select: { id: true, name: true, email: true } });
};

export const UserService = {
  getAllUsers,
  getSingleUser,
  updateUserStatus,
  updateUserWarnings,
  updateUser,
  deleteUser,
};