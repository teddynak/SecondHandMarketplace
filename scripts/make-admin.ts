import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from 'dotenv';
config({ path: '.env.local' });
const email = process.env.ADMIN_EMAIL?.toLowerCase();
if (!email || !process.env.MONGODB_URI) { console.error('Set ADMIN_EMAIL and MONGODB_URI in .env.local first.'); process.exit(1); }
async function main() {
 await mongoose.connect(process.env.MONGODB_URI!);
 const result = await mongoose.connection.db!.collection('users').updateOne({ email }, { $set: { role: 'admin' } });
 console.log(result.matchedCount ? `Promoted ${email} to admin.` : `No account found for ${email}. Register it first.`);
 await mongoose.disconnect();
}
main().catch((error) => { console.error(error); process.exit(1); });
