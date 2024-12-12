/*
  Warnings:

  - You are about to drop the column `correctAnswer` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `difficulty` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `hints` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `timeLimit` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Question` table. All the data in the column will be lost.
  - The `options` column on the `Question` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `allowReview` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `instructions` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `passingScore` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `showExplanation` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `shuffleQuestions` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `answers` on the `Score` table. All the data in the column will be lost.
  - You are about to drop the column `completed` on the `Score` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `Score` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `Score` table. All the data in the column will be lost.
  - You are about to drop the column `timeSpent` on the `Score` table. All the data in the column will be lost.
  - Added the required column `answer` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_quizId_fkey";

-- DropForeignKey
ALTER TABLE "Score" DROP CONSTRAINT "Score_quizId_fkey";

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "correctAnswer",
DROP COLUMN "difficulty",
DROP COLUMN "hints",
DROP COLUMN "order",
DROP COLUMN "points",
DROP COLUMN "tags",
DROP COLUMN "timeLimit",
DROP COLUMN "type",
ADD COLUMN     "answer" TEXT NOT NULL,
DROP COLUMN "options",
ADD COLUMN     "options" TEXT[];

-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "allowReview",
DROP COLUMN "description",
DROP COLUMN "instructions",
DROP COLUMN "passingScore",
DROP COLUMN "showExplanation",
DROP COLUMN "shuffleQuestions";

-- AlterTable
ALTER TABLE "Score" DROP COLUMN "answers",
DROP COLUMN "completed",
DROP COLUMN "completedAt",
DROP COLUMN "startedAt",
DROP COLUMN "timeSpent";

-- DropEnum
DROP TYPE "Difficulty";

-- DropEnum
DROP TYPE "QuestionType";

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
