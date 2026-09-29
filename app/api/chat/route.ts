import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { chatRequestSchema, pakistaniPhoneSchema } from "@/lib/validation";
import { buildStoreContext } from "@/lib/chat-context";
import { checkRateLimit } from "@/lib/rate-limit";
import { lookupOrdersByPhone, formatOrdersForChat } from "@/lib/order-lookup";

const SYSTEM_PROMPT_PREFIX = `You are the shopping assistant for Joyería Studio, an online artificial jewelry store in Pakistan (daily wear, western and bridal pieces).

Answer only using the store information below — never invent a product, price, stock count or policy that isn't listed. If a customer asks about something not covered here (sizing advice beyond what's listed, a custom order, a complaint, changing an order after it's placed), tell them to message the store on WhatsApp using the "Order on WhatsApp" button on the site.

If a customer asks about an existing order (status, delivery, what's in it, tracking number), use the track_order tool with their phone number — ask for their phone number first if they haven't given it. Only report what the tool actually returns; never guess or estimate an order's status. If they mention an order number, you can still only look up by phone — mention that in your answer if it's relevant.

Keep replies concise, warm, and in the customer's language if they write in Urdu or Roman Urdu. Prices are in PKR. Format with markdown: use the exact [Name](/path) links given below whenever you mention a product or collection, so the customer can tap through to it, and use bullet points when listing more than one item.

STORE INFORMATION:
`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "track_order",
    description:
      "Look up a customer's orders by their Pakistani phone number to answer questions about order status, delivery progress, courier/tracking info, or what was ordered. Returns every order placed with that number.",
    input_schema: {
      type: "object",
      properties: {
        phone: {
          type: "string",
          description: "Pakistani mobile number the order was placed with, format 03XXXXXXXXX",
        },
      },
      required: ["phone"],
    },
  },
];

async function runTool(name: string, input: unknown): Promise<string> {
  if (name !== "track_order") return "Unknown tool.";

  const phone = typeof input === "object" && input !== null ? (input as Record<string, unknown>).phone : undefined;
  const parsed = pakistaniPhoneSchema.safeParse(phone);
  if (!parsed.success) {
    return "That doesn't look like a valid Pakistani phone number. Ask the customer for it in the format 03XXXXXXXXX.";
  }

  const orders = await lookupOrdersByPhone(parsed.data);
  return formatOrdersForChat(orders);
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Chat support isn't set up yet — please message us on WhatsApp instead.",
      },
      { status: 503 }
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (await checkRateLimit(`chat:${ip}`, 20, 60_000)) {
    return NextResponse.json(
      { error: "Too many messages. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  }

  try {
    const context = await buildStoreContext();
    const anthropic = new Anthropic({ apiKey });

    const messages: Anthropic.MessageParam[] = parsed.data.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // A customer's question about their own order takes at most one lookup,
    // but cap the loop generously rather than exactly at 1 — the model may
    // reasonably re-check after asking a clarifying question first.
    let reply = "";
    for (let i = 0; i < 4; i++) {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: SYSTEM_PROMPT_PREFIX + context,
        tools: TOOLS,
        messages,
      });

      const toolUses = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );

      if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
        reply = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === "text")
          .map((block) => block.text)
          .join("\n")
          .trim();
        break;
      }

      messages.push({ role: "assistant", content: response.content });
      const results: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUses.map(async (tu) => ({
          type: "tool_result" as const,
          tool_use_id: tu.id,
          content: await runTool(tu.name, tu.input),
        }))
      );
      messages.push({ role: "user", content: results });
    }

    return NextResponse.json({ reply: reply || "Sorry, I couldn't come up with a reply — please try again." });
  } catch (err) {
    console.error("Chat request failed", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or message us on WhatsApp." },
      { status: 500 }
    );
  }
}
