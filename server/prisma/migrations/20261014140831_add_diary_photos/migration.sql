-- CreateTable
CREATE TABLE "DiaryPhoto" (
    "id" SERIAL NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diaryEntryId" INTEGER NOT NULL,

    CONSTRAINT "DiaryPhoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DiaryPhoto" ADD CONSTRAINT "DiaryPhoto_diaryEntryId_fkey" FOREIGN KEY ("diaryEntryId") REFERENCES "DiaryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
