import prisma from "../../config/db";
import AppError from "../../utils/AppError";
import pick from "../../utils/pick";
import { isPoster } from "../../config/permissions";
import { buildWhereClause } from "../../utils/queryBuilder";
import { calculatePagination, buildMeta } from "../../utils/paginationHelper";
import { uploadBufferToCloudinary, destroyCloudinaryAsset } from "../../utils/cloudinaryUpload";
import { TCreateJobPayload, TJobFilters, TJobStepInput, TUpdateJobPayload } from "./job.interface";
import { TPaginationOptions } from "../../types/apiResponse";

const searchableFields = ["title", "description"];

const parseSteps = (steps?: string | TJobStepInput[]): TJobStepInput[] => {
  if (!steps || steps === "") return [];
  if (typeof steps === "string") {
    try {
      return JSON.parse(steps) as TJobStepInput[];
    } catch {
      return [];
    }
  }
  return steps;
};

const posterSelect = {
  id: true,
  name: true,
  avatarUrl: true,
  accountType: true,
  isVerified: true,
} as const;

const assertPoster = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "User not found");
  if (!isPoster(user.accountType)) {
    throw new AppError(403, "Only job posters can create or manage job posts");
  }
  return user;
};

const getAllJobs = async (query: Record<string, unknown>, viewerId?: string) => {
  const filters = pick(query, ["searchTerm", "category", "status"]) as TJobFilters;
  const paginationOptions = pick(query, ["page", "limit", "sortBy", "sortOrder"]) as TPaginationOptions;

  const { searchTerm, ...restFilters } = filters;
  const where = buildWhereClause({
    searchTerm,
    searchableFields: searchableFields as never,
    filters: restFilters,
  });
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const orderBy =
    sortBy === "likes" || sortBy === "comments"
      ? { [sortBy]: { _count: sortOrder } }
      : { createdAt: sortOrder };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        postedBy: { select: posterSelect },
        steps: { select: { id: true }, orderBy: { order: "asc" } },
        _count: { select: { likes: true, comments: true, tasks: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);

  let likedIds: string[] = [];
  if (viewerId && jobs.length > 0) {
    const likes = await prisma.jobLike.findMany({
      where: { userId: viewerId, jobId: { in: jobs.map((j) => j.id) } },
      select: { jobId: true },
    });
    likedIds = likes.map((l) => l.jobId);
  }

  const data = jobs.map((job) => ({
    ...job,
    likeCount: job._count.likes,
    commentCount: job._count.comments,
    taskCount: job._count.tasks,
    stepsCount: job.steps.length,
    isLiked: viewerId ? likedIds.includes(job.id) : false,
    _count: undefined,
    steps: undefined,
  }));

  return { meta: buildMeta(page, limit, total), data };
};

const getSingleJob = async (id: string, viewerId?: string) => {
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      postedBy: { select: posterSelect },
      steps: { orderBy: { order: "asc" } },
      comments: {
        include: { user: { select: { id: true, name: true, avatarUrl: true, isVerified: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      _count: { select: { likes: true, comments: true, tasks: true } },
    },
  });
  if (!job) throw new AppError(404, "Job not found");

  let isLiked = false;
  if (viewerId) {
    const like = await prisma.jobLike.findUnique({
      where: { jobId_userId: { jobId: id, userId: viewerId } },
    });
    isLiked = Boolean(like);
  }

  return {
    ...job,
    likeCount: job._count.likes,
    commentCount: job._count.comments,
    taskCount: job._count.tasks,
    isLiked,
    _count: undefined,
  };
};

const createJob = async (
  postedById: string,
  payload: TCreateJobPayload,
  file?: Express.Multer.File
) => {
  await assertPoster(postedById);

  let imageUrl: string | undefined;
  let uploadedPublicId: string | undefined;
  if (file) {
    const uploaded = await uploadBufferToCloudinary(file, "job-management/jobs");
    imageUrl = uploaded.url;
    uploadedPublicId = uploaded.publicId;
  }

  const steps = parseSteps(payload.steps);
  const deadline = payload.deadline ? new Date(payload.deadline) : null;

  // multipart/form-data দিয়ে আসা সব field string থাকে, তাই reward-কে সরাসরি Number() করে নিতে হবে
  const reward = Number(payload.reward);
  if (Number.isNaN(reward)) {
    throw new AppError(400, "Reward must be a valid number");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const job = await tx.job.create({
        data: {
          title: payload.title,
          description: payload.description,
          requirements: payload.requirements ?? null,
          proofRequirements: payload.proofRequirements,
          reward,
          category: payload.category as never,
          deadline,
          imageUrl,
          postedById,
        },
      });

      if (steps.length > 0) {
        await tx.jobStep.createMany({
          data: steps.map((step, i) => ({
            jobId: job.id,
            title: step.title,
            description: step.description,
            order: i,
          })),
        });
      }

      return tx.job.findUnique({ where: { id: job.id }, include: { steps: true } });
    });
  } catch (err) {
    // DB write failed → don't leave an orphaned image on Cloudinary.
    if (uploadedPublicId) await destroyCloudinaryAsset(uploadedPublicId);
    throw err;
  }
};

