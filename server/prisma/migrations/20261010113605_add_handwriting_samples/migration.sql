-- CreateTable
CREATE TABLE "HandwritingSample" (
    "id" SERIAL NOT NULL,
    "character" TEXT NOT NULL,
    "imageData" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HandwritingSample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HandwritingSample_userId_character_key" ON "HandwritingSample"("userId", "character");

-- AddForeignKey
ALTER TABLE "HandwritingSample" ADD CONSTRAINT "HandwritingSample_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
