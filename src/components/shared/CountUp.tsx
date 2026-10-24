"use client";

import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

interface CountUpProps {
  to: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
}

export function CountUp({ to, decimals = 0, suffix = "", duration = 1.4 }: CountUpProps) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(to);

  useEffect(() => {
    if (reduce) {
      setValue(to);
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: "easeOut",
      onUpdate: setValue,
    });
    return () => controls.stop();
  }, [reduce, to, duration]);

  return (
    <span className="tabular-nums">
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
