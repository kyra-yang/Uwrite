-- DropForeignKey
ALTER TABLE "public"."Chapter" DROP CONSTRAINT "Chapter_projectId_fkey";

-- AddForeignKey
ALTER TABLE "public"."Chapter" ADD CONSTRAINT "Chapter_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
