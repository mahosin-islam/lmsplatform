/**
 * TypeScript types for the LMS backend API.
 * Mirrors the Prisma schema in ./prisma/prisma/schema.prisma and the
 * response shapes returned by the API services.
 *
 * All `DateTime` fields are serialized as ISO-8601 strings over JSON.
 */

// ─────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "LEARNER";
export type CourseType = "FIXED" | "BATCH";
export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type BatchStatus = "UPCOMING" | "ACTIVE" | "COMPLETED";
export type LessonType = "VIDEO" | "TEXT" | "QUIZ";
export type EnrollmentStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentProvider = "BKASH" | "NAGAD" | "FREE";
export type NotificationType =
  | "NEW_LESSON"
  | "NEW_ASSIGNMENT"
  | "NEW_LIVE_CLASS"
  | "ANNOUNCEMENT"
  | "COURSE_COMPLETED";
export type AssignmentStatus = "PENDING" | "SUBMITTED" | "GRADED";
export type LiveSessionStatus = "LIVE" | "UPCOMING" | "ENDED";

// ─────────────────────────────────────────────────────────────
// Generic API response envelope
//   { success, message, data } — success responses
//   { success: false, message } — error responses
// ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

// ─────────────────────────────────────────────────────────────
// Users & Auth
// ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  bio?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ─────────────────────────────────────────────────────────────
// Courses
// ─────────────────────────────────────────────────────────────

export interface CourseCount {
  modules?: number;
  enrollments?: number;
  batches?: number;
  reviews?: number;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  price: number;
  level: CourseLevel;
  courseType: CourseType;
  status: CourseStatus;
  adminId: string;
  createdAt: string;
  updatedAt: string;
  admin?: Pick<User, "id" | "name" | "email" | "avatar">;
  batches?: BatchSummary[];
  modules?: Module[];
  _count?: CourseCount;
}

export interface CourseListData {
  courses: Course[];
  total: number;
}

// ─────────────────────────────────────────────────────────────
// Batches
// ─────────────────────────────────────────────────────────────

export interface BatchCount {
  modules?: number;
  enrollments?: number;
  liveSessions?: number;
}

export interface Batch {
  id: string;
  courseId: string;
  batchNumber: number;
  title: string | null;
  startDate: string;
  endDate: string;
  status: BatchStatus;
  certificateUnlocked?: boolean;
  createdAt: string;
  updatedAt: string;
  course?: Pick<Course, "id" | "title" | "slug" | "courseType">;
  modules?: Module[];
  liveSessions?: LiveSession[];
  _count?: BatchCount;
}

export interface BatchSummary {
  id: string;
  batchNumber: number;
  title: string | null;
  startDate?: string;
  endDate?: string;
  status?: BatchStatus;
}

export interface BatchListData {
  batches: Batch[];
  total: number;
}

// ─────────────────────────────────────────────────────────────
// Modules
// ─────────────────────────────────────────────────────────────

export interface ModuleCount {
  lessons?: number;
  assignments?: number;
}

export interface Module {
  id: string;
  courseId: string;
  batchId: string | null;
  title: string;
  intro: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  course?: Pick<Course, "id" | "title" | "slug" | "courseType">;
  batch?: Pick<Batch, "id" | "batchNumber" | "title">;
  lessons?: Lesson[];
  assignments?: Assignment[];
  _count?: ModuleCount;
}

export interface ModuleListData {
  modules: Module[];
  total: number;
}

// ─────────────────────────────────────────────────────────────
// Lessons
// ─────────────────────────────────────────────────────────────

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  type: LessonType;
  content: string | null;
  videoId: string | null;
  videoUrl: string | null;
  provider: string | null;
  duration: number | null;
  thumbnail: string | null;
  order: number;
  isFree: boolean;
  isPublished: boolean;
  availableAt: string | null;
  createdAt: string;
  updatedAt: string;
  module?: {
    id: string;
    title: string;
    courseId: string;
    batchId: string | null;
  };
  quizzes?: Quiz[];
  _count?: { quizzes?: number };
}

export interface LessonListData {
  lessons: Lesson[];
  total: number;
}

// ─────────────────────────────────────────────────────────────
// Quizzes
// ─────────────────────────────────────────────────────────────

export interface Quiz {
  id: string;
  lessonId: string;
  question: string;
  options: string[] | unknown;
  correctAnswer: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  lesson?: Pick<Lesson, "id" | "title" | "moduleId">;
}

export interface QuizListData {
  quizzes: Quiz[];
  total: number;
}

