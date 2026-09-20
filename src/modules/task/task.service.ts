import prisma from "../../config/db";
import AppError from "../../utils/AppError";
import pick from "../../utils/pick";
import { isSeeker } from "../../config/permissions";
import { calculatePagination, buildMeta, TPaginationOptions } from "../../utils/paginationHelper";
import { uploadBufferToCloudinary } from "../../utils/cloudinaryUpload";
import { TApplyToJobPayload, TSubmitProofPayload, TTaskFilters } from "./task.interface";

const taskInclude = {
  job: {
    include: {
      postedBy: { select: { id: true, name: true, avatarUrl: true, isVerified: true } },
    },
  },
  taskSteps: { orderBy: { order: "asc" } },
  user: { select: { id: true, name: true, email: true, avatarUrl: true, isVerified: true } },
} as const;

const isActiveApplication = (status: string) =>
  ["PENDING", "IN_PROGRESS", "SUBMITTED"].includes(status);

const assertSeeker = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "User not found");
  if (!isSeeker(user.accountType)) {
    throw new AppError(403, "Only job seekers can apply for jobs");
  }
  return user;
};

const recomputeProgress = async (tx: PrismaTransactionClient, taskId: string) => {
  const [steps, taskSteps] = await Promise.all([
    tx.taskStep.count({ where: { taskId } }),
    tx.taskStep.count({ where: { taskId, status: "COMPLETED" } }),
  ]);

  const progress = steps > 0 ? Math.round((taskSteps / steps) * 100) : 0;
  await tx.task.update({ where: { id: taskId }, data: { progress } });
  return progress;
};

type PrismaTransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// 1) Apply / Participate — creates an application + snapshots the job's
//    step breakdown so later edits to the job don't rewrite the contract.
const applyForJob = async (userId: string, payload: TApplyToJobPayload) => {
  await assertSeeker(userId);

  const job = await prisma.job.findUnique({
    where: { id: payload.jobId },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (!job) throw new AppError(404, "Job not found");
  if (job.status === "CLOSED" || job.status === "CANCELLED") {
    throw new AppError(400, "This job is no longer accepting applications");
  }
  if (job.postedById === userId) {
    throw new AppError(400, "You cannot apply to your own job");
  }

  const active = await prisma.task.findFirst({
    where: { jobId: payload.jobId, userId, status: { in: ["PENDING", "IN_PROGRESS", "SUBMITTED"] } },
  });
  if (active) throw new AppError(409, "You already have an active application for this job");

  return prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: { userId, jobId: payload.jobId, status: "PENDING", progress: 0 },
    });

    if (job.steps.length > 0) {
      await tx.taskStep.createMany({
        data: job.steps.map((s) => ({
          taskId: task.id,
          jobStepId: s.id,
          title: s.title,
          description: s.description,
          order: s.order,
        })),
      });
    }

    return tx.task.findUnique({
      where: { id: task.id },
      include: { job: { include: { postedBy: { select: { id: true, name: true } } } }, taskSteps: true },
    });
  });
};

// 2) Poster accepts the application → application starts, progress bar unlocks.
const acceptApplication = async (taskId: string, userId: string, role: string) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { job: { select: { id: true, postedById: true } } },
  });
  if (!task) throw new AppError(404, "Task not found");
  if (role !== "ADMIN" && task.job.postedById !== userId) {
    throw new AppError(403, "Only the job poster can accept applications");
  }
  if (task.status !== "PENDING") {
    throw new AppError(400, "Only pending applications can be accepted");
  }

  return prisma.task.update({
    where: { id: taskId },
    data: { status: "IN_PROGRESS", acceptedAt: new Date() },
    include: taskInclude,
  });
};

