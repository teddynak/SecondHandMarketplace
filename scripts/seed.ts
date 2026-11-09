import { config } from 'dotenv';
import { createHash } from 'node:crypto';
import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User';
import Product from '../src/models/Product';
import ImageAsset from '../src/models/ImageAsset';
config({ path: '.env.local' });
config();

const accounts = [
 { key:'amina', name:'Amina (demo seller)', email:'demo.amina@example.test', role:'seller', location:'Ntinda, Kampala' },
 { key:'daniel', name:'Daniel (demo seller)', email:'demo.daniel@example.test', role:'seller', location:'Wandegeya, Kampala' },
 { key:'sarah', name:'Sarah (demo seller)', email:'demo.sarah@example.test', role:'seller', location:'Entebbe' },
 { key:'buyer', name:'Alex (demo buyer)', email:'demo.buyer@example.test', role:'buyer', location:'Makerere, Kampala' },
] as const;
// Stable, operator-owned demo records. Re-running never deletes real user data.
const id = (key:string) => new Types.ObjectId(createHash('sha256').update(`reuse-prototype-v1:${key}`).digest('hex').slice(0,24));
const catalog = [
 {key:'desk',title:'Compact study desk',category:'Furniture',condition:'Good',price:95000,seller:1,photo:'1497215728101-856f4ea42174',description:'A compact wooden desk for a student room or home office. Light surface marks; all legs are firm. Collection in Wandegeya.'},
 {key:'chair',title:'Wooden kitchen stool',category:'Furniture',condition:'Like new',price:45000,seller:2,photo:'1503602642458-232111445657',description:'A simple wooden stool for your kitchen or workspace. Clean, steady and easy to move. Available for viewing in Entebbe.'},
 {key:'jacket',title:'Everyday denim jacket — medium',category:'Clothing',condition:'Good',price:35000,seller:0,photo:'1543076447-215ad9ba6923',description:'Blue denim jacket in medium. Freshly washed with no tears. Please check the fit and condition when meeting.'},
 {key:'shoes',title:'Casual trainers — size 42',category:'Clothing',condition:'Good',price:55000,seller:0,photo:'1542291026-7eec264c27ff',description:'Comfortable casual trainers, size 42. Some wear on the soles; suitable for daily use. Ask for measurements before collection.'},
 {key:'books',title:'Weekend reading bundle — 5 books',category:'Books',condition:'Good',price:30000,seller:1,photo:'1507842217343-583bb7270b66',description:'Five assorted books for your next reading weekend. All pages present with a few notes in the margins. Sold as a bundle.'},
 {key:'headphones',title:'Over-ear headphones',category:'Electronics',condition:'Like new',price:85000,seller:1,photo:'1505740420928-5e560c06d30e',description:'Comfortable over-ear headphones for studying and music. Working audio in both ears. Test before paying; charging cable included.'},
 {key:'backpack',title:'Campus backpack',category:'Other',condition:'Good',price:40000,seller:2,photo:'1553062407-98eeb64c6a62',description:'A practical backpack with room for notebooks and a small laptop. All zips work. Clean inside, with light signs of use.'},
 {key:'lamp',title:'Bedside reading lamp',category:'Home & Living',condition:'Good',price:38000,seller:0,photo:'1507473885765-e6ed057f782c',description:'A compact reading lamp for your bedside table or study corner. Working switch and plug. Please test on collection.'},
 {key:'camera',title:'Starter photography camera',category:'Electronics',condition:'Good',price:420000,seller:2,photo:'1516035069371-29a1b244cc32',description:'An entry-level camera for a photography hobby. Includes a strap and battery. View and test the camera before agreeing on payment.'},
 {key:'plant',title:'Indoor plant with ceramic pot',category:'Home & Living',condition:'Like new',price:25000,seller:0,photo:'1485955900006-10f4d324d411',description:'A small indoor plant in a ceramic pot, ideal for a bright room. Local pickup only so the leaves and pot arrive safely.'},
 {key:'bicycle',title:'City bicycle for short rides',category:'Sports',condition:'Fair',price:180000,seller:1,photo:'1485965120184-e220f721d03e',description:'A used bicycle for short trips. Brakes work; tyres may need servicing. Take a test ride and inspect it before buying.'},
 {key:'guitar',title:'Acoustic guitar for a beginner',category:'Other',condition:'Good',price:160000,seller:2,photo:'1510915361894-db8b60106cb1',description:'An acoustic guitar for learning at home. Light cosmetic marks. Strings may need replacing; inspect and try it before payment.'},
 {key:'sold-books',title:'Sold demo: student reading collection',category:'Books',condition:'Good',price:50000,seller:1,photo:'1507842217343-583bb7270b66',description:'A completed demo sale, included to demonstrate dashboard history and received-payment status.',sold:true},
] as const;

