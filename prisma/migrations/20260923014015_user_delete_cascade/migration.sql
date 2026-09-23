-- DropForeignKey
ALTER TABLE "finance"."transactions" DROP CONSTRAINT "transactions_userId_fkey";

-- DropForeignKey
ALTER TABLE "finance"."withdrawals" DROP CONSTRAINT "withdrawals_userId_fkey";

-- DropForeignKey
ALTER TABLE "identity"."verification_requests" DROP CONSTRAINT "verification_requests_userId_fkey";

-- DropForeignKey
ALTER TABLE "jobs"."disputes" DROP CONSTRAINT "disputes_complainantId_fkey";

-- DropForeignKey
ALTER TABLE "jobs"."disputes" DROP CONSTRAINT "disputes_respondentId_fkey";

-- DropForeignKey
ALTER TABLE "jobs"."job_comments" DROP CONSTRAINT "job_comments_userId_fkey";

-- DropForeignKey
ALTER TABLE "jobs"."job_likes" DROP CONSTRAINT "job_likes_userId_fkey";

-- DropForeignKey
ALTER TABLE "jobs"."jobs" DROP CONSTRAINT "jobs_postedById_fkey";

-- DropForeignKey
ALTER TABLE "jobs"."tasks" DROP CONSTRAINT "tasks_userId_fkey";

-- AddForeignKey
ALTER TABLE "jobs"."disputes" ADD CONSTRAINT "disputes_complainantId_fkey" FOREIGN KEY ("complainantId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs"."disputes" ADD CONSTRAINT "disputes_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."withdrawals" ADD CONSTRAINT "withdrawals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs"."jobs" ADD CONSTRAINT "jobs_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs"."job_likes" ADD CONSTRAINT "job_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs"."job_comments" ADD CONSTRAINT "job_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs"."tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."verification_requests" ADD CONSTRAINT "verification_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
