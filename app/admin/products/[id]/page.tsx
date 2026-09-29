import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";
import { updateProduct, deleteProduct } from "@/app/admin/products/actions";

export const metadata = { title: "Edit Product" };

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  const [product, collections] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.collection.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  if (!product) notFound();

  const boundUpdate = updateProduct.bind(null, product.id);
  const boundDelete = deleteProduct.bind(null, product.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Edit Product</h1>
        <form
          action={async () => {
            "use server";
            await boundDelete();
          }}
        >
          <button type="submit" className="text-sm text-muted hover:text-red-600">
            Delete Product
          </button>
        </form>
      </div>
      <div className="mt-6 max-w-2xl">
        <ProductForm
          action={boundUpdate}
          collections={collections}
          submitLabel="Save Changes"
          initial={{
            name: product.name,
            slug: product.slug,
            description: product.description,
            sku: product.sku ?? "",
            material: product.material ?? "",
            finish: product.finish ?? "",
            careNote: product.careNote ?? "",
            category: product.category ?? "",
            occasionTags: product.occasionTags,
            tryOnImageUrl: product.tryOnImageUrl ?? "",
            collectionId: product.collectionId ?? "",
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            costPrice: product.costPrice,
            stock: product.stock,
            isActive: product.isActive,
            isFeatured: product.isFeatured,
            images: product.images.map((i) => ({ url: i.url, alt: i.alt })),
          }}
        />
      </div>
    </div>
  );
}