export interface QuizAttempt {
  id: string;
  learnerId: string;
  quizId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// Enrollments
// ─────────────────────────────────────────────────────────────

export interface Enrollment {
  id: string;
  learnerId: string;
  courseId: string;
  batchId: string | null;
  status: EnrollmentStatus;
  progress: number;
  enrolledAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  learner?: Pick<User, "id" | "name" | "email" | "avatar">;
  course?: Pick<
    Course,
    "id" | "title" | "slug" | "thumbnail" | "price" | "level" | "courseType"
  >;
  batch?: Pick<
    Batch,
    "id" | "batchNumber" | "title" | "startDate" | "endDate" | "status"
  > & { certificateUnlocked?: boolean };
}

export interface EnrollmentListData {
  enrollments: Enrollment[];
  total: number;
}

export interface EnrollmentResponse {
  enrollment: Enrollment;
  order: Order | null;
  isFree: boolean;
  nextStep: string;
}

// ─────────────────────────────────────────────────────────────
// Orders / Payments
// ─────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  learnerId: string;
  courseId: string;
  batchId: string | null;
  amount: number;
  provider: PaymentProvider;
  senderNumber: string | null;
  transactionId: string | null;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  learner?: Pick<User, "id" | "name" | "email" | "avatar">;
  course?: Pick<Course, "id" | "title" | "slug" | "thumbnail" | "price">;
  batch?: Pick<Batch, "id" | "batchNumber" | "title">;
}

export interface OrderListData {
  orders: Order[];
  total: number;
}

export interface PaymentStats {
  totalEarning: number;
  pendingPayments: number;
  successfulPayments: number;
  failedPayments: number;
}

export interface PaymentVerifyData {
  order: Order;
  enrollment: Enrollment;
}

// ─────────────────────────────────────────────────────────────
// Reviews
// ─────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  learnerId: string;
  courseId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  learner?: Pick<User, "id" | "name" | "avatar">;
  course?: Pick<Course, "id" | "title" | "slug" | "thumbnail">;
}

export interface ReviewListData {
  reviews: Review[];
  total: number;
  averageRating?: number;
  starBreakdown?: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ReviewStats {
  total: number;
  average: number;
  starBreakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}

// ─────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  batchId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  batch?: Pick<Batch, "id" | "batchNumber" | "title">;
}

