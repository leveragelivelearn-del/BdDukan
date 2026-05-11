import mongoose from 'mongoose';
import { slugify as tSlugify } from 'transliteration';

/**
 * Generates a URL-friendly slug from a given string.
 * Supports Bengali transliteration to English.
 * 
 * @param text The string to slugify
 * @returns A URL-friendly slug string
 */
export const slugify = (text: string): string => {
  if (!text) return '';

  // Use transliteration for multi-language support (especially Bengali)
  return tSlugify(text, {
    lowercase: true,
    separator: '-',
    trim: true,
  })
  .replace(/[^\w\s-]/g, '')    // Remove non-word characters (except spaces and dashes)
  .replace(/[\s_-]+/g, '-')    // Replace spaces and underscores with a single dash
  .slice(0, 100)               // Limit length
  .replace(/^-+|-+$/g, '');    // Trim dashes from start and end
};

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
