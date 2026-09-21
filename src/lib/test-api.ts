import { apiFetch } from "./api";
import type { CourseListData } from "@/types";

export async function getCourses(): Promise<CourseListData | null> {
  const res = await apiFetch<CourseListData>("/courses");
  return res.data;
}