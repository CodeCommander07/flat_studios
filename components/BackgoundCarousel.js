'use client';
import { useEffect, useState } from 'react';

export default function BackgroundSlideshow({
  images = [],
  interval = 5000,          // Time each image stays on screen
  transitionDuration = 1200 // Duration of the slide animation
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!images.length) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className="absolute inset-0 overflow-hidden h-full w-full">
      {images.map((src, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-[${transitionDuration}ms] ease-in-out`}
          style={{
            transform: `translateX(${(index - current) * 100}%)`,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transitionTimingFunction: 'ease-in-out',
          }}
        ></div>
      ))}
    </div>
  );
}
