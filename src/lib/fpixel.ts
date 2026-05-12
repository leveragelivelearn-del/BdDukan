declare global {
  interface Window {
    fbq?: (
      action: "track" | "trackCustom",
      eventName: string,
      data?: Record<string, unknown>,
      options?: { eventID: string }
    ) => void;
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

export const fbEvent = (
  eventName: string,
  customData: Record<string, unknown> = {},
  userData: Record<string, any> = {}
) => {
  if (typeof window === "undefined") return;

  const eventId = generateEventId();

  // 1. Browser-side tracking
  if (typeof window.fbq === "function") {
    window.fbq("track", eventName, customData, { eventID: eventId });
  }

  // 2. Server-side (CAPI) tracking
  fetch("/api/facebook/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      eventUrl: window.location.href,
      userAgent: navigator.userAgent,
      eventId,
      customData,
      userData: {
        ...userData,
        // Automatically try to get common identifiers from cookies if available
        fbp: getCookie('_fbp'),
        fbc: getCookie('_fbc'),
      }
    }),
  }).catch(() => {
    /* fail silently — browser pixel is the fallback */
  });
};

function getCookie(name: string) {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}