const updateJob = async (
  id: string,
  userId: string,
  role: string,
  payload: TUpdateJobPayload,
  file?: Express.Multer.File
) => {
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) throw new AppError(404, "Job not found");
  if (role !== "ADMIN" && job.postedById !== userId) {
    throw new AppError(403, "You can only update your own jobs");
  }

  const { steps, deadline, category, reward, ...rest } = payload;

  let imageUrl = job.imageUrl;
  let uploadedPublicId: string | undefined;
  if (file) {
    const uploaded = await uploadBufferToCloudinary(file, "job-management/jobs");
    imageUrl = uploaded.url;
    uploadedPublicId = uploaded.publicId;
  }

  const stepsToSync = parseSteps(steps);

  // reward পাঠানো হলে সেটাও string আসতে পারে, তাই এখানেও convert করা লাগবে
  let parsedReward: number | undefined;
  if (reward !== undefined) {
    parsedReward = Number(reward);
    if (Number.isNaN(parsedReward)) {
      throw new AppError(400, "Reward must be a valid number");
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.job.update({
        where: { id },
        data: {
          ...rest,
          ...(parsedReward !== undefined && { reward: parsedReward }),
          ...(category && { category: category as never }),
          ...(deadline !== undefined && deadline !== null && { deadline: new Date(deadline) }),
          ...(deadline === null && { deadline: null }),
          imageUrl,
        },
      });

      if (stepsToSync.length > 0) {
        await tx.jobStep.deleteMany({ where: { jobId: id } });
        await tx.jobStep.createMany({
          data: stepsToSync.map((s, i) => ({
            jobId: id,
            title: s.title,
            description: s.description,
            order: i,
          })),
        });
      }

      return tx.job.findUnique({ where: { id }, include: { steps: { orderBy: { order: "asc" } } } });
    });
  } catch (err) {
    // Only the freshly uploaded replacement is rolled back; the previous
    // image (if any) is still referenced by the unchanged DB row.
    if (uploadedPublicId) await destroyCloudinaryAsset(uploadedPublicId);
    throw err;
  }
};

const deleteJob = async (id: string, userId: string, role: string): Promise<null> => {
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) throw new AppError(404, "Job not found");
  if (role !== "ADMIN" && job.postedById !== userId) {
    throw new AppError(403, "You can only delete your own jobs");
  }

  await prisma.job.delete({ where: { id } });
  return null;
};

const toggleLike = async (userId: string, jobId: string) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new AppError(404, "Job not found");

  const existing = await prisma.jobLike.findUnique({
    where: { jobId_userId: { jobId, userId } },
  });

  if (existing) {
    await prisma.jobLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.jobLike.create({ data: { jobId, userId } });
  }

  const likesCount = await prisma.jobLike.count({ where: { jobId } });
  return { liked: !existing, likesCount };
};

const addComment = async (userId: string, jobId: string, content: string) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new AppError(404, "Job not found");

  return prisma.jobComment.create({
    data: { userId, jobId, content },
    include: { user: { select: { id: true, name: true, avatarUrl: true, isVerified: true } } },
  });
};

const getComments = async (jobId: string, page = 1, limit = 20) => {
  const skip = (Math.max(page, 1) - 1) * limit;
  const [comments, total] = await Promise.all([
    prisma.jobComment.findMany({
      where: { jobId },
      include: { user: { select: { id: true, name: true, avatarUrl: true, isVerified: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.jobComment.count({ where: { jobId } }),
  ]);

  return { meta: buildMeta(page, limit, total), data: comments };
};

// Job Poster dashboard — own posts along with application stats.
const getMyJobs = async (userId: string, query: Record<string, unknown>) => {
  const { page, limit, skip } = calculatePagination(pick(query, ["page", "limit"]) as TPaginationOptions);
  const where = { postedById: userId };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        steps: { select: { id: true }, orderBy: { order: "asc" } },
        _count: { select: { tasks: true, likes: true, comments: true } },
        tasks: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);

  return { meta: buildMeta(page, limit, total), data: jobs };
};

export const JobService = {
  getAllJobs,
  getSingleJob,
  createJob,
  updateJob,
  deleteJob,
  toggleLike,
  addComment,
  getComments,
  getMyJobs,
};