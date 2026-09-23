import prisma from "../../config/db";
import AppError from "../../utils/AppError";
import pick from "../../utils/pick";
import { uploadBufferToCloudinary, destroyCloudinaryAsset } from "../../utils/cloudinaryUpload";
import { calculatePagination, buildMeta, TPaginationOptions } from "../../utils/paginationHelper";
import { TCreateVerificationPayload, TVerificationFilters } from "./verification.interface";

const submitVerification = async (
  userId: string,
  payload: TCreateVerificationPayload,
  file?: Express.Multer.File
) => {
  if (!file) throw new AppError(400, "A document file (NID/Birth Certificate) is required");

  const pending = await prisma.verificationRequest.findFirst({
    where: { userId, status: "PENDING" },
  });
  if (pending) throw new AppError(409, "You already have a pending verification request");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "User not found");

  const uploaded = await uploadBufferToCloudinary(file, "job-management/verifications");
  const documentUrl = uploaded.url;
  const uploadedPublicId = uploaded.publicId;

  try {
    return await prisma.verificationRequest.create({
      data: {
        userId,
        type: payload.type,
        documentUrl,
        documentNumber: payload.documentNumber,
      },
    });
  } catch (err) {
    await destroyCloudinaryAsset(uploadedPublicId);
    throw err;
  }
};

const getMyVerifications = async (userId: string) => {
  return prisma.verificationRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

const getAllVerifications = async (query: Record<string, unknown>) => {
  const filters = pick(query, ["status", "type"]) as TVerificationFilters;
  const paginationOptions = pick(query, ["page", "limit", "sortBy", "sortOrder"]) as TPaginationOptions;

  const where = {
    ...(filters.status && { status: filters.status as never }),
    ...(filters.type && { type: filters.type as never }),
  };

  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const [data, total] = await Promise.all([
    prisma.verificationRequest.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.verificationRequest.count({ where }),
  ]);

  return { meta: buildMeta(page, limit, total), data };
};

// Approving a verification flips the user's verified badge — that's the
// only place isVerified is set from the document path (OTP path sets it too).
const reviewVerification = async (
  id: string,
  status: "APPROVED" | "REJECTED",
  note?: string
) => {
  const request = await prisma.verificationRequest.findUnique({ where: { id } });
  if (!request) throw new AppError(404, "Verification request not found");
  if (request.status !== "PENDING") {
    throw new AppError(400, `This request has already been ${request.status.toLowerCase()}`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.verificationRequest.update({
      where: { id },
      data: { status, adminNote: note, reviewedAt: new Date() },
    });

    if (status === "APPROVED") {
      await tx.user.update({ where: { id: request.userId }, data: { isVerified: true } });
    }

    return updated;
  });
};

export const VerificationService = {
  submitVerification,
  getMyVerifications,
  getAllVerifications,
  reviewVerification,
};