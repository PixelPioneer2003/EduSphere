import { db } from "@/lib/db";
import { redirect } from "next/navigation";
//  first chapter of the course will be selected by default using this code
const CourseIdPage = async ({
  params
}: {
  params: { courseId: string; }
}) => {
  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
    },
    include: {
      chapters: {
        where: {
          isPublished: true,
        },
        orderBy: {
          position: "asc"
        }
      }
    }
  });

  if (!course) {
    return redirect("/search");
  }

  return redirect(`/courses/${course.id}/chapters/${course.chapters[0].id}`);
}
 
export default CourseIdPage;