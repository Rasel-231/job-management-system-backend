import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import validateRequest from "../../middlewares/validateRequest";
import upload from "../../middlewares/upload.middleware";
import { Permission } from "../../config/permissions";
import { JobController } from "./job.controller";
import { JobValidation } from "./job.validation";

const router = Router();

router.get("/", JobController.getAllJobs); // public job market
router.get("/:id", JobController.getSingleJob); // public — dynamic [id] route on frontend

router.post(
  "/",
  authenticate,
  authorize(Permission.JOB_CREATE),
  upload.single("image"), // FormData field name: "image"
  validateRequest(JobValidation.createJobValidationSchema),
  JobController.createJob
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
