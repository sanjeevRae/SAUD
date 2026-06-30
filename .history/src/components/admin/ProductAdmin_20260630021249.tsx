'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/data/products';
import MediaPicker from '@/components/admin/MediaPicker';
import { uploadToCloudinary } from '@/lib/cloudinary';

type Props = { token: string };

const blank: Product = {
  id: '',
  name: '',
  price: 0,
  category: '',
  image: '',
  description: '',
  rating: 5,
  stock: 0,
};

const inputClass = 'border border-[#ded8d0] bg-[#fbfaf8] px-3 py-2 text-sm outline-none transition focus:border-[#111111]';
const csv = (value?: string[]) => value?.join(', ') ?? '';
const list = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean);
const uniqueImages = (value: string[]) => Array.from(new Set(value.map(item => item.trim()).filter(Boolean))).slice(0, 5);
const colorsText = (colors?: Product['colors']) => colors?.map(color => `${color.name}:${color.hex}`).join(', ') ?? '';
const parseColors = (value: string) => list(value).map(item => {
  const [name, hex] = item.split(':').map(part => part.trim());
  return { name, hex: hex || '#111111' };
});

function money(value?: number) {
  return `Rs${Number(value || 0).toFixed(2)}`;
}

function nextProductId(products: Product[]) {
  const next = products.reduce((highest, product) => {
    const numeric = Number(product.id);
    return Number.isInteger(numeric) && numeric > highest ? numeric : highest;
  }, 0) + 1;
  return String(next);
}

