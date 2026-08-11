import { useEffect, useState } from "react";

export function useWindowWidth(fallback = 1280): number {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : fallback
  );

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return width;
}
