import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

async function check() {
  loadEnvFile();
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is missing in .env.local");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri, { bufferCommands: false });
  const db = mongoose.connection.db;
  const productsCollection = db.collection("products");

  const products = await productsCollection.find({}, { projection: { name: 1, slug: 1 } }).toArray();
  console.log('Total products:', products.length);
  
  const targetSlug = 'smart-fitness-tracker-pro';
  const target = products.find(p => p.slug === targetSlug);
  
  if (target) {
    console.log('Product found:', target);
  } else {
    console.log(`Product NOT found for slug: ${targetSlug}`);
    console.log('First 5 slugs:', products.slice(0, 5).map(p => p.slug).join(', '));
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
