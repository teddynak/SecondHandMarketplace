/** Move a photo without mutating the current order; index zero is always the cover. */
export function movePhoto(images:string[],from:number,to:number):string[]{
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||from>=images.length||to<0||to>=images.length||from===to)return images;
 const next=[...images];const [photo]=next.splice(from,1);next.splice(to,0,photo);return next;
}
