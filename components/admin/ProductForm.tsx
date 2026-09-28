"use client";

import { useActionState, useState } from "react";
import { slugify } from "@/lib/slugify";
import type { ProductFormState } from "@/app/admin/products/actions";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

type ImageInput = { url: string; alt: string };

type Props = {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  collections: { id: string; name: string }[];
  initial?: {
    name: string;
    slug: string;
    description: string;
    material: string;
    finish: string;
    careNote: string;
    category: string;
    collectionId: string;
    price: number;
    compareAtPrice: number | null;
    costPrice: number | null;
    stock: number;
    isActive: boolean;
    isFeatured: boolean;
    images: ImageInput[];
  };
  submitLabel?: string;
};

export default function ProductForm({ action, collections, initial, submitLabel = "Save Product" }: Props) {
  const [state, formAction, isPending] = useActionState<ProductFormState, FormData>(action, {});
  const [images, setImages] = useState<ImageInput[]>(
    initial?.images.length ? initial.images : [{ url: "", alt: "" }]
  );
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial);

  const err = (field: string) => state.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={err("name")}>
          <input
            name="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            className="input"
          />
        </Field>
        <Field label="Slug" error={err("slug")}>
          <input
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            className="input font-mono text-sm"
          />
        </Field>
      </div>

      <Field label="Description" error={err("description")}>
        <textarea
          name="description"
          required
          rows={3}
          defaultValue={initial?.description}
          className="input"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Collection" error={err("collectionId")}>
          <select name="collectionId" required defaultValue={initial?.collectionId ?? ""} className="input">
            <option value="" disabled>
              Select...
            </option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Category">
          <input
            name="category"
            list="category-options"
            defaultValue={initial?.category}
            className="input"
            placeholder="Earrings"
          />
          <datalist id="category-options">
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Material">
          <input name="material" defaultValue={initial?.material} className="input" placeholder="Gold-plated" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Finish">
          <input name="finish" defaultValue={initial?.finish} className="input" />
        </Field>
        <Field label="Care Note">
          <input name="careNote" defaultValue={initial?.careNote} className="input" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Price (PKR)" error={err("price")}>
          <input name="price" type="number" min={1} required defaultValue={initial?.price} className="input" />
        </Field>
        <Field label="Compare-at Price">
          <input
            name="compareAtPrice"
            type="number"
            min={1}
            defaultValue={initial?.compareAtPrice ?? ""}
            className="input"
          />
        </Field>
        <Field label="Cost Price (private)">
          <input
            name="costPrice"
            type="number"
            min={0}
            defaultValue={initial?.costPrice ?? ""}
            className="input"
          />
        </Field>
        <Field label="Stock" error={err("stock")}>
          <input name="stock" type="number" min={0} required defaultValue={initial?.stock ?? 0} className="input" />
        </Field>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Images</span>
          <button
            type="button"
            onClick={() => setImages((imgs) => [...imgs, { url: "", alt: "" }])}
            className="text-xs text-rose-dark hover:underline"
          >
            + Add image
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">
          Paste image URLs for now (Cloudinary upload comes next) — first image is the cover.
        </p>
        {err("images") && <p className="mt-1 text-sm text-red-600">{err("images")}</p>}
        <div className="mt-2 space-y-2">
          {images.map((img, i) => (
            <div key={i} className="flex gap-2">
              <input
                name="imageUrl"
                value={img.url}
                onChange={(e) =>
                  setImages((imgs) => imgs.map((im, j) => (j === i ? { ...im, url: e.target.value } : im)))
                }
                placeholder="https://res.cloudinary.com/..."
                className="input flex-[2]"
              />
              <input
                name="imageAlt"
                value={img.alt}
                onChange={(e) =>
                  setImages((imgs) => imgs.map((im, j) => (j === i ? { ...im, alt: e.target.value } : im)))
                }
                placeholder="Alt text"
                className="input flex-1"
              />
              <button
                type="button"
                onClick={() => setImages((imgs) => imgs.filter((_, j) => j !== i))}
                className="px-2 text-sm text-muted hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? false} />
          Active (visible on storefront)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isFeatured" defaultChecked={initial?.isFeatured ?? false} />
          Featured on homepage
        </label>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-foreground px-6 py-3 text-sm text-white hover:bg-rose-dark disabled:opacity-60"
      >
        {isPending ? "Saving..." : submitLabel}
      </button>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          padding: 0.55rem 0.75rem;
          font-size: 0.875rem;
          background: var(--surface);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
