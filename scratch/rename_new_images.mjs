import fs from 'fs';
import path from 'path';

const dir = 'public/seed/product';
const files = fs.readdirSync(dir);

const manualRenames = [
    { from: "18k_gold_plated_hoop_earrings_1_1777868439891.webp", to: "18k-gold-plated-hoop-earrings-1.webp" },
    { from: "anti_theft_travel_backpack_1_1777868421180.webp", to: "anti-theft-travel-backpack-1.webp" },
    { from: "chunky_gold_link_necklace_1_1777868268915.webp", to: "chunky-gold-link-necklace-1.webp" },
    { from: "continental_zip_around_wallet_1_1777868356420.webp", to: "continental-zip-around-wallet-1.webp" },
    { from: "diamond_solitaire_pendant_1_1777868456922.webp", to: "diamond-solitaire-pendant-1.webp" },
    { from: "embossed_leather_card_holder_1_1777868236162.webp", to: "emphasized-leather-card-holder-1.webp" },
    { from: "executive_leather_briefcase_1_1777868341318.webp", to: "executive-leather-briefcase-1.webp" },
    { from: "knit_wool_beanie_1_1777868252347.webp", to: "knit-wool-beanie-1.webp" },
    { from: "laptop_sleeve_14_inch_1_1777868406696.webp", to: "laptop-sleeve-14-inch-1.webp" },
    { from: "minimalist_bifold_wallet_1_1777868389651.webp", to: "minimalist-bifold-wallet-1.webp" },
    { from: "reversible_leather_belt_1_1777868285882.webp", to: "reversible-leather-belt-1.webp" },
    { from: "silk_twill_square_scarf_1_1777868203754.webp", to: "silk-twill-square-scarf-1.webp" },
    { from: "stacked_bead_bracelet_set_1_1777868473537.webp", to: "stacked-bead-bracelet-set-1.webp" },
    { from: "suede_touchscreen_gloves_1_1777868318075.webp", to: "suede-touchscreen-gloves-1.webp" },
    { from: "velvet_hair_bow_clip_1_1777868300236.webp", to: "velvet-hair-bow-clip-1.webp" },
    { from: "weekend_canvas_duffle_bag_1_1777868374302.webp", to: "weekend-canvas-duffle-bag-1.webp" },
    { from: "woven_fedora_straw_hat_1_1777868218413.webp", to: "woven-fedora-straw-hat-1.webp" }
];

manualRenames.forEach(item => {
    const oldPath = path.join(dir, item.from);
    const newPath = path.join(dir, item.to);
    if (fs.existsSync(oldPath)) {
        console.log(`Renaming ${item.from} to ${item.to}`);
        fs.renameSync(oldPath, newPath);
    } else {
        console.log(`File not found: ${item.from}`);
    }
});

// Re-generate mapping
const products = [
  { slug: "18k-gold-plated-hoop-earrings" },
  { slug: "anti-theft-travel-backpack" },
  { slug: "chunky-gold-link-necklace" },
  { slug: "continental-zip-around-wallet" },
  { slug: "diamond-solitaire-pendant" },
  { slug: "emphasized-leather-card-holder" },
  { slug: "executive-leather-briefcase" },
  { slug: "knit-wool-beanie" },
  { slug: "laptop-sleeve-14-inch" },
  { slug: "minimalist-bifold-wallet" },
  { slug: "reversible-leather-belt" },
  { slug: "silk-twill-square-scarf" },
  { slug: "stacked-bead-bracelet-set" },
  { slug: "suede-touchscreen-gloves" },
  { slug: "velvet-hair-bow-clip" },
  { slug: "weekend-canvas-duffle-bag" },
  { slug: "woven-fedora-straw-hat" },
  // Include existing slugs to ensure they are re-mapped if needed
  { slug: "signature-oxford-slim-fit-shirt" },
  { slug: "heritage-selvedge-denim-jeans" },
  { slug: "lightweight-merino-wool-sweater" },
  { slug: "technical-waterproof-parka" },
  { slug: "premium-linen-summer-blazer" },
  { slug: "essential-cotton-crewneck-tee" },
  { slug: "stretch-chino-trousers" },
  { slug: "vintage-graphic-print-hoodie" },
  { slug: "italian-leather-belt" },
  { slug: "performance-workout-shorts" },
  { slug: "floral-silk-wrap-dress" },
  { slug: "high-waisted-pleated-trousers" },
  { slug: "oversized-cashmere-cardigan" },
  { slug: "quilted-chain-crossbody-bag" },
  { slug: "performance-mesh-running-shoes" },
  { slug: "hand-poured-soy-wax-candle" },
  { slug: "sleek-metal-table-lamp" },
  { slug: "chronograph-steel-sports-watch" },
  { slug: "insulated-stainless-steel-bottle" },
  { slug: "cotton-canvas-tote-bag" },
  { slug: "minimalist-ceramic-coffee-mug" },
  { slug: "hardcover-notebook-journal" },
  { slug: "desk-lamp" },
  { slug: "desk-organizer" },
  { slug: "electric-kettle" },
  { slug: "kitchen-blender" },
  { slug: "coffee-maker-machine" },
  { slug: "wall-clock" },
  { slug: "alarm-clock" },
  { slug: "woven-decorative-throw-pillow" },
  { slug: "wireless-bluetooth-headphones" },
  { slug: "wireless-computer-mouse" },
  { slug: "wooden-cutting-board" },
  { slug: "woven-storage-basket" },
  { slug: "picture-frame" },
  { slug: "serving-tray" },
  { slug: "bookends-pair" },
  { slug: "portable-phone-charger-power-bank" },
  { slug: "polarized-aviator-sunglasses" },
  { slug: "urban-roll-top-backpack" },
  { slug: "classic-leather-chelsea-boots" },
  { slug: "sculpting-yoga-leggings" }
];

const newFiles = fs.readdirSync(dir);
const mapping = {};

newFiles.forEach(file => {
  for (const product of products) {
    if (file.toLowerCase().startsWith(product.slug.toLowerCase() + '-')) {
        if (!mapping[product.slug]) mapping[product.slug] = [];
        mapping[product.slug].push(`/seed/product/${file}`);
        break;
    }
  }
});

for (const slug in mapping) {
    mapping[slug].sort();
}

fs.writeFileSync('scratch/product_image_mapping.json', JSON.stringify(mapping, null, 2));
console.log('Mapping saved to scratch/product_image_mapping.json');
