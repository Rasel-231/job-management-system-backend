import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { UserRoutes } from "../modules/user/user.route";
import { JobRoutes } from "../modules/job/job.route";
import { TaskRoutes } from "../modules/task/task.route";
import { TransactionRoutes } from "../modules/transaction/transaction.route";
import { VerificationRoutes } from "../modules/verification/verification.route";
import { DisputeRoutes } from "../modules/dispute/dispute.route";

type TModuleRoute = {
  path: string;
  route: Router;
};

const router = Router();

const moduleRoutes: TModuleRoute[] = [
  { path: "/auth", route: AuthRoutes },
  { path: "/verifications", route: VerificationRoutes },
  { path: "/users", route: UserRoutes },
  { path: "/jobs", route: JobRoutes },
  { path: "/tasks", route: TaskRoutes },
  { path: "/transactions", route: TransactionRoutes },
  { path: "/disputes", route: DisputeRoutes },
];

moduleRoutes.forEach(({ path, route }) => router.use(path, route));

export default router;