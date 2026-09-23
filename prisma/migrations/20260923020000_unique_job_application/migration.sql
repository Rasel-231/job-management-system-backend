-- CreateIndex
CREATE UNIQUE INDEX "tasks_jobId_userId_key" ON "jobs"."tasks"("jobId", "userId");