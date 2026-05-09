/* eslint-disable @typescript-eslint/no-explicit-any */
import { Model } from 'mongoose';

/**
 * Generates a unique slug for a Mongoose model.
 * If the slug already exists, appends a number (slug-1, slug-2, etc.) until unique.
 *
 * NOTE: This helper helps choose a candidate slug but does not eliminate the
 * TOCTOU race on its own. Callers must enforce a unique slug index on the
 * model schema and catch MongoDB duplicate-key errors (`E11000`, `error.code === 11000`)
 * when persisting documents, retrying slug generation as needed.
 */
export async function generateUniqueSlug(
  model: Model<any>,
  baseSlug: string,
  domain: string,
  excludeId?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  let exists = true;

  while (exists) {
    const query: any = { slug, domain };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const doc = await model.findOne(query).select('_id').lean();

    if (!doc) {
      exists = false;
    } else {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  return slug;
}