export interface NotificationListData {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

// ─────────────────────────────────────────────────────────────
// Assignments
// ─────────────────────────────────────────────────────────────

export interface Assignment {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  docUrl: string | null;
  deadline: string | null;
  totalMarks: number;
  createdAt: string;
  updatedAt: string;
  module?: Pick<Module, "id" | "title" | "courseId" | "batchId">;
  submissions?: AssignmentSubmission[];
  _count?: { submissions?: number };
}

export interface AssignmentListData {
  assignments: Assignment[];
  total: number;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  learnerId: string;
  answerUrl: string;
  note: string | null;
  status: AssignmentStatus;
  marks: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignment?: Pick<Assignment, "id" | "title" | "totalMarks" | "deadline"> & {
    module?: Pick<Module, "id" | "title" | "courseId">;
  };
  learner?: Pick<User, "id" | "name" | "email" | "avatar">;
}

export interface AssignmentSubmissionListData {
  submissions: AssignmentSubmission[];
  total: number;
}

// ─────────────────────────────────────────────────────────────
// Certificates
// ─────────────────────────────────────────────────────────────

export interface Certificate {
  id: string;
  certificateCode: string;
  learnerId: string;
  courseId: string;
  batchId: string | null;
  learnerName: string;
  courseName: string;
  batchName: string | null;
  issuedAt: string;
  learner?: Pick<User, "id" | "name" | "email">;
  course?: Pick<Course, "id" | "title" | "slug" | "thumbnail">;
  batch?: Pick<Batch, "id" | "batchNumber" | "title">;
}

export interface CertificateListData {
  certificates: Certificate[];
  total: number;
}

// ─────────────────────────────────────────────────────────────
// Live Sessions
// ─────────────────────────────────────────────────────────────

export interface LiveSession {
  id: string;
  batchId: string;
  title: string;
  description: string | null;
  meetingLink: string;
  scheduledAt: string;
  duration: number;
  createdAt: string;
  updatedAt: string;
  status?: LiveSessionStatus;
  batch?: Pick<
    Batch,
    "id" | "batchNumber" | "title" | "course" | "status"
  > & {
    course?: Pick<Course, "id" | "title" | "slug">;
  };
}

export interface LiveSessionListData {
  sessions: LiveSession[];
  total: number;
}

export interface MyLiveSessionsData {
  upcoming: LiveSession[];
  past: LiveSession[];
}

export interface MyAssignmentsData {
  submissions: AssignmentSubmission[];
  total: number;
}

export interface UnreadCountData {
  unreadCount: number;
}

// ─────────────────────────────────────────────────────────────
// Progress
// ─────────────────────────────────────────────────────────────

export interface LessonProgress {
  id?: string;
  learnerId: string;
  lessonId: string;
  isCompleted: boolean;
  isUnlocked: boolean;
  completedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProgressLesson {
  id?: string;
  title: string;
  type?: LessonType;
  order?: number;
  isPublished?: boolean;
  availableAt?: string | null;
  progress?: LessonProgress;
}

export interface ProgressModule {
  id: string;
  title: string;
  order: number;
  lessons: ProgressLesson[];
}

export interface CourseProgressData {
  modules: ProgressModule[];
}

export interface LessonAccessData {
  canAccess: boolean;
  isUnlocked: boolean;
  dateUnlocked: boolean;
  previousLesson: { id: string; title: string } | null;
  availableAt: string | null;
}

export interface CompleteLessonData {
  progress: LessonProgress;
  nextLessonUnlocked: { id: string; title: string } | null;
  enrollmentProgress: number;
}

// ─────────────────────────────────────────────────────────────
// Dashboards
// ─────────────────────────────────────────────────────────────

export interface AdminStats {
  users: { total: number; learners: number };
  courses: { total: number; fixed: number; batch: number };
  batches: { total: number; active: number };
  enrollments: { total: number; active: number };
  payments: {
    totalOrders: number;
    totalRevenue: number;
    pendingPayments: number;
  };
  others: {
    certificates: number;
    assignments: number;
    notifications: number;
  };
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface RevenueData {
  monthly: MonthlyRevenue[];
}

export interface CourseEarning {
  courseId: string;
  courseTitle: string;
  thumbnail: string | null;
  totalEarnings: number;
  totalOrders: number;
}

export interface CourseEarningsData {
  earnings: CourseEarning[];
}

export interface BatchEarning {
  batchId: string;
  batchNumber: number;
  batchTitle: string;
  batchStatus: BatchStatus | "UNKNOWN";
  courseTitle: string;
  totalEarnings: number;
  totalOrders: number;
}

export interface BatchEarningsData {
  earnings: BatchEarning[];
}

export interface TopStudent {
  rank: number;
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  totalEnrollments: number;
}

export interface TopStudentsData {
  students: TopStudent[];
}

export interface RecentActivityData {
  recentUsers: Pick<User, "id" | "name" | "email" | "avatar" | "createdAt">[];
  recentEnrollments: Array<{
    id: string;
    learner: Pick<User, "id" | "name">;
    course: Pick<Course, "id" | "title">;
    enrolledAt: string;
  }>;
  recentOrders: Array<{
    id: string;
    learner: Pick<User, "id" | "name">;
    course: Pick<Course, "id" | "title">;
    amount: number;
    updatedAt: string;
  }>;
  recentReviews: Array<{
    id: string;
    learner: Pick<User, "id" | "name">;
    course: Pick<Course, "id" | "title">;
    rating: number;
    createdAt: string;
  }>;
}

export interface LearnerDashboardData {
  enrollments: { total: number; active: number; completed: number };
  certificates: number;
  assignments: number;
  notifications: { total: number; unread: number };
  recentEnrollments: Array<{
    id: string;
    status: EnrollmentStatus;
    progress: number;
    enrolledAt: string;
    course: Pick<Course, "id" | "title" | "thumbnail" | "courseType">;
    batch: Pick<Batch, "id" | "batchNumber" | "title">;
  }>;
}

// ─────────────────────────────────────────────────────────────
// Payloads (request bodies)
// ─────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface SubmitPaymentPayload {
  enrollmentId: string;
  senderNumber: string;
  transactionId: string;
  provider: Exclude<PaymentProvider, "FREE">;
}

export interface VerifyPaymentPayload {
  action: "APPROVE" | "REJECT";
  note?: string;
}

export interface CoursePayload {
  title: string;
  slug: string;
  description: string;
  adminId: string;
  courseType?: CourseType;
  thumbnail?: string | null;
  price?: number;
  level?: CourseLevel;
  status?: CourseStatus;
}

export interface BatchPayload {
  courseId: string;
  batchNumber: number;
  startDate: string;
  endDate: string;
  title?: string;
  status?: BatchStatus;
}

export interface ModulePayload {
  courseId: string;
  batchId?: string;
  title: string;
  intro?: string | null;
  order: number;
}

export interface LessonPayload {
  moduleId: string;
  title: string;
  description?: string | null;
  type: LessonType;
  content?: string | null;
  videoId?: string | null;
  videoUrl?: string | null;
  provider?: string;
  duration?: number | null;
  thumbnail?: string | null;
  order: number;
  isFree?: boolean;
  isPublished?: boolean;
  availableAt?: string | null;
  notifyStudents?: boolean;
}

export interface QuizPayload {
  lessonId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  order?: number;
}

export interface EnrollmentPayload {
  learnerId: string;
  courseId: string;
  batchId?: string;
}

export interface ReviewPayload {
  learnerId: string;
  courseId: string;
  rating: number;
  comment?: string;
}

export interface AssignmentPayload {
  moduleId: string;
  title: string;
  description?: string | null;
  docUrl?: string | null;
  deadline?: string | null;
  totalMarks?: number;
  notifyStudents?: boolean;
}

export interface AssignmentSubmitPayload {
  learnerId: string;
  answerUrl: string;
  note?: string;
}

export interface LiveSessionPayload {
  batchId: string;
  title: string;
  description?: string | null;
  meetingLink: string;
  scheduledAt: string;
  duration?: number;
  notifyStudents?: boolean;
}

export interface GenerateCertificatePayload {
  learnerId: string;
  courseId: string;
  batchId?: string;
}

export interface QuizSubmitPayload {
  learnerId: string;
  answers: Array<{ quizId: string; selectedAnswer: string }>;
}