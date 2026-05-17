'use client';

import { useEffect } from 'react';
import { trackView } from '@/app/actions/view-tracking';
import { trackEvent } from '@/lib/fpixel';

interface ViewTrackerProps {
  id: string;
  type: 'product' | 'blog';
  productName?: string;
  price?: number;
}

export function ViewTracker({ id, type, productName, price }: ViewTrackerProps) {
  useEffect(() => {
    if (id) {
      trackView(id, type).catch(err => console.error(`Failed to track ${type} view:`, err));
      
      if (type === 'product') {
        trackEvent('ViewContent', {
          content_type: 'product',
          content_ids: [id],
          content_name: productName,
          value: price || 0,
          currency: 'BDT'
        });
      }
    }
  }, [id, type, productName, price]);

  return null;
}
