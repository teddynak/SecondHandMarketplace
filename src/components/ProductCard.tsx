import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'lucide-react';
import type { Product } from '@/types';
import { money } from '@/lib/client';
import SaveButton from './SaveButton';
import ProductImage from './ProductImage';
export default function ProductCard({ product }: { product: Product }) {
 return <article className="product-card"><Link href={`/items/${product.id}`} className="product-photo-link" aria-label={`View ${product.title}`}>
  <ProductImage src={product.images[0]} alt={product.title} className="product-photo"/>
  <span className="photo-arrow"><ArrowUpRight size={17}/></span>
 </Link><SaveButton id={product.id} title={product.title} compact/><div className="product-card-body">
  <span className="product-category">{product.category}</span>
  <Link href={`/items/${product.id}`} className="product-title">{product.title}</Link>
  <div className="product-card-bottom"><span className="product-price">{money(product.price)}</span><span className="product-location"><MapPin size={13}/>{product.location}</span></div>
 <Link className="card-seller" href={`/sellers/${product.sellerId}`}>By {product.sellerName}</Link>
 </div></article>;
}
