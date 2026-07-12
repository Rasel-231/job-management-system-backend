import prisma from "../../config/db";
import AppError from "../../utils/AppError";
import pick from "../../utils/pick";
import { buildWhereClause } from "../../utils/queryBuilder";
import { calculatePagination, buildMeta, TPaginationOptions } from "../../utils/paginationHelper";
import { uploadBufferToCloudinary } from "../../utils/cloudinaryUpload";
import { TCreateJobPayload, TJobFilters } from "./job.interface";

const searchableFields = ["title", "description"];

const getAllJobs = async (query: Record<string, unknown>) => {
  const filters = pick(query, ["searchTerm"]) as TJobFilters;
  const paginationOptions = pick(query, ["page", "limit", "sortBy", "sortOrder"]) as TPaginationOptions;

  const { searchTerm } = filters;
  const where = buildWhereClause({ searchTerm, searchableFields, filters: {} });
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        postedBy: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);

  return { meta: buildMeta(page, limit, total), data: jobs };
};

const getSingleJob = async (id: string) => {
  const job = await prisma.job.findUnique({
    where: { id },
    include: { postedBy: { select: { id: true, name: true } } },
  });
  if (!job) throw new AppError(404, "Job not found");
  return job;
};

const createJob = async (
  postedById: string,
  payload: TCreateJobPayload,
  file?: Express.Multer.File
) => {
  let imageUrl: string | undefined;

  if (file) {
    const uploaded = await uploadBufferToCloudinary(file, "job-management/jobs");
    imageUrl = uploaded.url;
  }

  return prisma.job.create({
    data: { ...payload, postedById, imageUrl },
  });
};

const updateJob = async (
  id: string,
  payload: Partial<TCreateJobPayload>,
  file?: Express.Multer.File
) => {
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) throw new AppError(404, "Job not found");

  let imageUrl = job.imageUrl;
  if (file) {
    const uploaded = await uploadBufferToCloudinary(file, "job-management/jobs");
    imageUrl = uploaded.url;
  }

  return prisma.job.update({ where: { id }, data: { ...payload, imageUrl } });
};

const deleteJob = async (id: string): Promise<null> => {
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) throw new AppError(404, "Job not found");

  await prisma.job.delete({ where: { id } });
  return null;
};

export const JobService = { getAllJobs, getSingleJob, createJob, updateJob, deleteJob };
