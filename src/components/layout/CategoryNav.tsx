"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Category {
  _id: string;
  name: string;
  slug: string;
  parentCategory?: any;
}

export function CategoryNav() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [activeParent, setActiveParent] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCats() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.filter((c: any) => c.isActive));
        }
      } catch (e) {
        console.error('Failed to fetch categories');
      }
    }
    fetchCats();
  }, []);

  const mainCategories = categories.filter(c => !c.parentCategory);
  
  const getSubCategories = (parentId: string) => {
    return categories.filter(c => {
        const pId = c.parentCategory?._id || c.parentCategory;
        return pId === parentId;
    });
  };

  return (
    <div 
      className="relative h-full flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setActiveParent(null);
      }}
    >
      <button className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.2em] text-foreground/70 hover:text-primary transition-colors h-full px-1 group">
        Categories
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isHovered ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-[calc(100%-1px)] left-0 min-w-[220px] bg-background/98 backdrop-blur shadow-xl border rounded-b-xl overflow-visible p-2 z-[100]"
          >
            <div className="flex flex-col gap-0.5">
              {mainCategories.map((mainCat) => {
                const subs = getSubCategories(mainCat._id);
                const hasSubs = subs.length > 0;

                return (
                  <div
                    key={mainCat._id}
                    className="relative group/item"
                    onMouseEnter={() => setActiveParent(mainCat._id)}
                  >
                    <Link
                      href={`/shop?category=${mainCat.slug}`}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                        activeParent === mainCat._id 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-foreground/70 hover:bg-muted'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {mainCat.name}
                      </span>
                      {hasSubs && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </Link>

                    {/* Subcategories Flyout */}
                    <AnimatePresence>
                      {activeParent === mainCat._id && hasSubs && (
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute left-full top-[-8px] min-w-[200px] bg-background/98 backdrop-blur shadow-2xl border rounded-xl p-2 ml-1"
                        >
                          <div className="text-xs font-black text-primary/70 uppercase tracking-widest px-3 py-2 mb-1 border-b border-primary/10 bg-primary/5 rounded-t-lg">
                            {mainCat.name}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {subs.map((sub) => (
                              <Link
                                key={sub._id}
                                href={`/shop?category=${sub.slug}`}
                                className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide text-foreground/70 hover:bg-primary/5 hover:text-primary transition-all whitespace-nowrap"
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              {mainCategories.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                    <Package className="h-5 w-5 opacity-40" />
                    No categories found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
