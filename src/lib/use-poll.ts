"use client";

import { useEffect } from "react";

export function usePoll(callback: () => void, ms = 4000) {
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") callback();
    };
    const timer = window.setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [callback, ms]);
}
