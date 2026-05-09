"use client";

import { useEffect, useState } from "react";

export function LiveTrafficWidget() {
  const [activeUsers, setActiveUsers] = useState<number | null>(null);

  const formatActiveUsers = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "k";
    }
    return count.toString();
  };

  useEffect(() => {
    let isMounted = true;

    const fetchLiveUsers = async () => {
      try {
        const res = await fetch("/api/admin/analytics/realtime");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.activeUsersNow !== undefined) {
            setActiveUsers(data.activeUsersNow);
          }
        } else {
          const errorText = await res.text();
          console.error(`Live traffic fetch error: ${res.status} ${res.statusText}`, errorText);
        }
      } catch (error) {
        console.error("Failed to fetch live traffic:", error);
      }
    };

    fetchLiveUsers();
    // Poll every 30 seconds
    const interval = setInterval(fetchLiveUsers, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (activeUsers === null) {
    return null;
  }

  return (
    <div 
      className="fixed top-[70px] right-3 md:right-4 z-50 flex items-center justify-center min-w-[1.75rem] md:min-w-[2rem] h-7 md:h-8 px-1 rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110 cursor-help shadow-sm"
      title={`Real-time Active Users: ${activeUsers}`}
      aria-label={`${activeUsers} active users online`}
    >
      {/* Blinking dot indicator */}
      <span className="absolute -bottom-0.5 -left-0.5 flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500 border border-background"></span>
      </span>
      
      {/* Traffic Count */}
      <span className="text-[10px] md:text-xs font-black tracking-tighter">
        {formatActiveUsers(activeUsers)}
      </span>
    </div>
  );
}
