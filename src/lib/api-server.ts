import "server-only";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://prisma-12py.onrender.com/api/v1";

// For public endpoints
export async function fetchPublic<T>(
  path: string,
  options?: {
    revalidate?: number;
  }
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate: options?.revalidate ?? 60 },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }
  const json = await res.json();
  return json.data;
}

// For authenticated endpoints (reads token from cookie)
export async function fetchPrivate<T>(path: string): Promise<T> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }
  const json = await res.json();
  return json.data;
}