async function main() {
 const uri=process.env.MONGODB_URI;
 const password=process.env.SEED_PASSWORD || process.env.ADMIN_PASSWORD;
 if(!uri || uri.includes('USERNAME:PASSWORD'))throw new Error('Set MONGODB_URI in .env.local before seeding.');
 if(!password || password.startsWith('REPLACE_') || password.length<8 || Buffer.byteLength(password)>72)throw new Error('Set SEED_PASSWORD or ADMIN_PASSWORD to a private password of 8+ characters (maximum 72 UTF-8 bytes).');
 await mongoose.connect(uri,{serverSelectionTimeoutMS:10000});
 try {
  // Refuse to adopt or change an existing account with a matching email.
  for(const account of accounts) {
   const existing=await User.findOne({email:account.email});
   if(existing && String(existing._id)!==String(id(`user:${account.key}`)))throw new Error(`An unrelated account already uses ${account.email}. No seed accounts were changed.`);
  }
  const passwordHash=await bcrypt.hash(password,12);
  for(const [index,account] of accounts.entries()) {
   await User.updateOne({_id:id(`user:${account.key}`)},{$setOnInsert:{name:account.name,email:account.email,role:account.role,phone:`+256 000 000 00${index+1}`,location:account.location,passwordHash}},{upsert:true});
  }
  let stored=0; let linked=0;
  for(const [index,item] of catalog.entries()) {
   const account=accounts[item.seller];
   const imageUrl=`https://images.unsplash.com/photo-${item.photo}?auto=format&fit=crop&w=960&q=80`;
   let photo=imageUrl;
   if(process.argv.includes('--store-images')) {
    const imageId=id(`image:${item.key}`);
    let image=await ImageAsset.findById(imageId).select('_id');
    if(!image) {
     try {
      // Only this fixed catalog is downloaded. User-supplied links are never fetched here.
      const response=await fetch(imageUrl,{signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const contentType=response.headers.get('content-type')?.split(';')[0];
      if(!contentType || !['image/jpeg','image/png','image/webp'].includes(contentType))throw new Error('Unsupported image type');
      const reader=response.body?.getReader();if(!reader)throw new Error('Empty image body');
      const chunks:Uint8Array[]=[];let length=0;
      while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>2*1024*1024){await reader.cancel();throw new Error('Image exceeds 2 MB');}chunks.push(value);}
      if(length<100)throw new Error('Image is too small');
      image=await ImageAsset.create({_id:imageId,ownerId:id(`user:${account.key}`),contentType,data:Buffer.concat(chunks)});
     }catch(error){console.warn(`Could not store ${item.key} photo; using its external link: ${(error as Error).message}`);}
    }
    if(image){photo=`/api/images/${imageId}`;stored++;}else linked++;
   }else linked++;
   const sold='sold' in item && item.sold;
   await Product.updateOne({_id:id(`product:${item.key}`)},{$setOnInsert:{title:item.title,description:`Prototype demo listing. ${item.description}`,category:item.category,condition:item.condition,price:item.price,location:account.location,sellerId:id(`user:${account.key}`),sellerName:account.name,sellerEmail:account.email,sellerPhone:`+256 000 000 00${item.seller+1}`,images:[photo],status:sold?'sold':'available',paymentStatus:sold?'paid':'unpaid',createdAt:new Date(Date.now()-index*86400000)}},{upsert:true});
   // Upgrade unchanged demo links to stored photos; preserve edits and custom photos.
   if(photo!==imageUrl)await Product.updateOne({_id:id(`product:${item.key}`),images:[imageUrl]},{$set:{images:[photo]}});
  }
  console.log(`Demo data ready: ${accounts.length} accounts and ${catalog.length} listings (12 available, 1 sold on first run).`);
  console.log(`Catalog photo sources: ${stored} stored in MongoDB, ${linked} external links.`);
  console.log('Re-running preserves existing accounts, passwords and listing edits. No records are deleted.');
  console.log('Demo logins (use SEED_PASSWORD, or ADMIN_PASSWORD if no seed password was set, on first creation):');
  for(const account of accounts)console.log(`  ${account.role}: ${account.email}`);
  console.log('Names, phone numbers and listings are fictional prototype data.');
 }finally{await mongoose.disconnect();}
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Seed failed.');process.exitCode=1;});
