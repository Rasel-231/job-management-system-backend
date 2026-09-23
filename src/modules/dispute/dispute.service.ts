import prisma from "../../config/db";
import AppError from "../../utils/AppError";
import pick from "../../utils/pick";
import { calculatePagination, buildMeta, TPaginationOptions } from "../../utils/paginationHelper";
import { TCreateDisputePayload, TDisputeFilters } from "./dispute.interface";

const disputeInclude = {
  job: { select: { id: true, title: true, reward: true } },
  task: { select: { id: true, status: true, progress: true } },
  complainant: { select: { id: true, name: true, email: true, isVerified: true } },
  respondent: { select: { id: true, name: true, email: true, isVerified: true } },
} as const;

const isJobParticipant = async (userId: string, jobId: string): Promise<boolean> => {
  const [postedCount, appliedCount] = await Promise.all([
    prisma.job.count({ where: { id: jobId, postedById: userId } }),
    prisma.task.count({ where: { jobId, userId } }),
  ]);
  return postedCount > 0 || appliedCount > 0;
};

const createDispute = async (userId: string, payload: TCreateDisputePayload) => {
  if (payload.respondentId && userId === payload.respondentId) {
    throw new AppError(400, "You cannot open a dispute against yourself");
  }

  // Resolve the respondent by email if only the email is provided.
  let respondentId = payload.respondentId;
  if (!respondentId && payload.respondentEmail) {
    const respondent = await prisma.user.findUnique({ where: { email: payload.respondentEmail } });
    if (!respondent) throw new AppError(404, "Respondent not found — check their exact email");
    if (respondent.id === userId) {
      throw new AppError(400, "You cannot open a dispute against yourself");
    }
    respondentId = respondent.id;
  }

  const [job, respondentRes] = await Promise.all([
    prisma.job.findUnique({ where: { id: payload.jobId } }),
    respondentId ? prisma.user.findUnique({ where: { id: respondentId } }) : null,
  ]);
  if (!job) throw new AppError(404, "Job not found");
  if (!respondentRes) throw new AppError(404, "Respondent not found");

  // Only the two parties involved (job poster / applicant) may dispute.
  const complainantIsParty = await isJobParticipant(userId, payload.jobId);
  const respondentIsParty = await isJobParticipant(respondentId!, payload.jobId);
  if (!complainantIsParty || !respondentIsParty) {
    throw new AppError(403, "Both users must be involved in this job to open a dispute");
  }

  if (payload.taskId) {
    const task = await prisma.task.findUnique({ where: { id: payload.taskId } });
    if (!task || task.jobId !== payload.jobId) {
      throw new AppError(400, "Task does not belong to this job");
    }
  }

  return prisma.dispute.create({
    data: {
      jobId: payload.jobId,
      taskId: payload.taskId,
      complainantId: userId,
      respondentId: respondentId!,
      reason: payload.reason,
    },
    include: disputeInclude,
  });
};

const getMyDisputes = async (userId: string, query: Record<string, unknown>) => {
  const { page, limit, skip } = calculatePagination(pick(query, ["page", "limit"]) as TPaginationOptions);
  const where = { OR: [{ complainantId: userId }, { respondentId: userId }] };

  const [disputes, total] = await Promise.all([
    prisma.dispute.findMany({ where, include: disputeInclude, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.dispute.count({ where }),
  ]);

  return { meta: buildMeta(page, limit, total), data: disputes };
};

const getAllDisputes = async (query: Record<string, unknown>) => {
  const filters = pick(query, ["status"]) as TDisputeFilters;
  const paginationOptions = pick(query, ["page", "limit", "sortBy", "sortOrder"]) as TPaginationOptions;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const where = {
    ...(filters.status && { status: filters.status as never }),
  };

  const [disputes, total] = await Promise.all([
    prisma.dispute.findMany({
      where,
      include: disputeInclude,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.dispute.count({ where }),
  ]);

  return { meta: buildMeta(page, limit, total), data: disputes };
};

const resolveDispute = async (
  id: string,
  status: "RESOLVED" | "REJECTED",
  resolution?: string
) => {
  const dispute = await prisma.dispute.findUnique({ where: { id } });
  if (!dispute) throw new AppError(404, "Dispute not found");
  if (dispute.status === "RESOLVED" || dispute.status === "REJECTED") {
    throw new AppError(400, `Dispute already ${dispute.status.toLowerCase()}`);
  }

  return prisma.dispute.update({
    where: { id },
    data: {
      status,
      resolution: resolution ?? null,
      resolvedAt: new Date(),
    },
  });
};

export const DisputeService = {
  createDispute,
  getMyDisputes,
  getAllDisputes,
  resolveDispute,
};