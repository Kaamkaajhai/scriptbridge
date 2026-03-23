/**
 * useIntersectionObserver
 *
 * A reusable hook that fires once when the target element enters the viewport.
 * Perfect for "lazy reveal" animations and deferred rendering.
 *
 * Usage:
 *   const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
 *   <div ref={ref}>{isVisible && <HeavyContent />}</div>
 */
import { useEffect, useRef, useState } from "react";

const useIntersectionObserver = ({
  threshold = 0.1,
  rootMargin = "0px 0px 80px 0px", // pre-load slightly before entering viewport
  once = true,                      // fire only once, then disconnect
} = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Fallback: if IntersectionObserver is not supported, show immediately
    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, isVisible];
};

export default useIntersectionObserver;
