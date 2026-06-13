import { generateJson } from "@/lib/ai/openai";

type InsightResponse = {
  insights: string[];
};

export async function generatePerformanceInsights(input: unknown): Promise<string[]> {
  const generated = await generateJson<InsightResponse>(
    "Kamu adalah analis strategi marketing musik. Balas hanya JSON valid. Semua insight wajib Bahasa Indonesia, singkat, konkret, dan berbasis data.",
    JSON.stringify({
      task: "Buat 3-6 insight performa dalam Bahasa Indonesia. Sebutkan platform, waktu posting, gaya konten, atau funnel jika didukung data.",
      data: input,
      shape: { insights: ["Instagram Reels unggul 24% dibanding TikTok untuk klik smart link."] }
    })
  );

  if (generated?.insights?.length) {
    return generated.insights
      .filter((insight) => typeof insight === "string" && insight.trim().length > 0)
      .map((insight) => insight.trim())
      .slice(0, 6);
  }

  return [
    "Posting pukul 18:00-20:00 saat ini menjadi jendela performa terkuat.",
    "Konten emosional paling kuat mendorong niat save dan klik.",
    "Pantau rasio klik smart link ke stream untuk menemukan titik drop-off funnel."
  ];
}
