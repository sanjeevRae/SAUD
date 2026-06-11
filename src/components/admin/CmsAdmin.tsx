'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import MediaPicker from '@/components/admin/MediaPicker';

type Field = { key: string; label: string; type?: 'text' | 'number' | 'textarea' | 'checkbox' | 'image' | 'list' };
type Config = { key: string; title: string; eyebrow: string; path: string; idField: string; fields: Field[] };
type Item = Record<string, string | number | boolean | string[] | undefined>;

const configs: Config[] = [
  { key: 'hero', title: 'Hero Banners', eyebrow: 'First impression', path: 'homepage/heroBanners/items', idField: 'id', fields: [
    { key: 'id', label: 'ID' }, { key: 'title', label: 'Title' }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'image', label: 'Image', type: 'image' }, { key: 'primaryLabel', label: 'Primary label' }, { key: 'primaryHref', label: 'Primary link' }, { key: 'secondaryLabel', label: 'Secondary label' }, { key: 'secondaryHref', label: 'Secondary link' }, { key: 'enabled', label: 'Enabled', type: 'checkbox' },
  ]},
  { key: 'featured', title: 'Featured Products', eyebrow: 'Homepage shelf', path: 'homepage/featuredProducts/items', idField: 'id', fields: [
    { key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'category', label: 'Category' }, { key: 'price', label: 'Price', type: 'number' }, { key: 'originalPrice', label: 'Original price', type: 'number' }, { key: 'stock', label: 'Stock', type: 'number' }, { key: 'rating', label: 'Rating', type: 'number' }, { key: 'featuredOrder', label: 'Featured order', type: 'number' }, { key: 'enabled', label: 'Enabled', type: 'checkbox' }, { key: 'image', label: 'Image', type: 'image' }, { key: 'linkHref', label: 'Product link' }, { key: 'sizes', label: 'Sizes', type: 'list' }, { key: 'description', label: 'Description', type: 'textarea' },
  ]},
  { key: 'collections', title: 'Collections', eyebrow: 'Homepage carousel', path: 'homepage/collections/items', idField: 'id', fields: [{ key: 'id', label: 'ID' }, { key: 'title', label: 'Title' }, { key: 'image', label: 'Image', type: 'image' }, { key: 'linkHref', label: 'Collection link' }] },
  { key: 'categories', title: 'Categories', eyebrow: 'Shopping paths', path: 'categories', idField: 'id', fields: [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'stock', label: 'Stock', type: 'number' }, { key: 'image', label: 'Image', type: 'image' }, { key: 'linkHref', label: 'Category link' }] },
  { key: 'testimonials', title: 'Testimonials', eyebrow: 'Customer proof', path: 'testimonials', idField: 'id', fields: [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'rating', label: 'Rating', type: 'number' }, { key: 'text', label: 'Text', type: 'textarea' }, { key: 'avatar', label: 'Avatar', type: 'image' }, { key: 'date', label: 'Date' }] },
];

function textValue(item: Item, keys: string[], fallback = 'Untitled') {
  const value = keys.map(key => item[key]).find(Boolean);
  return String(value || fallback);
}

function imageValue(item: Item) {
  return String(item.image || item.avatar || '');
}

