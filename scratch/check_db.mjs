import mongoose from 'mongoose';
import connectToDatabase from '../src/lib/db.js';
import Product from '../src/models/Product.js';

async function checkProducts() {
  await connectToDatabase();
  const products = await Product.find({}, 'name slug').lean();
  console.log('Total products:', products.length);
  const target = products.find(p => p.slug === 'smart-fitness-tracker-pro');
  if (target) {
    console.log('Product found:', target);
  } else {
    console.log('Product NOT found. Available slugs:');
    console.log(products.map(p => p.slug).join(', '));
  }
  process.exit(0);
}

checkProducts();
