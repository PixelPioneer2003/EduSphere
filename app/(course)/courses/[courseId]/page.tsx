import { db } from "@/lib/db";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

const CourseIdPage = async ({ params }: PageProps) => {
  const { courseId } = await params;

  const course = await db.course.findUnique({
    where: {
      id: courseId,
    },
    include: {
      chapters: {
        where: {
          isPublished: true,
        },
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!course || course.chapters.length === 0) {
    return redirect("/search");
  }

  return redirect(`/courses/${course.id}/chapters/${course.chapters[0].id}`);
};

export default CourseIdPage;

