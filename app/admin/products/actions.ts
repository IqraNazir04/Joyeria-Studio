"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { productSchema } from "@/lib/validation";
import { slugify } from "@/lib/slugify";

function parseImages(formData: FormData): { url: string; alt: string }[] {
  const urls = formData.getAll("imageUrl") as string[];
  const alts = formData.getAll("imageAlt") as string[];
  return urls
    .map((url, i) => ({ url: url.trim(), alt: (alts[i] ?? "").trim() }))
    .filter((img) => img.url.length > 0);
}

function parseProductForm(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  return productSchema.safeParse({
    name,
    slug: String(formData.get("slug") ?? slugify(name)),
    description: String(formData.get("description") ?? ""),
    sku: String(formData.get("sku") ?? ""),
    material: String(formData.get("material") ?? ""),
    finish: String(formData.get("finish") ?? ""),
    careNote: String(formData.get("careNote") ?? ""),
    category: String(formData.get("category") ?? ""),
    collectionId: String(formData.get("collectionId") ?? ""),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || null,
    costPrice: formData.get("costPrice") || null,
    stock: formData.get("stock"),
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    images: parseImages(formData),
  });
}

export type ProductFormState = { error?: string; fieldErrors?: Record<string, string[]> };

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: { slug: ["A product with this slug already exists"] },
    };
  }

  if (parsed.data.sku) {
    const existingSku = await prisma.product.findUnique({ where: { sku: parsed.data.sku } });
    if (existingSku) {
      return {
        error: "Please fix the errors below.",
        fieldErrors: { sku: ["A product with this item code already exists"] },
      };
    }
  }

  const { images, ...data } = parsed.data;

  const product = await prisma.product.create({
    data: {
      ...data,
      sku: data.sku || null,
      material: data.material || null,
      finish: data.finish || null,
      careNote: data.careNote || null,
      category: data.category || null,
      compareAtPrice: data.compareAtPrice || null,
      costPrice: data.costPrice ?? null,
      images: {
        create: images.map((img, i) => ({
          url: img.url,
          alt: img.alt,
          isCover: i === 0,
          sortOrder: i,
        })),
      },
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.product.findFirst({
    where: { slug: parsed.data.slug, id: { not: productId } },
  });
  if (existing) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: { slug: ["A product with this slug already exists"] },
    };
  }

  if (parsed.data.sku) {
    const existingSku = await prisma.product.findFirst({
      where: { sku: parsed.data.sku, id: { not: productId } },
    });
    if (existingSku) {
      return {
        error: "Please fix the errors below.",
        fieldErrors: { sku: ["A product with this item code already exists"] },
      };
    }
  }

  const { images, ...data } = parsed.data;
  const current = await prisma.product.findUnique({ where: { id: productId } });
  if (!current) return { error: "Product not found" };

  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: {
        ...data,
        sku: data.sku || null,
        material: data.material || null,
        finish: data.finish || null,
        careNote: data.careNote || null,
        category: data.category || null,
        compareAtPrice: data.compareAtPrice || null,
        costPrice: data.costPrice ?? null,
      },
    }),
    prisma.productImage.deleteMany({ where: { productId } }),
    prisma.productImage.createMany({
      data: images.map((img, i) => ({
        productId,
        url: img.url,
        alt: img.alt,
        isCover: i === 0,
        sortOrder: i,
      })),
    }),
  ]);

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");

  return { error: undefined };
}

export async function deleteProduct(productId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  // Order history keeps its own snapshot (OrderItem.productName/price), and
  // productId there is nullable, so deleting here never touches past orders.
  await prisma.product.delete({ where: { id: productId } });

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  redirect("/admin/products");
}
