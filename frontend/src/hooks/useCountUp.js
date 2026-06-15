import { useState, useEffect, useRef } from "react";
 
export function useCountUp(target, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0);
  const rafRef            = useRef(null);
  const startRef          = useRef(null);
 
  useEffect(() => {
    if (target === null || target === undefined || isNaN(Number(target))) return;
 
    const numTarget = Number(target);
 
    const timeout = setTimeout(() => {
      startRef.current = null;
 
      const animate = (timestamp) => {
        if (!startRef.current) startRef.current = timestamp;
        const elapsed  = timestamp - startRef.current;
        const progress = Math.min(elapsed / duration, 1);
 
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(numTarget * eased));
 
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          setValue(numTarget);
        }
      };
 
      rafRef.current = requestAnimationFrame(animate);
    }, delay);
 
    return () => {
      clearTimeout(timeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);
 
  return value;
}