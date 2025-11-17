"use client";

import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

export default function ScrollReveal({
  children,
  threshold = 0.2,
  duration = 0.6,
  delay = 0,
  y = 30,
}) {
  const ref = useRef(null);
  const controls = useAnimation();
  const inView = useInView(ref, { amount: threshold, once: true });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [inView]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      transition={{ duration, delay, ease: "easeOut" }}
      variants={{
        hidden: { opacity: 0, y },
        visible: { opacity: 1, y: 0 },
      }}
    >
      {children}
    </motion.div>
  );
}