// 3) Seeker marks a step complete → progress bar moves 0→100%.
const completeStep = async (userId: string, stepId: string) => {
  const step = await prisma.taskStep.findUnique({
    where: { id: stepId },
    include: { task: { select: { id: true, userId: true, status: true } } },
  });
  if (!step) throw new AppError(404, "Step not found");
  if (step.task.userId !== userId) throw new AppError(403, "This step does not belong to you");

  if (!isActiveApplication(step.task.status)) {
    throw new AppError(400, "This application is not active");
  }

  return prisma.$transaction(async (tx) => {
    await tx.taskStep.update({
      where: { id: stepId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    const progress = await recomputeProgress(tx, step.task.id);

    const newStatus =
      step.task.status === "IN_PROGRESS" ? "IN_PROGRESS" : step.task.status === "PENDING" && progress > 0 ? "IN_PROGRESS" : step.task.status;

    await tx.task.update({ where: { id: step.task.id }, data: { status: newStatus } });

    return tx.task.findUnique({
      where: { id: step.task.id },
      include: { taskSteps: { orderBy: { order: "asc" } }, job: { select: { id: true, title: true } } },
    });
  });
};

// 4) 100% (or step-less jobs) → submit proof for the poster's review.
const submitProof = async (
  userId: string,
  taskId: string,
  payload: TSubmitProofPayload,
  file?: Express.Multer.File
) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { taskSteps: true },
  });
  if (!task) throw new AppError(404, "Task not found");
  if (task.userId !== userId) throw new AppError(403, "This task does not belong to you");
  if (!isActiveApplication(task.status)) {
    throw new AppError(400, `Cannot submit proof while task is ${task.status.toLowerCase()}`);
  }

  const hasSteps = task.taskSteps.length > 0;
  if (hasSteps && task.progress < 100) {
    throw new AppError(400, `Complete all steps first (current progress ${task.progress}%)`);
  }

  let proofFileUrl: string | undefined;
  if (file) {
    const uploaded = await uploadBufferToCloudinary(file, "job-management/task-proofs");
    proofFileUrl = uploaded.url;
  }
  if (!payload.submissionLink && !proofFileUrl && !payload.proofNote) {
    throw new AppError(400, "Provide a submission link, proof file, or proof note");
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      submissionLink: payload.submissionLink ?? task.submissionLink,
      proofNote: payload.proofNote ?? task.proofNote,
      proofFileUrl: proofFileUrl ?? task.proofFileUrl,
      status: "SUBMITTED",
      submittedAt: new Date(),
      progress: task.progress === 0 && !hasSteps ? 100 : task.progress,
    },
    include: taskInclude,
  });
};

// 5) Poster (or admin) reviews — approve credits the wallet atomically.
const reviewTask = async (
  taskId: string,
  reviewerId: string,
  role: string,
  status: "APPROVED" | "REJECTED",
  note?: string
) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { job: { select: { id: true, postedById: true, reward: true } } },
  });
  if (!task) throw new AppError(404, "Task not found");
  if (role !== "ADMIN" && task.job.postedById !== reviewerId) {
    throw new AppError(403, "Only the job poster or an admin can review this task");
  }
  if (task.status !== "SUBMITTED") {
    throw new AppError(400, `Only submitted tasks can be reviewed (current: ${task.status.toLowerCase()})`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: taskId },
      data: {
        status,
        progress: status === "APPROVED" ? 100 : task.progress,
        rejectionNote: status === "REJECTED" ? note ?? null : null,
        approvedAt: status === "APPROVED" ? new Date() : null,
      },
    });

    if (status === "APPROVED") {
      await tx.transaction.create({
        data: {
          userId: task.userId,
          amount: task.job.reward,
          type: "EARNING",
          status: "COMPLETED",
          note: `Reward for job ${task.job.id}`,
        },
      });
    }

    return updated;
  });
};

const getAllTasks = async (query: Record<string, unknown>) => {
  const filters = pick(query, ["status", "jobId"]) as TTaskFilters;
  const paginationOptions = pick(query, ["page", "limit", "sortBy", "sortOrder"]) as TPaginationOptions;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const where = {
    ...(filters.status && { status: filters.status as never }),
    ...(filters.jobId && { jobId: filters.jobId }),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({ where, include: taskInclude, orderBy: { [sortBy]: sortOrder }, skip, take: limit }),
    prisma.task.count({ where }),
  ]);

  return { meta: buildMeta(page, limit, total), data: tasks };
};

const getMyTasks = async (userId: string) => {
  return prisma.task.findMany({
    where: { userId },
    include: taskInclude,
    orderBy: { updatedAt: "desc" },
  });
};

// Applications for one of MY posted jobs (poster dashboards).
const getJobApplications = async (jobId: string, userId: string, role: string) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new AppError(404, "Job not found");
  if (role !== "ADMIN" && job.postedById !== userId) {
    throw new AppError(403, "You can only view applications for your own jobs");
  }

  return prisma.task.findMany({
    where: { jobId },
    include: taskInclude,
    orderBy: { createdAt: "desc" },
  });
};

const getSingleTask = async (id: string, userId: string, role: string) => {
  const task = await prisma.task.findUnique({ where: { id }, include: taskInclude });
  if (!task) throw new AppError(404, "Task not found");

  const isOwner = task.userId === userId;
  const isPoster = task.job.postedById === userId;
  if (!isOwner && !isPoster && role !== "ADMIN") {
    throw new AppError(403, "You are not allowed to view this task");
  }

  return task;
};

export const TaskService = {
  applyForJob,
  acceptApplication,
  completeStep,
  submitProof,
  reviewTask,
  getAllTasks,
  getMyTasks,
  getJobApplications,
  getSingleTask,
};