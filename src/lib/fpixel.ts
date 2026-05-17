"use client";

declare global {
  interface Window {
    fbq?: (
      action: "track" | "trackCustom",
      eventName: string,
      data?: Record<string, unknown>,
      options?: { eventID: string }
    ) => void;
    _fbq?: any;
  }
}

/**
 * Generates a unique event ID with fallback for insecure or older browsers.
 */
const generateEventId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  
  // Fallback for non-secure contexts or older browsers
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    return (([1e7] as any) + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: any) =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
  }
  
  // Last resort
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

function getCookie(name: string) {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

export const trackEvent = async (
  eventName: string,
  data: any = {},
  userData: Record<string, any> = {}
) => {
  const eventId = generateEventId();

  // 1. Browser Pixel Tracking
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    // Check if it's a standard event or custom
    const standardEvents = [
      "AddPaymentInfo", "AddToCart", "AddToWishlist", "CompleteRegistration",
      "Contact", "CustomizeProduct", "Donate", "FindLocation",
      "InitiateCheckout", "Lead", "Purchase", "Schedule",
      "Search", "StartTrial", "SubmitApplication", "Subscribe", "ViewContent"
    ];

    if (standardEvents.includes(eventName)) {
      window.fbq("track", eventName, data, { eventID: eventId });
    } else {
      window.fbq("trackCustom", eventName, data, { eventID: eventId });
    }
  }

  // 2. Server-side (CAPI) Tracking
  try {
    await fetch("/api/facebook/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventUrl: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Server",
        eventId,
        userData: {
          ...userData,
          fbp: getCookie('_fbp'),
          fbc: getCookie('_fbc'),
        },
        customData: data,
        testEventCode: process.env.NEXT_PUBLIC_FACEBOOK_TEST_EVENT_CODE,
      }),
    });
  } catch (error) {
    console.error(`[FB CAPI] Failed to track ${eventName}:`, error);
  }

  return eventId;
};

// Export fbEvent as an alias to trackEvent so existing imports work
export const fbEvent = trackEvent;
