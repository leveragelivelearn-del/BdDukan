import mongoose from 'mongoose';
import connectToDatabase from '../db';
import GlobalSettings from '../../models/GlobalSettings';
import { randomUUID } from 'node:crypto';

export async function migrateGlobalSettings() {
  try {
    await connectToDatabase();
    
    const settings = await GlobalSettings.find({});
    
    if (settings.length === 0) {
      console.log('No GlobalSettings found. Creating initial document.');
      await GlobalSettings.create({
        domain: `shop-${Date.now()}.janopriyo.shop`,
        storeId: `store-${randomUUID()}`,
        // Add other required fields with defaults if necessary
      });
      return;
    }

    const domains = new Set();
    const storeIds = new Set();

    for (const doc of settings) {
      let updated = false;

      // Ensure domain exists and is unique
      if (!doc.domain || domains.has(doc.domain)) {
        doc.domain = doc.domain && !domains.has(doc.domain) 
          ? doc.domain 
          : `shop-${randomUUID().slice(0, 8)}.janopriyo.shop`;
        updated = true;
      }
      domains.add(doc.domain);

      // Ensure storeId exists and is unique
      if (!doc.storeId || storeIds.has(doc.storeId)) {
        doc.storeId = doc.storeId && !storeIds.has(doc.storeId)
          ? doc.storeId
          : `store-${randomUUID()}`;
        updated = true;
      }
      storeIds.add(doc.storeId);

      if (updated) {
        await doc.save();
        console.log(`Updated GlobalSettings doc ${doc._id} with new unique identifiers.`);
      }
    }

    console.log('GlobalSettings migration completed successfully.');
  } catch (error) {
    console.error('GlobalSettings migration failed:', error);
    throw error;
  }
}
