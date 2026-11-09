import { CATEGORIES, CONDITIONS } from '@/types';
export function canonicalSearch(input:string) {
 const source=new URLSearchParams(input), result=new URLSearchParams();
 for(const key of ['q','location','category','condition','minPrice','maxPrice','sort']) {
  const value=source.get(key)?.trim();if(!value)continue;
  if(value.length>(key==='q'?100:80))throw new Error('Search value is too long.');
  if(key==='category'&&!CATEGORIES.includes(value as typeof CATEGORIES[number]))throw new Error('Invalid category.');
  if(key==='condition'&&!CONDITIONS.includes(value as typeof CONDITIONS[number]))throw new Error('Invalid condition.');
  if(key==='sort'&&!['newest','price-low','price-high'].includes(value))throw new Error('Invalid sorting option.');
  if(key==='minPrice'||key==='maxPrice'){const n=Number(value);if(!Number.isFinite(n)||n<0||n>1e9)throw new Error('Invalid price.');result.set(key,String(n));}else result.set(key,value);
 }
 if(result.has('minPrice')&&result.has('maxPrice')&&Number(result.get('minPrice'))>Number(result.get('maxPrice')))throw new Error('Minimum price must not exceed maximum price.');
 return result.toString();
}
export function searchLabel(params:string) {
 const p=new URLSearchParams(params);
 return [p.get('q'),p.get('category'),p.get('location'),p.get('condition'),p.has('maxPrice')?`Up to UGX ${Number(p.get('maxPrice')).toLocaleString('en-UG')}`:'',p.has('minPrice')?`From UGX ${Number(p.get('minPrice')).toLocaleString('en-UG')}`:'',p.get('sort')==='price-low'?'Lowest price':p.get('sort')==='price-high'?'Highest price':''].filter(Boolean).join(' · ').slice(0,180)||'All recent listings';
}
