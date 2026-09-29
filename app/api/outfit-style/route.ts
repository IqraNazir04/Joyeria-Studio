import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "@/lib/rate-limit";

const VALID_OCCASIONS = ["daily", "party", "bridal"] as const;
type Occasion = (typeof VALID_OCCASIONS)[number];

const ALLOWED_TYPES: Record<string, "image/jpeg" | "image/png" | "image/webp"> = {
  "image/jpeg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
};

const PROMPT = `Look at this photo of an outfit (a dress, a styled flatlay, or clothing on a hanger/rack). Classify which occasion it best suits, picking exactly one:
- "daily": everyday or office wear — simple, minimal or professional styling, plain or lightly patterned fabric, however many separate items (blazers, shirts, trousers, shoes, bags, accessories) are in the shot. A neatly arranged flatlay of ordinary office/casual clothing is still "daily", not "party" or "bridal" — judge the garment itself, not how many objects are in the photo.
- "party": going-out or festive wear — noticeably dressier or more embellished than daily wear (embroidery, sequins, zari, richer fabric), but not full bridal/wedding formality.
- "bridal": wedding or the most heavily embellished traditional wear — dense embroidery/stonework/zari coverage, clearly bridal-grade.

Also name 2-3 of the outfit's actual dominant colors in plain English (e.g. "purple", "gold embroidery", "navy blue").

Respond with ONLY compact JSON, no markdown fences, no other text: {"occasion": "daily"|"party"|"bridal", "colors": ["..."], "reason": "one short sentence explaining the pick"}`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Outfit matching isn't set up yet — pick an occasion yourself below instead." },
      { status: 503 }
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (await checkRateLimit(`outfit-style:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a moment and try again." }, { status: 429 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
  }
  const mediaType = ALLOWED_TYPES[file.type];
  if (!mediaType) {
    return NextResponse.json({ error: "Use a JPEG, PNG or WebP image" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 8MB" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: buffer.toString("base64") } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`No JSON in response: ${text}`);
    const parsed = JSON.parse(jsonMatch[0]) as { occasion?: string; colors?: unknown; reason?: string };

    if (!VALID_OCCASIONS.includes(parsed.occasion as Occasion)) {
      throw new Error(`Invalid occasion: ${parsed.occasion}`);
    }

    const colors = Array.isArray(parsed.colors) ? parsed.colors.filter((c) => typeof c === "string").slice(0, 3) : [];

    return NextResponse.json({ occasion: parsed.occasion, colors, reason: parsed.reason ?? "" });
  } catch (err) {
    console.error("Outfit style classification failed", err);
    return NextResponse.json(
      { error: "Couldn't read that photo — please try again or pick an occasion yourself below." },
      { status: 502 }
    );
  }
}
