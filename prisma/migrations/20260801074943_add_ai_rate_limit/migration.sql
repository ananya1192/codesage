-- CreateTable
CREATE TABLE "ai_rate_limit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ai_rate_limit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_rate_limit_userId_date_key" ON "ai_rate_limit"("userId", "date");

-- AddForeignKey
ALTER TABLE "ai_rate_limit" ADD CONSTRAINT "ai_rate_limit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
