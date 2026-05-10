
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

async function updateStatus() {
  loadEnvFile();
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is missing");

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const productsCollection = db.collection("products");

  const domain = "bd-dukan.com";

  console.log("Updating product statuses for", domain, "...");

  // Reset all first
  await productsCollection.updateMany({ domain }, { $set: { isFeatured: false, isNewArrival: false, isFlashSale: false } });

  // 1. Mark Featured (10 items)
  const featuredSlugs = [
    "sundarban-wild-forest-honey", "authentic-lakadong-turmeric-powder", "pure-shilajit-resin-premium",
    "premium-walnuts-inshell", "organic-moringa-leaf-powder", "natural-litchi-flower-honey",
    "cold-pressed-mustard-oil-pure", "organic-saffron-kashmiri-premium", "pink-himalayan-salt-fine",
    "ajwa-dates-premium-saudi"
  ];
  await productsCollection.updateMany({ domain, slug: { $in: featuredSlugs } }, { $set: { isFeatured: true } });

  // 2. Mark New Arrival (10 items)
  const newArrivalSlugs = [
    "extra-virgin-coconut-oil-cold-pressed", "aromatic-basmati-rice-organic", "organic-chia-seeds-premium",
    "natural-apple-ceder-vinegar", "premium-cashew-nuts-roasted", "wild-multifloral-honey",
    "organic-spirulina-powder", "raw-pumpkin-seeds-premium", "hibiscus-tea-premium",
    "organic-barley-powder-talbina"
  ];
  await productsCollection.updateMany({ domain, slug: { $in: newArrivalSlugs } }, { $set: { isNewArrival: true } });

  // 3. Mark Flash Sale (10 items) & Set Sale Price (roughly 15-20% discount)
  const flashSaleItems = [
    { slug: "black-seed-honey-premium", salePrice: 1150 }, // 1450
    { slug: "premium-medjool-dates-large", salePrice: 1750 }, // 2250
    { slug: "organic-green-tea-leaves", salePrice: 420 }, // 550
    { slug: "premium-almonds-california", salePrice: 850 }, // 1050
    { slug: "pure-desi-ghee-cow", salePrice: 1250 }, // 1550
    { slug: "organic-quinoa-tri-color", salePrice: 650 }, // 850
    { slug: "natural-aloevera-juice", salePrice: 350 }, // 450
    { slug: "premium-pistachios-roasted", salePrice: 1450 }, // 1850
    { slug: "organic-flax-seeds-golden", salePrice: 280 }, // 350
    { slug: "pure-eucalyptus-oil", salePrice: 550 } // 750
  ];

  for (const item of flashSaleItems) {
    await productsCollection.updateOne(
      { domain, slug: item.slug },
      { $set: { isFlashSale: true, salePrice: item.salePrice } }
    );
  }

  console.log("Successfully updated 10 products per section.");
  await mongoose.disconnect();
}

updateStatus().catch(console.error);
