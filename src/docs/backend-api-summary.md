# LMS Backend API Summary

Base URL: `https://prisma-12py.onrender.com/api/v1`

Auth strategy: `Authorization: Bearer <JWT token>` for protected routes.

## Generic Response Format

All responses follow this shape:

```json
// Success
{ "success": true, "message": "Login successful", "data": { ... } }

// Error
{ "success": false, "message": "Invalid email or password" }
```

**auth** (`src/services/auth.ts`) — no auth required

| Method | Endpoint | Body | Success | Notes |
| ------ | -------- | ---- | ------- | ----- |
| POST   | `/auth/register` | `{ name, email, password }` | 201 `{ user, token }` | Password min 6 chars. Duplicate email → 409. |
| POST   | `/auth/login` | `{ email, password }` | 200 `{ user, token }` | Invalid creds → 401. `user` excludes password. |

**users** (`src/services/users.ts`) — `authMiddleware` on all

| Method | Endpoint | Body / Query | Success data | Notes |
| ------ | -------- | ------------ | ------------ | ----- |
| GET    | `/users/me` | – | `User` profile | Uses token's `userId`. |
| GET    | `/users` | `?search=&role=` | `{ users[], total }` | search matches name/email (case-insensitive). |
| GET    | `/users/:id` | – | `User` | |
| PATCH  | `/users/:id` | `{ name?, avatar?, bio?, role? }` | `User` | |
| DELETE | `/users/:id` | – | – | Soft delete (`isDeleted: true`). |

**courses** (`src/services/courses.ts`)

| Method | Endpoint | Auth | Body / Query | Success data | Notes |
| ------ | -------- | ---- | ------------ | ------------ | ----- |
| POST   | `/courses` | ADMIN | `{ title, slug, description, adminId, courseType?, thumbnail?, price?, level?, status? }` | 201 `Course` (with `admin`, `_count`) | courseType must be `FIXED`/`BATCH`. |
| GET    | `/courses` | public | `?search=&level=&status=&courseType=` | `{ courses[], total }` | Includes admin, batches, `_count`. |
| GET    | `/courses/:id` | public | – | `Course` | Includes admin, batches, modules→lessons+assignments, `_count`. |
| PATCH  | `/courses/:id` | ADMIN | `{ title?, slug?, description?, courseType?, thumbnail?, price?, level?, status? }` | `Course` | courseType cannot change after creation. |
| DELETE | `/courses/:id` | ADMIN | – | – | Soft delete. |

**batches** (`src/services/batches.ts`)

| Method | Endpoint | Auth | Body / Query | Success data | Notes |
| ------ | -------- | ---- | ------------ | ------------ | ----- |
| POST   | `/batches` | ADMIN | `{ courseId, batchNumber, startDate, endDate, title?, status? }` | 201 `Batch` | Only for BATCH courses. |
| GET    | `/batches/course/:courseId` | public | – | `{ batches[], total }` | Ordered by batchNumber asc. |
| GET    | `/batches/:id` | public | – | `Batch` | Includes course, modules→lessons+assignments, liveSessions, `_count`. |
| PATCH  | `/batches/:id` | ADMIN | `{ title?, startDate?, endDate?, status? }` | `Batch` | |
| PATCH  | `/batches/:id/activate` | ADMIN | – | `Batch` | Marks target ACTIVE, other batches of course COMPLETED. |
| DELETE | `/batches/:id` | ADMIN | – | – | Blocked if enrolled students exist. |

**modules** (`src/services/modules.ts`) — `authMiddleware` on all

| Method | Endpoint | Auth | Body / Query | Success data | Notes |
| ------ | -------- | ---- | ------------ | ------------ | ----- |
| POST   | `/modules` | ADMIN | `{ courseId, batchId?, title, intro?, order }` | 201 `Module` | BATCH courses require batchId; FIXED must NOT have one. |
| GET    | `/modules/course/:courseId` | any | `?batchId=` | `{ modules[], total }` | batchId required for BATCH courses. |
| GET    | `/modules/:id` | any | – | `Module` | Includes lessons + assignments. |
| PATCH  | `/modules/:id` | ADMIN | `{ title?, intro?, order? }` | `Module` | |
| DELETE | `/modules/:id` | ADMIN | – | – | Soft delete. |

