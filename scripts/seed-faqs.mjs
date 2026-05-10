
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

const faqs = [
  {
    question: "Are your products 100% organic?",
    answer: "Yes, all our products are sourced from certified organic farms and undergo strict quality checks to ensure they are 100% natural and free from harmful chemicals, pesticides, and synthetic fertilizers.",
    order: 1,
    isActive: true
  },
  {
    question: "How do you ensure the freshness of fruits and vegetables?",
    answer: "We follow a 'Farm-to-Table' model. Fruits and vegetables are harvested only after your order is confirmed and delivered within 24-48 hours using specialized packaging to maintain peak freshness.",
    order: 2,
    isActive: true
  },
  {
    question: "What is your return policy for food items?",
    answer: "We have a 24-hour return policy for fresh produce if there is a quality issue. For other packaged items like honey, oils, and powders, you can return them within 7 days if the seal is intact and the product is unused.",
    order: 3,
    isActive: true
  },
  {
    question: "Do you deliver outside Dhaka?",
    answer: "Yes, we deliver nationwide across Bangladesh. For fresh produce (fruits/vegetables), we currently limit delivery to Dhaka to ensure quality, but all other organic products can be shipped anywhere via our courier partners.",
    order: 4,
    isActive: true
  },
  {
    question: "How can I track my order?",
    answer: "You can track your order status in real-time from the 'Track Order' section on our website using your order ID, or directly from your account dashboard under the 'Orders' tab.",
    order: 5,
    isActive: true
  }
];

async function seed() {
  loadEnvFile();
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is missing");

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const faqsCollection = db.collection("faqs");

  const domain = "bd-dukan.com";

  console.log("Cleaning old FAQs for", domain, "...");
  await faqsCollection.deleteMany({ domain });

  console.log("Inserting new FAQs...");
  const faqsWithDomain = faqs.map(f => ({ ...f, domain }));
  await faqsCollection.insertMany(faqsWithDomain);

  console.log("Successfully seeded 5 FAQs for", domain);
  await mongoose.disconnect();
}

seed().catch(console.error);
