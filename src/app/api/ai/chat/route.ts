import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface CourseSummary {
  title: string;
  slug: string;
  courseType: string;
  level: string;
  price: number;
  status: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

function buildContents(messages: Message[]): ChatMessage[] {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

const BASE_PROMPT = `You are "Mentora", the friendly AI study assistant for the LMS learning platform.
You help learners:
- Explore and compare real courses from the catalog provided below (recommend based on level/topic/type/price).
- Explain course topics and concepts in simple, easy-to-understand language.
- Guide learners to platform features (courses catalog, batches, support sessions, assignments, certificates, payments).
- Keep replies concise (max ~150 words unless asked for detail).
- Be honest when data is not listed below — never invent course names, prices, or facts.
- Use placeholders/links sparingly; mention the course title and its URL slug when relevant.

=== LIVE COURSE CATALOG ===
{COURSES}
=== END CATALOG ===`;

let cache: { fetchedAt: number; text: string } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function buildSystemPrompt(): Promise<string> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL) {
    return cache.text;
  }

  let catalog = "No courses could be loaded right now.";
  try {
    const res = await fetch(`${API_URL}/courses`, {
      next: { revalidate: 180 },
    });
    if (res.ok) {
      const payload = (await res.json()) as {
        data?: { courses?: CourseSummary[] } | null;
      };
      const courses = payload.data?.courses ?? [];
      if (courses.length > 0) {
        catalog = courses
          .map(
            (c) =>
              `- ${c.title} | slug: ${c.slug} | type: ${c.courseType} | level: ${c.level} | price: ${
                c.price === 0 ? "Free" : `৳${c.price}`
              } | status: ${c.status}`
          )
          .join("\n");
      }
    }
  } catch (error) {
    console.error("Failed to load course catalog for AI:", error);
  }

  const text = BASE_PROMPT.replace("{COURSES}", catalog);
  cache = { fetchedAt: now, text };
  return text;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    messages?: Message[];
  } | null;

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUserMessage) {
    return NextResponse.json(
      { success: false, message: "No message provided" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, message: "AI assistant is not configured yet." },
      { status: 503 }
    );
  }

  const systemPrompt = await buildSystemPrompt();
  const contents = buildContents(messages);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Gemini API error ${response.status}:`, text);
      return NextResponse.json(
        { success: false, message: "AI assistant is having trouble. Try again." },
        { status: 502 }
      );
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      return NextResponse.json(
        { success: false, message: "AI assistant returned an empty response." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OK",
      data: { text },
    });
  } catch (error) {
    console.error("Gemini request failed:", error);
    return NextResponse.json(
      { success: false, message: "AI assistant is unreachable. Try again." },
      { status: 502 }
    );
  }
}