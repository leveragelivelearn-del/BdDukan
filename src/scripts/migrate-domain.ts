import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';
import connectToDatabase from '../lib/db';
import Product from '../models/Product';
import User from '../models/User';
import Order from '../models/Order';
import Blog from '../models/Blog';
import Category from '../models/Category';
import Coupon from '../models/Coupon';
import FAQ from '../models/FAQ';
import Banner from '../models/Banner';
import Expense from '../models/Expense';
import Review from '../models/Review';
import WalletTransaction from '../models/WalletTransaction';
import GlobalSettings from '../models/GlobalSettings';

async function migrate() {
  try {
    console.log('--- Starting Domain Migration ---');
    await connectToDatabase();
    console.log('Connected to database.');

    const defaultDomain = 'mibd.shop';
    const filter = { 
      $or: [
        { domain: { $exists: false } },
        { domain: 'unknown' },
        { domain: null },
        { domain: '' }
      ] 
    };
    const update = { $set: { domain: defaultDomain } };

    const models = [
      { name: 'Product', model: Product },
      { name: 'User', model: User },
      { name: 'Order', model: Order },
      { name: 'Blog', model: Blog },
      { name: 'Category', model: Category },
      { name: 'Coupon', model: Coupon },
      { name: 'FAQ', model: FAQ },
      { name: 'Banner', model: Banner },
      { name: 'Expense', model: Expense },
      { name: 'Review', model: Review },
      { name: 'WalletTransaction', model: WalletTransaction },
      { name: 'GlobalSettings', model: GlobalSettings }
    ];

    for (const m of models) {
      console.log(`Migrating ${m.name}...`);
      const result = await (m.model as any).updateMany(filter, update);
      console.log(`${m.name}: ${result.modifiedCount} documents updated.`);
    }

    console.log('--- Migration Completed Successfully ---');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
