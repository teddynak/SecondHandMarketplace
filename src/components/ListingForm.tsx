'use client';
import { FormEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Camera, ImagePlus, LoaderCircle, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/types';
import { CATEGORIES, CONDITIONS } from '@/types';
import { useAuth } from '@/components/AuthProvider';
import { isImageSource } from '@/lib/image-source';
import { api } from '@/lib/client';
import ProductImage from './ProductImage';
import { Notice } from './Notice';
export default function ListingForm({ product }: { product?: Product }) {
 const { user, refresh } = useAuth(); const router = useRouter(); const fileRef = useRef<HTMLInputElement>(null);
 const [title, setTitle] = useState(product?.title ?? ''); const [description, setDescription] = useState(product?.description ?? '');
 const [category, setCategory] = useState<string>(product?.category ?? 'Clothing'); const [condition, setCondition] = useState<string>(product?.condition ?? 'Good');
 const [price, setPrice] = useState(product?.price?.toString() ?? ''); const [location, setLocation] = useState(product?.location ?? user?.location ?? '');
 const [phone, setPhone] = useState(product?.sellerPhone ?? user?.phone ?? ''); const [images, setImages] = useState<string[]>(product?.images ?? []);
 const [imageUrl, setImageUrl] = useState('');
 const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(false); const [error, setError] = useState('');
 function addImageUrl() {
  const value = imageUrl.trim();
  if (!value.startsWith('https://') || !isImageSource(value)) { setError('Enter a valid HTTPS link to an image.'); return; }
  if (images.length >= 4) { setError('You can add up to 4 photos in total.'); return; }
  if (images.includes(value)) { setError('That image is already added.'); return; }
  setImages(previous => [...previous, value]); setImageUrl(''); setError('');
 }
 async function uploadFiles(files: FileList | null) {
  if (!files?.length) return;
  setUploading(true); setError('');
  try {
   const slots = 4-images.length;
   if (files.length > slots) throw new Error(`You can add up to 4 photos in total (${slots} slots remaining).`);
   const results: string[] = [];
   for (const file of Array.from(files)) {
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Please use JPG, PNG or WebP images.');
    if (file.size > 2 * 1024 * 1024) throw new Error('Each image must be smaller than 2 MB.');
    const body = new FormData(); body.append('file',file);
    const response = await api<{ url: string }>('/api/uploads', { method:'POST',body });
    results.push(response.url);
    setImages(previous => [...previous, response.url]);
   }
   toast.success(`${results.length} photo${results.length === 1 ? '' : 's'} uploaded.`);
  } catch(e) { setError((e as Error).message); toast.error('Image upload failed.'); }
  finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
 }
 async function submit(event: FormEvent) {
  event.preventDefault();
  if (imageUrl.trim()) { setError('Click Add image link, or clear the image URL before publishing.'); return; }
  setBusy(true); setError('');
  try {
   const payload = { title, description, category, condition, price:Number(price), location, sellerPhone:phone, images };
   const response = await api<{ item: Product }>(product ? `/api/items/${product.id}` : '/api/items', { method: product ? 'PATCH':'POST', body: JSON.stringify(payload) });
   await refresh(); toast.success(product ? 'Listing updated successfully!' : 'Your item is live! Welcome to selling on ReUse.');
   router.push(`/items/${response.item.id}`); router.refresh();
  } catch(e) { setError((e as Error).message); window.scrollTo({top:0,behavior:'smooth'}); }
  finally { setBusy(false); }
 }
 return <form className="listing-form" onSubmit={submit}>
  {error && <Notice message={error}/>}
  <div className="form-card"><div className="form-card-heading"><span className="form-step-icon"><Camera size={23}/></span><div><h2>Product photos</h2><p>Good photos help your item find a new home. Up to 4 images.</p></div></div>
   <div className="image-upload-grid">{images.map((url,i) => <div className="upload-preview" key={url}><ProductImage src={url} alt={`Photo ${i+1}`}/><button type="button" className="remove-photo" onClick={() => setImages(v=>v.filter((_,index)=>index!==i))} disabled={uploading||busy} aria-label={`Remove photo ${i+1}`}><X size={16}/></button>{i===0 && <span className="cover-photo">Cover</span>}</div>)}
   {images.length < 4 && <button type="button" className="upload-target" onClick={() => fileRef.current?.click()} disabled={uploading||busy}><ImagePlus size={31}/><strong>{uploading ? 'Uploading...' : 'Add photos'}</strong><span>JPG, PNG or WebP · Max 2 MB</span></button>}</div>
   <div className="image-url-field"><label htmlFor="image-url">Or add an image link</label><div className="image-url-row"><input className="input" id="image-url" type="url" maxLength={2048} value={imageUrl} onChange={event=>setImageUrl(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();addImageUrl();}}} placeholder="https://example.com/photo.jpg" disabled={uploading||busy||images.length>=4}/><button className="btn btn-outline" type="button" onClick={addImageUrl} disabled={uploading||busy||images.length>=4||!imageUrl.trim()}>Add image link</button></div><p className="field-hint">Upload JPG, PNG or WebP to save the photo in our database (2 MB each), or paste a public HTTPS image link. Up to 4 photos total. Linked images remain on their original website.</p></div>
   <input ref={fileRef} hidden type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={event=>void uploadFiles(event.target.files)}/>
  </div>
  <div className="form-card"><div className="form-card-heading"><span className="form-step-icon">01</span><div><h2>Tell us about your item</h2><p>A few details make a great listing.</p></div></div>
   <div className="form-field"><label htmlFor="title">Item title <strong>*</strong></label><input className="input" id="title" maxLength={110} minLength={3} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Gently used Samsung Galaxy A54" required/></div>
   <div className="form-row"><div className="form-field"><label htmlFor="category">Category <strong>*</strong></label><select className="input" id="category" value={category} onChange={e=>setCategory(e.target.value)}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div><div className="form-field"><label htmlFor="condition">Condition <strong>*</strong></label><select className="input" id="condition" value={condition} onChange={e=>setCondition(e.target.value)}>{CONDITIONS.map(c=><option key={c}>{c}</option>)}</select></div></div>
   <div className="form-field"><label htmlFor="description">Description <strong>*</strong></label><textarea className="input textarea" id="description" required minLength={15} maxLength={2500} rows={6} placeholder="What's special about it? How long have you used it? Any marks or defects?" value={description} onChange={e=>setDescription(e.target.value)}/><span className="field-hint">{description.length}/2500 characters · Be honest about condition.</span></div>
  </div>
  <div className="form-card"><div className="form-card-heading"><span className="form-step-icon">02</span><div><h2>Price and location</h2><p>Set a fair price and tell buyers where to find you.</p></div></div>
   <div className="form-row"><div className="form-field"><label htmlFor="price">Asking price (UGX) <strong>*</strong></label><div className="price-input"><span>UGX</span><input id="price" type="number" required min="1" max="1000000000" step="1" value={price} onChange={e=>setPrice(e.target.value)} placeholder="e.g. 85000"/></div></div><div className="form-field"><label htmlFor="location">Location <strong>*</strong></label><input className="input" id="location" required minLength={2} maxLength={120} value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Makerere, Kampala"/></div></div>
   <div className="form-field"><label htmlFor="phone">Contact phone / WhatsApp <strong>*</strong></label><input className="input" id="phone" type="tel" required minLength={7} maxLength={25} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="e.g. +256 7XX XXX XXX"/><span className="field-hint">Buyers will be able to contact you directly. Your account email will also appear.</span></div>
  </div>
  <div className="form-submit-footer"><span><ShieldCheck size={20}/> You control your listing. Deletions require admin approval.</span><div><button type="button" className="btn btn-outline" onClick={()=>router.back()}><ArrowLeft size={18}/> Cancel</button><button type="submit" disabled={busy||uploading} className="btn btn-primary">{busy ? <><LoaderCircle className="spin" size={18}/> Saving...</> : <>{product ? 'Save changes' : 'Publish listing'} <ArrowRight size={18}/></>}</button></div></div>
 </form>;
}
