import mongoose from 'mongoose';

/**
 * Generates a unique slug by checking the database.
 * If the slug exists, it appends a counter.
 * Supports multi-tenant (domain) scoping.
 */
export async function generateUniqueSlug(
  Model: any, 
  baseSlug: string, 
  domainOrId?: string, 
  idToExclude?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  let domain: string | undefined;
  let excludeId: string | undefined;
  
  if (domainOrId) {
    if (mongoose.Types.ObjectId.isValid(domainOrId)) {
      excludeId = domainOrId;
    } else {
      domain = domainOrId;
    }
  }
  
  if (idToExclude) {
    excludeId = idToExclude;
  }

  while (true) {
    const query: any = { slug };
    if (domain) query.domain = domain;
    if (excludeId) query._id = { $ne: excludeId };
    
    const existing = await Model.findOne(query);
    if (!existing) return slug;
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
