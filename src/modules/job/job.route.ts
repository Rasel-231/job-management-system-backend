import { Router } from "express";
import { authenticate, authorize, optionalAuthenticate } from "../../middlewares/auth.middleware";
import validateRequest from "../../middlewares/validateRequest";
import upload from "../../middlewares/upload.middleware";
import { Permission } from "../../config/permissions";
import { JobController } from "./job.controller";
import { JobValidation } from "./job.validation";

const router = Router();

// Facebook-style public feed — anonymous readers get posts, logged-in
// readers additionally get isLiked per post.
router.get("/", optionalAuthenticate, JobController.getAllJobs);

router.get(
  "/my-jobs",
  authenticate,
  authorize(Permission.JOB_CREATE),
  JobController.getMyJobs
);

router.get("/:id/comments", optionalAuthenticate, JobController.getComments);
router.get("/:id", optionalAuthenticate, JobController.getSingleJob);

router.post(
  "/",
  authenticate,
  authorize(Permission.JOB_CREATE),
  upload.single("image"),
  validateRequest(JobValidation.createJobValidationSchema),
  JobController.createJob
);

router.post(
  "/:id/like",
  authenticate,
  authorize(Permission.JOB_LIKE),
  JobController.toggleLike
);

router.post(
  "/:id/comments",
  authenticate,
  authorize(Permission.JOB_COMMENT),
  validateRequest(JobValidation.addCommentValidationSchema),
  JobController.addComment
);

router.patch(
  "/:id",
  authenticate,
  authorize(Permission.JOB_UPDATE),
  upload.single("image"),
  validateRequest(JobValidation.updateJobValidationSchema),
  JobController.updateJob
);

router.delete("/:id", authenticate, authorize(Permission.JOB_DELETE), JobController.deleteJob);

export const JobRoutes = router;