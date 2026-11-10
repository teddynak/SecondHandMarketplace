'use client';
import { FormEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Camera, Eye, ImagePlus, LoaderCircle, MapPin, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/types';
import { CATEGORIES } from '@/types';
import { useAuth } from '@/components/AuthProvider';
import { isImageSource } from '@/lib/image-source';
import { productSchema } from '@/lib/validators';
import { movePhoto } from '@/lib/photos';
import Dialog from './Dialog';
import { api, money } from '@/lib/client';
import ProductImage from './ProductImage';
import { Notice } from './Notice';
export default function ListingForm({ product }: { product?: Product }) {
 const { user, refresh } = useAuth(); const router = useRouter(); const fileRef = useRef<HTMLInputElement>(null);
 const [title, setTitle] = useState(product?.title ?? ''); const [description, setDescription] = useState(product?.description ?? '');
 const [category, setCategory] = useState<string>(product?.category ?? 'Clothing');
 const [price, setPrice] = useState(product?.price?.toString() ?? ''); const [location, setLocation] = useState(product?.location ?? user?.location ?? '');
 const [phone, setPhone] = useState(product?.sellerPhone ?? user?.phone ?? ''); const [images, setImages] = useState<string[]>(product?.images ?? []);
 const [imageUrl, setImageUrl] = useState('');
 const [review,setReview]=useState<ReturnType<typeof productSchema.parse>|null>(null);const [previewPhoto,setPreviewPhoto]=useState(0);const [announcement,setAnnouncement]=useState('');const [fieldErrors,setFieldErrors]=useState<Record<string,string>>({});const saving=useRef(false);
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
 function reorderPhoto(from:number,to:number){if(uploading||busy)return;setImages(values=>movePhoto(values,from,to));requestAnimationFrame(()=>document.getElementById(`listing-photo-${to}`)?.focus({preventScroll:true}));setAnnouncement(to===0?`Photo ${from+1} is now the cover photo.`:`Photo ${from+1} moved to position ${to+1}.`);}
 function submit(event:FormEvent){
  event.preventDefault();if(busy||uploading)return;
  if(imageUrl.trim()){setError('Click Add image link, or clear the image URL before reviewing.');document.getElementById('image-url')?.focus();return;}
  const result=productSchema.safeParse({title,description,category,price:Number(price),location,sellerPhone:phone,images});
  if(!result.success){const fields:Record<string,string>={};for(const issue of result.error.issues){const key=String(issue.path[0]);if(!fields[key])fields[key]=issue.message;}setFieldErrors(fields);setError('Please correct the highlighted fields before reviewing.');requestAnimationFrame(()=>document.querySelector<HTMLElement>('.listing-form [aria-invalid="true"]')?.focus());return;}
  setFieldErrors({});setError('');setPreviewPhoto(0);setReview(result.data);
 }
 async function publish(){
  if(!review||saving.current)return;saving.current=true;setBusy(true);setError('');
  try{
   const response=await api<{item:Product}>(product?`/api/items/${product.id}`:'/api/items',{method:product?'PATCH':'POST',body:JSON.stringify(review)});
   await refresh();toast.success(product?'Listing updated successfully!':'Your item is live! Welcome to selling on ReUse.');
   router.push(`/items/${response.item.id}`);router.refresh();
  }catch(error){setError((error as Error).message);}finally{saving.current=false;setBusy(false);}
 }
 function fieldProps(key:string){return {'aria-invalid':!!fieldErrors[key],'aria-describedby':fieldErrors[key]?`${key}-error`:undefined};}
 function fieldError(key:string){return fieldErrors[key]?<p className="field-error" id={`${key}-error`}>{fieldErrors[key]}</p>:null;}

 return <form className="listing-form" onSubmit={submit} aria-busy={busy||uploading||undefined}>
  <fieldset className="listing-fields" disabled={busy}>
  {error && !review && <Notice message={error}/>}
  <div className="form-card"><div className="form-card-heading"><span className="form-step-icon"><Camera size={23}/></span><div><h2>Product photos</h2><p>Good photos help your item find a new home. Up to 4 images.</p></div></div>
   <div className="image-upload-grid">{images.map((url,i) => <div className="photo-edit-card" key={url} id={`listing-photo-${i}`} role="group" aria-label={`Photo ${i+1}${i===0?' · Cover':''}`} tabIndex={-1}><div className="upload-preview"><ProductImage src={url} alt={`Photo ${i+1}`}/><button type="button" className="remove-photo" onClick={() => setImages(v=>v.filter((_,index)=>index!==i))} disabled={uploading||busy} aria-label={`Remove photo ${i+1}`}><X size={16}/></button>{i===0 && <span className="cover-photo">Cover</span>}</div><div className="photo-controls"><span>Photo {i+1}{i===0?' · Cover':''}</span><div className="photo-order-buttons"><button type="button" className="photo-order" disabled={uploading||busy||i===0} onClick={()=>reorderPhoto(i,i-1)} aria-label={`Move photo ${i+1} earlier`} title="Move earlier"><ArrowLeft size={16}/></button><button type="button" className="photo-order" disabled={uploading||busy||i===images.length-1} onClick={()=>reorderPhoto(i,i+1)} aria-label={`Move photo ${i+1} later`} title="Move later"><ArrowRight size={16}/></button></div>{i!==0&&<button type="button" className="photo-cover-action" disabled={uploading||busy} onClick={()=>reorderPhoto(i,0)} aria-label={`Make photo ${i+1} the cover`}>Make cover</button>}</div></div>)}
   {images.length < 4 && <button type="button" className="upload-target" onClick={() => fileRef.current?.click()} disabled={uploading||busy}><ImagePlus size={31}/><strong>{uploading ? 'Uploading...' : 'Add photos'}</strong><span>JPG, PNG or WebP · Max 2 MB</span></button>}</div>
   <p className="photo-help">The first photo is your cover. Use the arrow buttons to change the order.</p><p className="sr-only" role="status" aria-live="polite">{announcement}</p>
   <div className="image-url-field"><label htmlFor="image-url">Or add an image link</label><div className="image-url-row"><input className="input" id="image-url" type="url" maxLength={2048} value={imageUrl} onChange={event=>setImageUrl(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();addImageUrl();}}} placeholder="https://example.com/photo.jpg" disabled={uploading||busy||images.length>=4}/><button className="btn btn-outline" type="button" onClick={addImageUrl} disabled={uploading||busy||images.length>=4||!imageUrl.trim()}>Add image link</button></div><p className="field-hint">Upload JPG, PNG or WebP to save the photo in our database (2 MB each), or paste a public HTTPS image link. Up to 4 photos total. Linked images remain on their original website.</p></div>
   <input ref={fileRef} hidden type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={event=>void uploadFiles(event.target.files)}/>
  </div>
  <div className="form-card"><div className="form-card-heading"><span className="form-step-icon">01</span><div><h2>Tell us about your item</h2><p>A few details make a great listing.</p></div></div>
   <div className="form-field"><label htmlFor="title">Item title <strong>*</strong></label><input className="input" id="title" {...fieldProps('title')} maxLength={110} minLength={3} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Gently used Samsung Galaxy A54" required/>{fieldError('title')}</div>
   <div className="form-field"><label htmlFor="category">Category <strong>*</strong></label><select className="input" id="category" value={category} onChange={event=>setCategory(event.target.value)}>{CATEGORIES.map(category=><option key={category}>{category}</option>)}</select></div>
   <div className="used-only-notice"><ShieldCheck size={19}/><p><strong>Used items only.</strong> List items that have already been used. New and unused items are not accepted. Describe wear, faults and repairs honestly below.</p></div>
   <div className="form-field"><label htmlFor="description">Description <strong>*</strong></label><textarea className="input textarea" id="description" {...fieldProps('description')} required minLength={15} maxLength={2500} rows={6} placeholder="How long have you used it? Describe any wear, faults or repairs." value={description} onChange={e=>setDescription(e.target.value)}/>{fieldError('description')}<span className="field-hint">{description.length}/2500 characters · Be honest about condition.</span></div>
  </div>
  <div className="form-card"><div className="form-card-heading"><span className="form-step-icon">02</span><div><h2>Price and location</h2><p>Set a fair price and tell buyers where to find you.</p></div></div>
   <div className="form-row"><div className="form-field"><label htmlFor="price">Asking price (UGX) <strong>*</strong></label><div className="price-input"><span>UGX</span><input id="price" {...fieldProps('price')} type="number" required min="1" max="1000000000" step="1" value={price} onChange={e=>setPrice(e.target.value)} placeholder="e.g. 85000"/></div>{fieldError('price')}</div><div className="form-field"><label htmlFor="location">Location <strong>*</strong></label><input className="input" id="location" {...fieldProps('location')} required minLength={2} maxLength={120} value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Makerere, Kampala"/>{fieldError('location')}</div></div>
   <div className="form-field"><label htmlFor="phone">Contact phone / WhatsApp <strong>*</strong></label><input className="input" id="phone" {...fieldProps('sellerPhone')} type="tel" required minLength={7} maxLength={25} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="e.g. +256 7XX XXX XXX"/>{fieldError('sellerPhone')}<span className="field-hint">Buyers will be able to contact you directly. Your account email will also appear.</span></div>
  </div>
  <div className="form-submit-footer"><span><ShieldCheck size={20}/> Review everything before your listing goes live.</span><div><button type="button" className="btn btn-outline" disabled={busy||uploading} onClick={()=>router.push('/dashboard')}><ArrowLeft size={18}/> Cancel</button><button type="submit" disabled={busy||uploading} className="btn btn-primary"><Eye size={18}/>{product?'Review changes':'Review listing'}<ArrowRight size={18}/></button></div></div>
  </fieldset>
  {review&&<Dialog wide labelledBy="preview-title" describedBy="preview-description" onClose={()=>{setReview(null);setError('');}} busy={busy}><button type="button" className="dialog-close" aria-label="Close preview" disabled={busy} onClick={()=>{setReview(null);setError('');}}><X/></button><span className="preview-badge">Draft preview · Not published</span><h2 id="preview-title" tabIndex={-1} data-autofocus>{product?'Review your changes':'Preview your listing'}</h2><p id="preview-description">Check the photos, details and contact information. {product?'Changes are saved':'Your listing goes live'} only after you confirm.</p>{error&&<Notice message={error}/>}<div className="listing-preview-grid"><div><div className="listing-preview-photo"><ProductImage src={review.images[previewPhoto]} alt={review.title}/></div>{review.images.length>1&&<div className="image-thumbs">{review.images.map((url,index)=><button type="button" className={previewPhoto===index?'active':''} key={url} aria-label={`Preview photo ${index+1}`} aria-pressed={previewPhoto===index} onClick={()=>setPreviewPhoto(index)}><ProductImage src={url} alt={`Photo ${index+1}`}/></button>)}</div>}</div><div className="listing-preview-details"><h3>{review.title}</h3><strong className="preview-price">{money(review.price)}</strong><p className="preview-location"><MapPin size={15}/>{review.location}</p><dl><div><dt>Category</dt><dd>{review.category}</dd></div><div><dt>Seller</dt><dd>{user?.name}</dd></div><div><dt>Phone / WhatsApp</dt><dd>{review.sellerPhone}</dd></div><div><dt>Email</dt><dd>{user?.email}</dd></div></dl><p className="preview-description">{review.description}</p></div></div><p className="preview-note">Buyers contact you directly to arrange payment and pickup. Your phone number and account email will be public.</p><div className="dialog-actions preview-actions"><button type="button" className="btn btn-outline" disabled={busy} onClick={()=>{setReview(null);setError('');}}>Back to editing</button><button type="button" className="btn btn-primary" disabled={busy} onClick={()=>void publish()}>{busy?<><LoaderCircle size={18} className="spin"/>Saving...</>:<>{product?'Save changes':'Publish listing'}<ArrowRight size={18}/></>}</button></div></Dialog>}
 </form>;
}
