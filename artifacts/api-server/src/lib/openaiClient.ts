import OpenAI from "openai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY must be set. Did you forget to provision the secret?",
  );
}

export const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const CHAT_MODEL = "gemini-2.5-flash";

const RETRYABLE_STATUS_CODES = new Set([429, 500, 503, 504]);
const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateJson<T>(params: {
  system: string;
  user: string;
}): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          { role: "system", content: params.system },
          { role: "user", content: params.user },
        ],
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Gemini returned an empty response");
      }
      return JSON.parse(content) as T;
    } catch (err) {
      lastError = err;
      const status =
        err && typeof err === "object" && "status" in err
          ? (err as { status?: number }).status
          : undefined;

      const isRetryable = status !== undefined && RETRYABLE_STATUS_CODES.has(status);
      if (!isRetryable || attempt === MAX_RETRIES) {
        throw err;
      }
      await sleep(500 * 2 ** attempt);
    }
  }

  throw lastError;
}
