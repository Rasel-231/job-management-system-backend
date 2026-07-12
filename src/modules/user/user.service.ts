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
  role: true,
  status: true,
  avatarUrl: true,
  createdAt: true,
} as const;

const getAllUsers = async (query: Record<string, unknown>) => {
  const filters = pick(query, ["searchTerm", "status", "role"]) as TUserFilters;
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

export const UserService = { getAllUsers, getSingleUser, updateUserStatus };
