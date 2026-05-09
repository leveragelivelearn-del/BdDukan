'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { hydrateCart, setHydrated } from '@/store/slices/cartSlice';
import { useSession, signOut } from 'next-auth/react';

export function CartHydrator({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { status } = useSession();
  const cart = useAppSelector((state) => state.cart);
  
  const authSyncAttempted = useRef(false);
  const dbSyncReady = useRef(false);
  const isSyncingRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestCartItemsRef = useRef(cart.items);

  // Keep latest items ref in sync
  useEffect(() => {
    latestCartItemsRef.current = cart.items;
  }, [cart.items]);

  // 1. Initial LocalStorage Hydration
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (parsedCart && Array.isArray(parsedCart.items)) {
          dispatch(hydrateCart({
            ...parsedCart,
            isHydrated: true
          }));
        } else {
          dispatch(setHydrated());
        }
      } else {
        dispatch(setHydrated());
      }
    } catch (error) {
      console.error('Failed to hydrate cart:', error);
      dispatch(setHydrated());
    }
  }, [dispatch]);

  // 2. Auth Sync with Database (Merge Local & DB on Login)
  useEffect(() => {
    if (status === 'authenticated' && cart.isHydrated && !authSyncAttempted.current && !isSyncingRef.current) {
      const syncCart = async () => {
        isSyncingRef.current = true;
        try {
          // Fetch cart from DB
          const res = await fetch('/api/cart');
          if (res.ok) {
            const dbCartItems = await res.json();
            const currentLocalItems = latestCartItemsRef.current;
            
            // Merge logic: Combine local items and DB items using variant-aware keys.
            const mergedMap = new Map();
            
            const getVariantKey = (item: any) => {
                const othersStr = item.others 
                  ? JSON.stringify(Object.keys(item.others).sort().reduce((obj: any, key) => {
                      obj[key] = item.others[key];
                      return obj;
                    }, {}))
                  : '';
                return `${item.productId}-${item.color || ''}-${item.size || ''}-${othersStr}`;
            };

            // Add DB items
            if (Array.isArray(dbCartItems)) {
                dbCartItems.forEach((item: any) => {
                    const key = getVariantKey(item);
                    mergedMap.set(key, item);
                });
            }
            
            // Add Local items (merge quantities if same variant)
            currentLocalItems.forEach((item) => {
                const key = getVariantKey(item);
                if (mergedMap.has(key)) {
                    const existing = mergedMap.get(key);
                    mergedMap.set(key, { ...existing, quantity: Math.max(existing.quantity, item.quantity) });
                } else {
                    mergedMap.set(key, item);
                }
            });

            const mergedItems = Array.from(mergedMap.values());
            
            // Recalculate totals
            let totalQty = 0;
            let totalAmt = 0;
            mergedItems.forEach(item => {
                totalQty += item.quantity;
                totalAmt += item.price * item.quantity;
            });
            totalAmt = Math.round(totalAmt * 100) / 100;

            const finalCartState = {
                items: mergedItems,
                totalQuantity: totalQty,
                totalAmount: totalAmt,
            };

            // Sync merged result back to DB
            const syncRes = await fetch('/api/cart/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartItems: mergedItems })
            });

            if (syncRes.ok) {
                authSyncAttempted.current = true;
                // Dispatch to Redux only after successful DB sync to ensure consistency
                dispatch(hydrateCart({
                    ...finalCartState,
                    isHydrated: true
                }));
                dbSyncReady.current = true;
            } else {
                console.error('Failed to sync merged cart to database:', syncRes.status);
                if (syncRes.status === 401 || syncRes.status === 403) {
                    signOut({ callbackUrl: '/login' });
                    return;
                }
                // Recovery: mark as attempted to prevent loops, but allow normal ops
                authSyncAttempted.current = true;
                dbSyncReady.current = true;
            }
          } else if (res.status === 401 || res.status === 403) {
              signOut({ callbackUrl: '/login' });
              return;
          } else {
              console.error(`Cart fetch failed: ${res.status} ${res.statusText}`);
              authSyncAttempted.current = true;
              dbSyncReady.current = true;
          }
        } catch (error) {
          console.error('Failed to sync cart with server:', error);
          authSyncAttempted.current = true;
          dbSyncReady.current = true;
        } finally {
            isSyncingRef.current = false;
        }
      };

      syncCart();
    }
  }, [status, cart.isHydrated, dispatch]);

  // 3. Continuous DB Sync (Debounced when cart changes while logged in)
  useEffect(() => {
      if (status === 'authenticated' && dbSyncReady.current && cart.isHydrated) {
          if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
          
          syncTimeoutRef.current = setTimeout(async () => {
              try {
                  const res = await fetch('/api/cart/sync', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ cartItems: cart.items })
                  });
                  if (!res.ok) {
                      console.error('Debounced cart sync failed:', res.status);
                      if (res.status === 401 || res.status === 403) {
                          signOut({ callbackUrl: '/login' });
                          return;
                      }
                  }
              } catch (e) {
                  console.error('Failed debounced cart sync', e);
              }
          }, 1000); // 1 second debounce
      }
      
      return () => {
          if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      }
  }, [cart.items, status, cart.isHydrated]);

  return <>{children}</>;
}