export default function CmsAdmin({ token }: { token: string }) {
  const [activeKey, setActiveKey] = useState(configs[0].key);
  const config = useMemo(() => configs.find(item => item.key === activeKey) ?? configs[0], [activeKey]);
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<Item>({ enabled: true });
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setStatus('Loading current content...');
    const res = await fetch(`/api/admin/cms?path=${encodeURIComponent(config.path)}`, { headers: { 'x-admin-token': token } });
    const data = await res.json();
    setItems(data.items ?? []);
    setStatus(res.ok ? '' : data.error || 'Could not load content.');
  }, [config.path, token]);

  useEffect(() => { setForm({ enabled: true }); void load(); }, [config.path, load]);

  const save = async () => {
    const id = String(form[config.idField] || '').trim();
    if (!id) { setStatus('ID required.'); return; }
    setStatus('Saving changes...');
    const res = await fetch('/api/admin/cms', { method: 'PUT', headers: { 'content-type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ path: config.path, id, data: form }) });
    const data = await res.json().catch(() => ({}));
    setStatus(res.ok ? 'Saved. Preview and storefront will update from Firestore.' : data.error || 'Save failed.');
    if (res.ok) await load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this content item?')) return;
    setStatus('Deleting...');
    const res = await fetch(`/api/admin/cms?path=${encodeURIComponent(config.path)}&id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'x-admin-token': token } });
    const data = await res.json().catch(() => ({}));
    setStatus(res.ok ? 'Deleted.' : data.error || 'Delete failed.');
    if (res.ok) await load();
  };


  const previewImage = imageValue(form);
  const selectedId = String(form[config.idField] || '');

  return (
    <section className="border border-[#e0dbd4] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
      <div className="border-b border-[#eee8e1] p-5 md:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f1f35]">Homepage CMS</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Edit live storefront sections</h2>
            <p className="mt-2 text-sm text-[#666666]">Select a section, edit content, preview it, then save to Firestore.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {configs.map(item => (
              <button key={item.key} onClick={() => setActiveKey(item.key)} className={`px-4 py-2 text-sm font-medium transition ${item.key === activeKey ? 'bg-[#111111] text-white' : 'border border-[#ded8d0] bg-[#faf8f5] text-[#333333] hover:border-[#111111]'}`}>
                {item.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
        <aside className="border-b border-[#eee8e1] p-5 md:p-6 xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f1f35]">{config.eyebrow}</p>
              <h3 className="mt-1 text-xl font-semibold">Current {config.title}</h3>
            </div>
            <span className="bg-[#f1ede7] px-3 py-1 text-xs font-semibold text-[#666]">{items.length}</span>
          </div>
          <div className="mt-5 grid max-h-[620px] gap-3 overflow-auto pr-1">
            {items.length === 0 && <p className="border border-dashed border-[#d8d2ca] p-5 text-sm text-[#777]">No saved items yet.</p>}
            {items.map(item => {
              const id = String(item.id);
              return (
                <button key={id} onClick={() => setForm(item)} className={`flex items-center gap-3 border p-3 text-left transition ${selectedId === id ? 'border-[#111111] bg-[#f8f5f0]' : 'border-[#ebe6df] hover:border-[#c8beb4]'}`}>
                  <img src={imageValue(item)} alt="" className="h-16 w-16 bg-[#eee9e2] object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{textValue(item, ['title', 'name', 'id'])}</span>
                    <span className="mt-1 block truncate text-xs text-[#777]">{id}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="border-b border-[#eee8e1] p-5 md:p-6 xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold">Editor</h3>
            <button onClick={() => setForm({ enabled: true })} className="border border-[#ded8d0] px-4 py-2 text-sm font-medium hover:border-[#111]">New item</button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {config.fields.map(field => (
              <label key={field.key} className={`${field.type === 'textarea' || field.type === 'image' ? 'md:col-span-2' : ''} grid gap-2 text-sm font-medium text-[#333]`}>
                {field.label}
                {field.type === 'textarea' ? (
                  <textarea value={String(form[field.key] ?? '')} onChange={event => setForm({ ...form, [field.key]: event.target.value })} className="min-h-28 border border-[#ded8d0] bg-[#fbfaf8] px-3 py-2 text-sm font-normal outline-none transition focus:border-[#111111]" />
                ) : field.type === 'checkbox' ? (
                  <span className="flex items-center gap-3 border border-[#ded8d0] bg-[#fbfaf8] px-3 py-2 font-normal">
                    <input type="checkbox" checked={Boolean(form[field.key])} onChange={event => setForm({ ...form, [field.key]: event.target.checked })} />
                    Visible on storefront
                  </span>
                ) : field.type === 'list' ? (
                  <input type="text" value={Array.isArray(form[field.key]) ? (form[field.key] as string[]).join(', ') : String(form[field.key] ?? '')} onChange={event => setForm({ ...form, [field.key]: event.target.value.split(',').map(item => item.trim()).filter(Boolean) })} className="border border-[#ded8d0] bg-[#fbfaf8] px-3 py-2 text-sm font-normal outline-none transition focus:border-[#111111]" />
                ) : (
                  <input type={field.type === 'number' ? 'number' : 'text'} value={String(form[field.key] ?? '')} onChange={event => setForm({ ...form, [field.key]: field.type === 'number' ? Number(event.target.value) : event.target.value })} className="border border-[#ded8d0] bg-[#fbfaf8] px-3 py-2 text-sm font-normal outline-none transition focus:border-[#111111]" />
                )}
                {field.type === 'image' && (
                  <MediaPicker
                    label={`${field.label} picker`}
                    value={String(form[field.key] || '')}
                    folder={`chitratech-shop/${config.key}`}
                    helper="Drag an image here, upload from device, or paste a URL."
                    onChange={url => setForm(current => ({ ...current, [field.key]: url }))}
                  />
                )}
              </label>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button onClick={save} className="bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8f1f35]">Save changes</button>
            {selectedId && <button onClick={() => void remove(selectedId)} className="border border-[#8f1f35] px-5 py-2.5 text-sm font-semibold text-[#8f1f35] transition hover:bg-[#8f1f35] hover:text-white">Delete</button>}
            <p className="text-sm text-[#666]">{status}</p>
          </div>
        </div>

        <aside className="bg-[#f7f3ee] p-5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f1f35]">Live preview</p>
          <h3 className="mt-1 text-xl font-semibold">Current draft</h3>
          <div className="mt-5 overflow-hidden border border-[#ded8d0] bg-white">
            <div className="relative aspect-[4/3] bg-[#e8e2db]">
              {previewImage ? <img src={previewImage} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-[#777]">Image preview</div>}
              {config.key === 'hero' && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 text-white"><p className="text-2xl font-semibold leading-tight">{textValue(form, ['title'], 'Hero title')}</p><p className="mt-2 line-clamp-2 text-sm text-white/80">{textValue(form, ['description'], 'Hero description appears here.')}</p></div>}
            </div>
            {config.key !== 'hero' && (
              <div className="p-5">
                <p className="text-lg font-semibold">{textValue(form, ['title', 'name'], `${config.title} title`)}</p>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#666]">{textValue(form, ['description', 'text'], 'Short content preview appears here.')}</p>
              </div>
            )}
            <div className="border-t border-[#eee8e1] p-4 text-xs text-[#777]">
              <p>ID: {selectedId || 'new item'}</p>
              <p className="mt-1">Collection: {config.path}</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}



