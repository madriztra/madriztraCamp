import OpenAI from "openai";

import { absoluteUrl, getOptionalEnv } from "@/lib/env";

let client: OpenAI | null = null;

export function getOpenAIClient() {
  if ((process.env.AI_PROVIDER ?? "local") !== "openai") {
    return null;
  }

  const apiKey = getOptionalEnv("OPENROUTER_API_KEY") ?? getOptionalEnv("OPENAI_API_KEY");

  if (!apiKey) {
    return null;
  }

  client ??= new OpenAI({
    apiKey,
    baseURL:
      getOptionalEnv("OPENROUTER_BASE_URL") ??
      getOptionalEnv("OPENAI_BASE_URL") ??
      "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": absoluteUrl("/"),
      "X-Title": "Music Growth OS"
    }
  });
  return client;
}

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL ?? "openrouter/free";
}

export async function generateJson<T>(system: string, prompt: string): Promise<T | null> {
  const openai = getOpenAIClient();

  if (!openai) {
    return null;
  }

  try {
    const response = await openai.chat.completions.create({
      model: getOpenAIModel(),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: Number(process.env.OPENAI_MAX_TOKENS ?? 3500)
    });

    const content = response.choices[0]?.message.content;

    if (!content) {
      return null;
    }

    return JSON.parse(content) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI generation failed";
    console.warn(`AI provider unavailable, using local generator: ${message}`);
    return null;
  }
}