**lessons** (`src/services/lessons.ts`) — `authMiddleware` on all

| Method | Endpoint | Auth | Body / Query | Success data | Notes |
| ------ | -------- | ---- | ------------ | ------------ | ----- |
| POST   | `/lessons` | any | `{ moduleId, title, description?, type, content?, videoId?, videoUrl?, provider?, duration?, thumbnail?, order, isFree?, isPublished?, availableAt?, notifyStudents? }` | 201 `Lesson` | `notifyStudents` creates NEW_LESSON notifications. |
| GET    | `/lessons/module/:moduleId` | any | – | `{ lessons[], total }` | Includes `_count.quizzes`. |
| GET    | `/lessons/:id` | any | – | `Lesson` | Includes `module`, `quizzes`. |
| PATCH  | `/lessons/:id` | any | `{ title?, description?, type?, content?, videoId?, videoUrl?, provider?, duration?, thumbnail?, order?, isFree?, isPublished?, availableAt? }` | `Lesson` | |
| DELETE | `/lessons/:id` | any | – | – | Soft delete. |

**enrollments** (`src/services/enrollments.ts`) — `authMiddleware` on all

| Method | Endpoint | Auth | Body / Query | Success data | Notes |
| ------ | -------- | ---- | ------------ | ------------ | ----- |
| POST   | `/enrollments` | any | `{ learnerId, courseId, batchId? }` | 201 `{ enrollment, order, isFree, nextStep }` | Free course → ACTIVE immediately + creates PENDING order for paid. |
| GET    | `/enrollments/my/:learnerId` | any | – | `{ enrollments[], total }` | Includes course + batch. |
| GET    | `/enrollments/course/:courseId` | ADMIN | – | `{ enrollments[], total }` | |
| GET    | `/enrollments/batch/:batchId` | ADMIN | – | `{ enrollments[], total }` | |
| PATCH  | `/enrollments/:id/activate` | ADMIN | – | `Enrollment` | Marks related PENDING order PAID. |
| PATCH  | `/enrollments/:id` | ADMIN | `{ status?, progress? }` | `Enrollment` | Sets completedAt when COMPLETED. |
| DELETE | `/enrollments/:id` | any | – | – | Soft delete + status CANCELLED. |
| GET    | `/enrollments/:id` | any | – | `Enrollment` | Includes learner, course, batch. |

**payments** (`src/services/payments.ts`) — `authMiddleware` on all

| Method | Endpoint | Auth | Body / Query | Success data | Notes |
| ------ | -------- | ---- | ------------ | ------------ | ----- |
| POST   | `/payments/submit` | any | `{ enrollmentId, senderNumber, transactionId, provider }` | `Order` | provider must be `BKASH`/`NAGAD`. Enrollment must be PENDING. |
| GET    | `/payments/pending` | ADMIN | – | `{ orders[], total }` | Orders with submitted transaction. |
| GET    | `/payments/stats/all` | ADMIN | – | `{ totalEarning, pendingPayments, successfulPayments, failedPayments }` | |
| GET    | `/payments/my/:learnerId` | any | – | `{ orders[], total }` | Includes course + batch. |
| PATCH  | `/payments/:id/verify` | ADMIN | `{ action: "APPROVE"\|"REJECT", note? }` | `{ order, enrollment }` | APPROVE → PAID + ACTIVE; REJECT → FAILED + CANCELLED. Sends notification. |
| GET    | `/payments/:id` | any | – | `Order` | |

## Additional Routers (mounted in `src/routers/router.ts`)

