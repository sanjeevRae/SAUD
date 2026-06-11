'use client';

import { useRef, useState } from 'react';
import { uploadToCloudinary } from '@/lib/cloudinary';

type MediaPickerProps = {
  label: string;
  value?: string;
  folder: string;
  helper?: string;
  onChange: (url: string) => void;
  onUploaded?: (url: string) => void;
};

export default function MediaPicker({ label, value = '', folder, helper, onChange, onUploaded }: MediaPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const pickFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const result = await uploadToCloudinary(file, folder);
      onChange(result.secureUrl);
      onUploaded?.(result.secureUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="grid gap-3 text-sm font-medium text-[#333]">
      <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        {value && <button type="button" onClick={() => onChange('')} className="text-xs font-semibold text-[#8f1f35]">Remove</button>}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={event => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={event => { event.preventDefault(); setDragging(false); void pickFile(event.dataTransfer.files?.[0]); }}
        className={`group relative overflow-hidden border border-dashed p-3 text-left transition ${dragging ? 'border-[#111111] bg-[#f8f5f0]' : 'border-[#d8d2ca] bg-[#fbfaf8] hover:border-[#111111]'}`}
      >
        <div className="relative aspect-[16/9] bg-[#e8e2db]">
          {value ? <img src={value} alt="Selected media preview" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-[#777]">Drop image here or click to upload</div>}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs text-white opacity-0 transition group-hover:opacity-100">
            {uploading ? 'Uploading...' : 'Choose image'}
          </div>
        </div>
      </button>

      <input ref={inputRef} type="file" accept="image/*" onChange={event => void pickFile(event.target.files?.[0])} className="hidden" />

      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#777]">
        Image URL
        <input value={value} onChange={event => onChange(event.target.value)} placeholder="https://..." className="border border-[#ded8d0] bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-[#111] outline-none transition focus:border-[#111111]" />
      </label>

      <div className="flex items-center justify-between gap-3 text-xs font-normal text-[#777]">
        <span>{helper || 'Uploads are stored in Cloudinary.'}</span>
        <span>{uploading ? 'Uploading...' : value ? 'Ready' : 'Empty'}</span>
      </div>
      {error && <p className="bg-[#fee2e2] p-2 text-xs font-normal text-[#991b1b]">{error}</p>}
    </div>
  );
}