export default function ProductAdmin({ token }: Props) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [form, setForm] = useState<Product>(blank);
  const [sizes, setSizes] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [colors, setColors] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [status, setStatus] = useState('');
  const [galleryUploading, setGalleryUploading] = useState(false);

  const headers = useMemo(() => ({ 'content-type': 'application/json', 'x-customer-id': token }), [token]);
  const selectedId = form.id;
  const generatedId = useMemo(() => nextProductId(items), [items]);
  const isEditingExisting = items.some(item => item.id === form.id);
  const gallery = images.length ? images : form.image ? [form.image] : [];
  const parsedColors = parseColors(colors);

  const load = useCallback(async () => {
    setStatus('Loading products...');
    const res = await fetch('/api/admin?action=products', { headers: { 'x-customer-id': token } });
    const data = await res.json();
    const nextItems = data.products ?? [];
    setItems(nextItems);
    setForm(current => current.id ? current : { ...current, id: nextProductId(nextItems) });
    setStatus(res.ok ? '' : data.error || 'Could not load products.');
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const edit = (product: Product) => {
    setForm(product);
    setSizes(csv(product.sizes));
    setImages(uniqueImages(product.images?.length ? product.images : product.image ? [product.image] : []));
    setColors(colorsText(product.colors));
    setSeoKeywords(csv(product.seoKeywords));
  };

  const reset = () => {
    setForm({ ...blank, id: generatedId });
    setSizes('');
    setImages([]);
    setColors('');
    setSeoKeywords('');
    setStatus('');
  };

  const addGalleryImage = (url: string) => {
    setImages(current => uniqueImages([url, ...current]));
  };

  const removeGalleryImage = (url: string) => {
    setImages(current => current.filter(image => image !== url));
    if (form.image === url) {
      const next = images.find(image => image !== url) || '';
      setForm(current => ({ ...current, image: next }));
    }
  };

  const selectMainImage = (url: string) => {
    setForm(current => ({ ...current, image: url, ogImage: current.ogImage || url }));
    addGalleryImage(url);
  };

  const uploadGalleryFiles = async (files?: FileList | null) => {
    const selected = Array.from(files ?? []).filter(file => file.type.startsWith('image/'));
    if (!selected.length) return;

    const slots = Math.max(0, 5 - images.length);
    if (slots === 0) {
      setStatus('Gallery already has 5 images. Remove one before adding more.');
      return;
    }

    const filesToUpload = selected.slice(0, slots);
    setGalleryUploading(true);
    setStatus(`Uploading ${filesToUpload.length} gallery image${filesToUpload.length === 1 ? '' : 's'}...`);
    try {
      const uploaded: string[] = [];
      for (const file of filesToUpload) {
        const result = await uploadToCloudinary(file, 'saud-leather/products');
        uploaded.push(result.secureUrl);
      }
      setImages(current => uniqueImages([...current, ...uploaded]));
      setForm(current => ({ ...current, image: current.image || uploaded[0] || '', ogImage: current.ogImage || uploaded[0] || '' }));
      setStatus(selected.length > slots ? `Uploaded ${filesToUpload.length}. Gallery is limited to 5 images.` : 'Gallery images uploaded.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Gallery upload failed.');
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const save = async () => {
    const productId = form.id.trim() || generatedId;
    if (!productId || !form.name.trim()) {
      setStatus('Product ID and name are required.');
      return;
    }

    setStatus('Saving product...');
    const imageList = uniqueImages(images);
    const product: Product = {
      ...form,
      id: productId,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      rating: Number(form.rating),
      reviewCount: form.reviewCount ? Number(form.reviewCount) : undefined,
      stock: Number(form.stock ?? 0),
      image: form.image || imageList[0] || '',
      images: imageList,
      sizes: list(sizes),
      colors: parseColors(colors),
      seoKeywords: list(seoKeywords),
    };

    const method = isEditingExisting ? 'PUT' : 'POST';
    const payload = isEditingExisting ? { ...product, id: product.id } : product;
    const res = await fetch('/api/admin?action=products', { method, headers, body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    setStatus(res.ok ? 'Saved. Product data is now stored in Firestore.' : data.error || 'Save failed.');
    if (res.ok) await load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    setStatus('Deleting product...');
    const res = await fetch(`/api/admin?action=products&id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'x-customer-id': token } });
    const data = await res.json().catch(() => ({}));
    setStatus(res.ok ? 'Deleted.' : data.error || 'Delete failed.');
    if (res.ok) await load();
  };


  return (
    <section className="border border-[#e0dbd4] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
      <div className="border-b border-[#eee8e1] p-5 md:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f1f35]">Products CRUD</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Manage product inventory</h2>
            <p className="mt-2 text-sm text-[#666666]">Create, edit, preview, upload images, and publish product data to Firestore.</p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href={`/admin?token=${encodeURIComponent(token)}#products`} className="inline-flex items-center justify-center border-2 border-[#111] bg-[#111] px-5 py-3 text-center text-sm font-semibold uppercase tracking-[0.08em] transition hover:bg-white hover:text-[#00000]" style={{ color: '#ffffff' }} >
              View all products
            </Link>
            <div className="grid grid-cols-3 border border-[#ded8d0] bg-[#faf8f5] text-center">
              <div className="border-r border-[#ded8d0] px-5 py-3">
                <p className="text-xl font-semibold">{items.length}</p>
                <p className="text-xs uppercase tracking-[0.14em] text-[#777]">Products</p>
              </div>
              <div className="border-r border-[#ded8d0] px-5 py-3">
                <p className="text-xl font-semibold">{items.reduce((sum, item) => sum + Number(item.stock || 0), 0)}</p>
                <p className="text-xs uppercase tracking-[0.14em] text-[#777]">Stock</p>
              </div>
              <div className="px-5 py-3">
                <p className="text-xl font-semibold">{items.filter(item => Number(item.stock || 0) > 0).length}</p>
                <p className="text-xs uppercase tracking-[0.14em] text-[#777]">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid xl:grid-cols-[360px_minmax(0,1fr)_360px]">
        <aside className="border-b border-[#eee8e1] p-5 md:p-6 xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f1f35]">Catalog</p>
              <h3 className="mt-1 text-xl font-semibold">Current products</h3>
            </div>
            <button onClick={reset} className="border border-[#ded8d0] px-4 py-2 text-sm font-medium hover:border-[#111]">New</button>
          </div>

          <div className="mt-5 grid max-h-[680px] gap-3 overflow-auto pr-1">
            {items.length === 0 && <p className="border border-dashed border-[#d8d2ca] p-5 text-sm text-[#777]">No products found.</p>}
            {items.map(product => (
              <button key={product.id} onClick={() => edit(product)} className={`flex items-center gap-3 border p-3 text-left transition ${selectedId === product.id ? 'border-[#111111] bg-[#f8f5f0]' : 'border-[#ebe6df] hover:border-[#c8beb4]'}`}>
                {product.image ? (
                  <img src={product.image} alt="" className="h-16 w-16 bg-[#eee9e2] object-cover" />
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center bg-[#eee9e2] text-xs font-semibold text-[#777]">No image</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{product.name}</span>
                  <span className="mt-1 block truncate text-xs text-[#777]">{product.category} / {money(product.price)}</span>
                </span>
                <span className={`px-2 py-1 text-xs font-semibold ${Number(product.stock || 0) > 0 ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>{product.stock ?? 0}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="border-b border-[#eee8e1] p-5 md:p-6 xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold">Product editor</h3>
            <span className="bg-[#f1ede7] px-3 py-1 text-xs font-semibold text-[#666]">{selectedId || 'new product'}</span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[#333]">
              Product ID
              <input value={form.id || generatedId} readOnly className={`${inputClass} cursor-not-allowed bg-[#f1ede7] text-[#666]`} />
              <span className="text-xs font-normal text-[#777]">{isEditingExisting ? 'Existing product ID' : 'Auto-generated next product ID'}</span>
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#333]">Name<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className={inputClass} /></label>
            <label className="grid gap-2 text-sm font-medium text-[#333]">Category<input value={form.category} onChange={event => setForm({ ...form, category: event.target.value })} className={inputClass} /></label>
            <label className="grid gap-2 text-sm font-medium text-[#333]">Tag<input value={form.tag ?? ''} onChange={event => setForm({ ...form, tag: event.target.value })} className={inputClass} /></label>
            <label className="grid gap-2 text-sm font-medium text-[#333]">Price<input type="number" value={form.price} onChange={event => setForm({ ...form, price: Number(event.target.value) })} className={inputClass} /></label>
            <label className="grid gap-2 text-sm font-medium text-[#333]">Original price<input type="number" value={form.originalPrice ?? ''} onChange={event => setForm({ ...form, originalPrice: event.target.value ? Number(event.target.value) : undefined })} className={inputClass} /></label>
            <label className="grid gap-2 text-sm font-medium text-[#333]">Stock<input type="number" value={form.stock ?? 0} onChange={event => setForm({ ...form, stock: Number(event.target.value) })} className={inputClass} /></label>
            <label className="grid gap-2 text-sm font-medium text-[#333]">Rating<input type="number" step="0.1" value={form.rating} onChange={event => setForm({ ...form, rating: Number(event.target.value) })} className={inputClass} /></label>
            <label className="grid gap-2 text-sm font-medium text-[#333]">Review count<input type="number" value={form.reviewCount ?? ''} onChange={event => setForm({ ...form, reviewCount: event.target.value ? Number(event.target.value) : undefined })} className={inputClass} /></label>
            <label className="grid gap-2 text-sm font-medium text-[#333]">Product link<input value={form.linkHref ?? ''} onChange={event => setForm({ ...form, linkHref: event.target.value })} className={inputClass} /></label>
            <label className="grid gap-2 text-sm font-medium text-[#333]">Canonical path<input value={form.canonicalPath ?? ''} onChange={event => setForm({ ...form, canonicalPath: event.target.value })} className={inputClass} /></label>
            <label className="grid gap-2 text-sm font-medium text-[#333] md:col-span-2">Main image URL<input value={form.image} onChange={event => setForm({ ...form, image: event.target.value })} className={inputClass} /></label>
                        <div className="md:col-span-2">
              <MediaPicker
                label="Product media picker"
                value={form.image}
                folder="saud-leather/products"
                helper="Upload from device, drag/drop, or paste a product image URL."
                onChange={url => setForm(current => ({ ...current, image: url }))}
                onUploaded={url => {
                  setForm(current => ({ ...current, image: url, ogImage: current.ogImage || url }));
                  addGalleryImage(url);
                }}
              />
            </div>
            <label className="grid gap-2 text-sm font-medium text-[#333] md:col-span-2">Description<textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className={`${inputClass} min-h-28`} /></label>
            <label className="grid gap-2 text-sm font-medium text-[#333] md:col-span-2">Sizes<input value={sizes} onChange={event => setSizes(event.target.value)} placeholder="S, M, L, XL" className={inputClass} /></label>
            <label className="grid gap-2 text-sm font-medium text-[#333] md:col-span-2">Colors<input value={colors} onChange={event => setColors(event.target.value)} placeholder="Olive:#556B2F, Black:#111111" className={inputClass} /></label>
            <div className="grid gap-3 text-sm font-medium text-[#333] md:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p>Gallery images</p>
                  <p className="mt-1 text-xs font-normal text-[#777]">Select multiple images. Maximum 5 images per product.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={galleryUploading || images.length >= 5} className="border border-[#111] bg-[#111] px-4 py-2 text-xs font-semibold text-white transition hover:bg-white hover:text-[#111] disabled:cursor-not-allowed disabled:border-[#ded8d0] disabled:bg-[#f1ede7] disabled:text-[#999]">
                    {galleryUploading ? 'Uploading...' : 'Select images'}
                  </button>
                  {images.length > 0 && <button type="button" onClick={() => setImages([])} className="border border-[#ded8d0] px-4 py-2 text-xs font-semibold transition hover:border-[#111]">Clear gallery</button>}
                </div>
              </div>
              <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={event => void uploadGalleryFiles(event.target.files)} className="hidden" />
              <div className="grid gap-3 sm:grid-cols-5">
                {images.map((image, index) => (
                  <div key={image} className={`group relative overflow-hidden border bg-[#f7f3ee] ${form.image === image ? 'border-[#111]' : 'border-[#ded8d0]'}`}>
                    <button type="button" onClick={() => selectMainImage(image)} className="block aspect-square w-full">
                      <img src={image} alt={`Gallery image ${index + 1}`} className="h-full w-full object-cover" />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/70 px-2 py-1 text-[11px] text-white">
                      <button type="button" onClick={() => selectMainImage(image)} className="font-semibold">{form.image === image ? 'Main' : 'Set main'}</button>
                      <button type="button" onClick={() => removeGalleryImage(image)} className="font-semibold text-white/80 hover:text-white">Remove</button>
                    </div>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 5 - images.length) }).map((_, index) => (
                  <button key={`empty-${index}`} type="button" onClick={() => galleryInputRef.current?.click()} disabled={galleryUploading} className="flex aspect-square items-center justify-center border border-dashed border-[#d8d2ca] bg-[#fbfaf8] text-xs font-normal text-[#777] transition hover:border-[#111] disabled:opacity-60">
                    Add image
                  </button>
                ))}
              </div>
            </div>
            <label className="grid gap-2 text-sm font-medium text-[#333] md:col-span-2">SEO title<input value={form.seoTitle ?? ''} onChange={event => setForm({ ...form, seoTitle: event.target.value })} className={inputClass} /></label>
            <label className="grid gap-2 text-sm font-medium text-[#333] md:col-span-2">SEO description<textarea value={form.seoDescription ?? ''} onChange={event => setForm({ ...form, seoDescription: event.target.value })} className={`${inputClass} min-h-24`} /></label>
            <label className="grid gap-2 text-sm font-medium text-[#333] md:col-span-2">SEO keywords<input value={seoKeywords} onChange={event => setSeoKeywords(event.target.value)} placeholder="fashion, hoodie, streetwear" className={inputClass} /></label>
            <label className="grid gap-2 text-sm font-medium text-[#333] md:col-span-2">OG image<input value={form.ogImage ?? ''} onChange={event => setForm({ ...form, ogImage: event.target.value })} className={inputClass} /></label>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button onClick={save} className="bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8f1f35]">Save product</button>
            {selectedId && <button onClick={() => void remove(selectedId)} className="border border-[#8f1f35] px-5 py-2.5 text-sm font-semibold text-[#8f1f35] transition hover:bg-[#8f1f35] hover:text-white">Delete</button>}
            <button onClick={reset} className="border border-[#ded8d0] px-5 py-2.5 text-sm font-semibold transition hover:border-[#111]">Clear</button>
            <p className="text-sm text-[#666]">{status}</p>
          </div>
        </div>

        <aside className="bg-[#f7f3ee] p-5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f1f35]">Live preview</p>
          <h3 className="mt-1 text-xl font-semibold">Product card</h3>
          <div className="mt-5 border border-[#ded8d0] bg-white">
            <div className="relative aspect-[4/5] bg-[#e8e2db]">
              {form.image ? <img src={form.image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-[#777]">Product image</div>}
              {form.tag && <span className="absolute left-3 top-3 bg-[#53c6cf] px-3 py-1 text-xs font-semibold text-white">{form.tag}</span>}
            </div>
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[#777]">{form.category || 'Category'}</p>
              <h4 className="mt-2 text-xl font-semibold leading-tight">{form.name || 'Product name'}</h4>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#666]">{form.description || 'Product description preview appears here.'}</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-lg font-semibold">{money(form.price)}</span>
                {form.originalPrice ? <span className="text-sm text-[#999] line-through">{money(form.originalPrice)}</span> : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {list(sizes).slice(0, 5).map(size => <span key={size} className="border border-[#ded8d0] px-3 py-1 text-xs">{size}</span>)}
              </div>
              <div className="mt-4 flex gap-2">
                {parsedColors.slice(0, 5).map(color => <span key={`${color.name}-${color.hex}`} title={color.name} className="h-5 w-5 border border-[#ded8d0]" style={{ backgroundColor: color.hex }} />)}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {gallery.slice(0, 3).map(image => <img key={image} src={image} alt="" className="aspect-square w-full border border-[#ded8d0] bg-white object-cover" />)}
          </div>
        </aside>
      </div>
    </section>
  );
}





