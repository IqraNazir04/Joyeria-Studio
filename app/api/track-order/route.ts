import { NextRequest, NextResponse } from "next/server";
import { pakistaniPhoneSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { lookupOrdersByPhone } from "@/lib/order-lookup";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (await checkRateLimit(`track:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }

  const phone = req.nextUrl.searchParams.get("phone") ?? "";
  const parsed = pakistaniPhoneSchema.safeParse(phone);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid phone number, e.g. 03001234567" }, { status: 400 });
  }

  const orders = await lookupOrdersByPhone(parsed.data);

  return NextResponse.json({ orders });
}
