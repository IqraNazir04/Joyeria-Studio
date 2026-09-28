import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cloudinaryConfigured, uploadProductImage } from "@/lib/cloudinary";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!cloudinaryConfigured) {
    return NextResponse.json(
      { error: "Image upload isn't configured yet — add CLOUDINARY_* to your .env, or paste an image URL instead." },
      { status: 501 }
    );
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Use a JPEG, PNG, WebP or AVIF image" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 8MB" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadProductImage(buffer);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 502 });
  }
}
