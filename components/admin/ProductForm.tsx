"use client";

import { useActionState, useRef, useState } from "react";
import { slugify } from "@/lib/slugify";
import type { ProductFormState } from "@/app/admin/products/actions";
import { PRODUCT_CATEGORIES, PRODUCT_OCCASION_TAGS } from "@/lib/categories";

type ImageInput = { url: string; alt: string; uploading?: boolean; error?: string };

type Props = {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  collections: { id: string; name: string }[];
  initial?: {
    name: string;
    slug: string;
    description: string;
    sku: string;
    material: string;
    finish: string;
    careNote: string;
    category: string;
    occasionTags: string[];
    tryOnImageUrl: string;
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

async function uploadFile(file: File): Promise<{ url?: string; error?: string }> {
  const body = new FormData();
  body.set("file", file);
  try {
    const res = await fetch("/api/admin/upload", { method: "POST", body });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? "Upload failed" };
    return { url: data.url };
  } catch {
    return { error: "Upload failed. Check your connection and try again." };
  }
}

export default function ProductForm({ action, collections, initial, submitLabel = "Save Product" }: Props) {
  const [state, formAction, isPending] = useActionState<ProductFormState, FormData>(action, {});
  const [images, setImages] = useState<ImageInput[]>(
    initial?.images.length ? initial.images : [{ url: "", alt: "" }]
  );
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [tryOnImage, setTryOnImage] = useState<{ url: string; uploading?: boolean; error?: string }>({
    url: initial?.tryOnImageUrl ?? "",
  });
  const [occasionTags, setOccasionTags] = useState<string[]>(initial?.occasionTags ?? []);
  const fileInputs = useRef<(HTMLInputElement | null)[]>([]);
  const tryOnFileInput = useRef<HTMLInputElement | null>(null);

  const err = (field: string) => state.fieldErrors?.[field]?.[0];

  async function handleFilePick(i: number, file: File | undefined) {
    if (!file) return;
    setImages((imgs) => imgs.map((im, j) => (j === i ? { ...im, uploading: true, error: undefined } : im)));
    const { url, error } = await uploadFile(file);
    setImages((imgs) =>
      imgs.map((im, j) =>
        j === i
          ? {
              ...im,
              uploading: false,
              error,
              url: url ?? im.url,
              alt: im.alt || (url ? file.name.replace(/\.[^.]+$/, "") : im.alt),
            }
          : im
      )
    );
  }

  async function handleTryOnFilePick(file: File | undefined) {
    if (!file) return;
    setTryOnImage((cur) => ({ ...cur, uploading: true, error: undefined }));
    const { url, error } = await uploadFile(file);
    setTryOnImage((cur) => ({ url: url ?? cur.url, uploading: false, error }));
  }

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

      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Item Code (SKU)" error={err("sku")}>
          <input
            name="sku"
            defaultValue={initial?.sku}
            className="input font-mono text-sm"
            placeholder="JS-BNG-001"
          />
        </Field>
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
        <Field label="Type">
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

      <div>
        <span className="text-sm font-medium text-foreground">Occasion Tags</span>
        <p className="mt-1 text-xs text-muted">
          When this piece is a good fit — pick as many as apply.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          {PRODUCT_OCCASION_TAGS.map((tag) => (
            <label
              key={tag}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                occasionTags.includes(tag)
                  ? "border-rose bg-rose-soft/60 text-rose-dark"
                  : "border-border text-foreground/80"
              }`}
            >
              <input
                type="checkbox"
                name="occasionTags"
                value={tag}
                checked={occasionTags.includes(tag)}
                onChange={(e) =>
                  setOccasionTags((tags) =>
                    e.target.checked ? [...tags, tag] : tags.filter((t) => t !== tag)
                  )
                }
                className="sr-only"
              />
              {tag}
            </label>
          ))}
        </div>
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
          Upload a photo, or paste an image URL directly — first image is the cover.
        </p>
        {err("images") && <p className="mt-1 text-sm text-red-600">{err("images")}</p>}
        <div className="mt-2 space-y-2">
          {images.map((img, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-border p-2">
              <button
                type="button"
                onClick={() => fileInputs.current[i]?.click()}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-dashed border-border bg-rose-soft/40 text-muted hover:border-rose"
              >
                {img.url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-only preview of an arbitrary/just-uploaded URL, not a storefront asset
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-lg">+</span>
                )}
                {img.uploading && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white">
                    ...
                  </span>
                )}
              </button>
              <input
                ref={(el) => {
                  fileInputs.current[i] = el;
                }}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={(e) => {
                  void handleFilePick(i, e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <div className="flex-1 space-y-1.5">
                <input
                  name="imageUrl"
                  value={img.url}
                  onChange={(e) =>
                    setImages((imgs) => imgs.map((im, j) => (j === i ? { ...im, url: e.target.value } : im)))
                  }
                  placeholder="Upload a photo, or paste an image URL"
                  className="input text-xs"
                />
                <input
                  name="imageAlt"
                  value={img.alt}
                  onChange={(e) =>
                    setImages((imgs) => imgs.map((im, j) => (j === i ? { ...im, alt: e.target.value } : im)))
                  }
                  placeholder="Alt text"
                  className="input text-xs"
                />
                {img.error && <p className="text-xs text-red-600">{img.error}</p>}
              </div>
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

      <div>
        <span className="text-sm font-medium text-foreground">Try-On Overlay (AR)</span>
        <p className="mt-1 text-xs text-muted">
          An isolated cutout of just the jewelry, transparent background (PNG) — not a catalog photo. Only shown for
          Earrings, Tikka and Necklaces categories. Leave empty and the storefront simply won&apos;t offer try-on
          for this product.
        </p>
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-border p-2">
          <button
            type="button"
            onClick={() => tryOnFileInput.current?.click()}
            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-dashed border-border bg-[repeating-conic-gradient(#e5e5e5_0%_25%,transparent_0%_50%)] bg-[length:10px_10px] text-muted hover:border-rose"
          >
            {tryOnImage.url ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin-only preview of an arbitrary/just-uploaded URL, not a storefront asset
              <img src={tryOnImage.url} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg">+</span>
            )}
            {tryOnImage.uploading && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white">
                ...
              </span>
            )}
          </button>
          <input
            ref={tryOnFileInput}
            type="file"
            accept="image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              void handleTryOnFilePick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <div className="flex-1 space-y-1.5">
            <input
              name="tryOnImageUrl"
              value={tryOnImage.url}
              onChange={(e) => setTryOnImage({ url: e.target.value })}
              placeholder="Upload a transparent PNG, or paste an image URL"
              className="input text-xs"
            />
            {err("tryOnImageUrl") && <p className="text-xs text-red-600">{err("tryOnImageUrl")}</p>}
            {tryOnImage.error && <p className="text-xs text-red-600">{tryOnImage.error}</p>}
          </div>
          {tryOnImage.url && (
            <button
              type="button"
              onClick={() => setTryOnImage({ url: "" })}
              className="px-2 text-sm text-muted hover:text-red-600"
            >
              ✕
            </button>
          )}
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