| Mount | Source | Notable endpoints |
| ----- | ------ | ----------------- |
| `/quizzes` | `services/quizzes.ts` | POST `/` (ADMIN), POST `/bulk`, GET `/lesson/:lessonId`, GET `/lesson/:lessonId/my-attempts/:learnerId`, POST `/:id/attempt`, POST `/lesson/:lessonId/submit`, GET/PATCH/DELETE `/:id` (ADMIN for write) |
| `/progress` | `services/progress.ts` | POST `/complete`, GET `/my/:learnerId/course/:courseId`, GET `/lesson/:lessonId/check`, POST `/unlock-first`, DELETE `/reset` (ADMIN) |
| `/notifications` | `services/notifications.ts` | GET `/my/:userId`, GET `/unread-count/:userId`, POST `/send` (ADMIN), POST `/broadcast` (ADMIN), PATCH `/read-all/:userId`, PATCH `/:id/read`, DELETE `/clear/:userId`, GET/DELETE `/:id` |
| `/live-sessions` | `services/liveSessions.ts` | POST `/` (ADMIN), GET `/batch/:batchId`, GET `/my/:learnerId`, GET/PATCH/DELETE `/:id` (ADMIN for write). GET `/:id` adds computed `status: "LIVE"\|"UPCOMING"\|"ENDED"` |
| `/assignments` | `services/assignments.ts` | POST `/` (ADMIN), PATCH `/submissions/:id/grade` (ADMIN), GET `/module/:moduleId`, GET `/my/:learnerId`, GET `/:id/submissions` (ADMIN), POST `/:id/submit`, GET/PATCH/DELETE `/:id` (ADMIN for write) |
| `/certificates` | `services/certificates.ts` | POST `/generate`, GET `/my/:learnerId`, GET `/course/:courseId` (ADMIN), GET `/:id`, DELETE `/:id` (ADMIN). Requires 100% progress. |
| `/dashboard` | `services/dashboard.ts` | GET `/admin/stats`, GET `/admin/revenue`, GET `/admin/course-earnings`, GET `/admin/batch-earnings`, GET `/admin/top-students`, GET `/admin/recent-activity` (all ADMIN), GET `/learner/:learnerId` (any auth) |
| `/reviews` | `services/reviews.ts` | POST `/` (auth), GET `/course/:courseId` (public), GET `/stats/:courseId` (public), GET `/my/:learnerId`, GET `/:id` (public), PATCH/DELETE `/:id` (auth) |

## Common Fields (from `prisma/prisma/schema.prisma`)

- **User**: `id, name, email, role (ADMIN|LEARNER), avatar?, bio?, createdAt, updatedAt` — never returns `password`.
- **Course**: `id, title, slug, description, thumbnail?, price, level, courseType, status, adminId, isDeleted, createdAt, updatedAt`.
- **Batch**: `id, courseId, batchNumber, title?, startDate, endDate, status, createdAt, updatedAt`.
- **Module**: `id, courseId, batchId?, title, intro?, order, createdAt, updatedAt`.
- **Lesson**: `id, moduleId, title, description?, type, content?, videoId?, videoUrl?, provider?, duration?, thumbnail?, order, isFree, isPublished, availableAt?, createdAt, updatedAt`.
- **Enrollment**: `id, learnerId, courseId, batchId?, status, progress (0-100), enrolledAt, completedAt?, createdAt, updatedAt`.
- **Order** (payment): `id, learnerId, courseId, batchId?, amount, provider (BKASH|NAGAD|FREE), senderNumber?, transactionId?, status, createdAt, updatedAt`.
- **Notification**: `id, userId, batchId?, type, title, message, link?, isRead, createdAt`.

All `DateTime` fields serialize as ISO-8601 strings over JSON.
All create/update timestamps (`createdAt`/`updatedAt`) are always present on created records.

### Enums
`UserRole: ADMIN|LEARNER` · `CourseType: FIXED|BATCH` · `CourseStatus: DRAFT|PUBLISHED|ARCHIVED` · `CourseLevel: BEGINNER|INTERMEDIATE|ADVANCED` · `BatchStatus: UPCOMING|ACTIVE|COMPLETED` · `LessonType: VIDEO|TEXT|QUIZ` · `EnrollmentStatus: PENDING|ACTIVE|COMPLETED|CANCELLED` · `PaymentStatus: PENDING|PAID|FAILED|REFUNDED` · `PaymentProvider: BKASH|NAGAD|FREE` · `NotificationType: NEW_LESSON|NEW_ASSIGNMENT|NEW_LIVE_CLASS|ANNOUNCEMENT|COURSE_COMPLETED` · `AssignmentStatus: PENDING|SUBMITTED|GRADED`.