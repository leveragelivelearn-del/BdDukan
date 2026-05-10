
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

const NEW_DATA = [
  { title: "Experience the Purity of Nature" },
  { title: "100% Organic & Farm Fresh" },
  { title: "Healthy Living Starts Here" },
  { title: "Premium Quality Organic Spices" },
  { title: "Natural Solutions for Wellness" }
];

async function update() {
  loadEnvFile();
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is missing");

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const bannersCollection = db.collection("banners");

  const domain = "bd-dukan.com";
  const banners = await bannersCollection.find({ domain }).sort({ createdAt: 1 }).toArray();

  console.log(`Found ${banners.length} banners for ${domain}. Updating...`);

  for (let i = 0; i < banners.length; i++) {
    const banner = banners[i];
    const data = NEW_DATA[i] || NEW_DATA[NEW_DATA.length - 1]; // Fallback to last if more than 5

    await bannersCollection.updateOne(
      { _id: banner._id },
      { 
        $set: { 
          title: data.title,
          primaryBtnText: "Shop Now",
          primaryBtnLink: "/shop",
          secondaryBtnText: "Contact Us",
          secondaryBtnLink: "https://wa.me/8801316082471",
          updatedAt: new Date()
        } 
      }
    );
    console.log(`Updated banner ${i+1}: ${data.title}`);
  }

  console.log("Successfully updated all banners.");
  await mongoose.disconnect();
}

update().catch(console.error);
