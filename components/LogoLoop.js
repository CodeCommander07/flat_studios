'use client';

import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';

// 🔧 Animation Config
const ANIMATION_CONFIG = {
  SMOOTH_TAU: 0.25,
  MIN_COPIES: 2,
  COPY_HEADROOM: 2,
};

// 🔹 Helpers
const toCssLength = (value) =>
  typeof value === 'number' ? `${value}px` : value ?? undefined;

const cx = (...classes) => classes.filter(Boolean).join(' ');

// 🔹 Resize observer hook
const useResizeObserver = (callback, elements, dependencies) => {
  useEffect(() => {
    if (!window.ResizeObserver) {
      const handleResize = () => callback();
      window.addEventListener('resize', handleResize);
      callback();
      return () => window.removeEventListener('resize', handleResize);
    }

    const observers = elements.map((ref) => {
      if (!ref.current) return null;
      const observer = new ResizeObserver(callback);
      observer.observe(ref.current);
      return observer;
    });

    callback();

    return () => observers.forEach((obs) => obs?.disconnect());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
};

// 🔹 Wait for all images to load before measuring width
const useImageLoader = (seqRef, onLoad, dependencies) => {
  useEffect(() => {
    const imgs = seqRef.current?.querySelectorAll('img') ?? [];
    if (imgs.length === 0) {
      onLoad();
      return;
    }

    let remaining = imgs.length;
    const handleLoad = () => {
      remaining -= 1;
      if (remaining === 0) onLoad();
    };

    imgs.forEach((img) => {
      if (img.complete) handleLoad();
      else {
        img.addEventListener('load', handleLoad, { once: true });
        img.addEventListener('error', handleLoad, { once: true });
      }
    });

    return () => {
      imgs.forEach((img) => {
        img.removeEventListener('load', handleLoad);
        img.removeEventListener('error', handleLoad);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
};

// 🔹 Smooth infinite animation loop
const useAnimationLoop = (trackRef, targetVelocity, seqWidth, isHovered, pauseOnHover) => {
  const rafRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (seqWidth > 0) {
      offsetRef.current = ((offsetRef.current % seqWidth) + seqWidth) % seqWidth;
      track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
    }

    if (prefersReduced) {
      track.style.transform = 'translate3d(0,0,0)';
      return () => (lastTimestampRef.current = null);
    }

    const animate = (timestamp) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }
      const delta = Math.max(0, timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      const target = pauseOnHover && isHovered ? 0 : targetVelocity;
      const easing = 1 - Math.exp(-delta / ANIMATION_CONFIG.SMOOTH_TAU);
      velocityRef.current += (target - velocityRef.current) * easing;

      if (seqWidth > 0) {
        let next = offsetRef.current + velocityRef.current * delta;
        next = ((next % seqWidth) + seqWidth) % seqWidth;
        offsetRef.current = next;
        track.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimestampRef.current = null;
    };
  }, [targetVelocity, seqWidth, isHovered, pauseOnHover, trackRef]);
};

// 🔹 Main Component
const LogoLoop = memo(
  ({
    logos,
    speed = 120,
    direction = 'left',
    width = '100%',
    logoHeight = 28,
    gap = 32,
    pauseOnHover = true,
    fadeOut = false,
    fadeOutColor,
    scaleOnHover = false,
    ariaLabel = 'Partner logos',
    className,
    style,
  }) => {
    const containerRef = useRef(null);
    const trackRef = useRef(null);
    const seqRef = useRef(null);

    const [seqWidth, setSeqWidth] = useState(0);
    const [copyCount, setCopyCount] = useState(ANIMATION_CONFIG.MIN_COPIES);
    const [isHovered, setIsHovered] = useState(false);

    const targetVelocity = useMemo(() => {
      const mag = Math.abs(speed);
      const dirMult = direction === 'left' ? 1 : -1;
      const speedMult = speed < 0 ? -1 : 1;
      return mag * dirMult * speedMult;
    }, [speed, direction]);

    const updateDimensions = useCallback(() => {
      const containerW = containerRef.current?.clientWidth ?? 0;
      const seqW = seqRef.current?.getBoundingClientRect?.()?.width ?? 0;

      if (seqW > 0) {
        setSeqWidth(Math.ceil(seqW));
        const copies = Math.ceil(containerW / seqW) + ANIMATION_CONFIG.COPY_HEADROOM;
        setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, copies));
      }
    }, []);

    useResizeObserver(updateDimensions, [containerRef, seqRef], [logos, gap, logoHeight]);
    useImageLoader(seqRef, updateDimensions, [logos, gap, logoHeight]);
    useAnimationLoop(trackRef, targetVelocity, seqWidth, isHovered, pauseOnHover);

    const cssVars = useMemo(
      () => ({
        '--logoloop-gap': `${gap}px`,
        '--logoloop-logoHeight': `${logoHeight}px`,
        ...(fadeOutColor && { '--logoloop-fadeColor': fadeOutColor }),
      }),
      [gap, logoHeight, fadeOutColor]
    );

    const handleHover = useCallback(
      (state) => pauseOnHover && setIsHovered(state),
      [pauseOnHover]
    );

    const renderLogo = useCallback(
      (item, key) => {
        const isNode = 'node' in item;
        const content = isNode ? (
          <span
            className={cx(
              'inline-flex items-center',
              scaleOnHover && 'transition-transform duration-300 group-hover/item:scale-110'
            )}
          >
            {item.node}
          </span>
        ) : (
          <img
            className={cx(
              'h-[var(--logoloop-logoHeight)] w-auto object-contain pointer-events-none',
              scaleOnHover && 'transition-transform duration-300 group-hover/item:scale-110'
            )}
            src={item.src}
            alt={item.alt ?? ''}
            title={item.title}
            loading="lazy"
            draggable={false}
          />
        );

        return (
          <li
            key={key}
            className={cx(
              'flex-none mr-[var(--logoloop-gap)]',
              scaleOnHover && 'overflow-visible group/item'
            )}
          >
            {item.href ? (
              <a href={item.href} target="_blank" rel="noreferrer noopener">
                {content}
              </a>
            ) : (
              content
            )}
          </li>
        );
      },
      [scaleOnHover]
    );

    const logoLists = useMemo(
      () =>
        Array.from({ length: copyCount }, (_, idx) => (
          <ul
            key={idx}
            ref={idx === 0 ? seqRef : undefined}
            className="flex items-center"
            aria-hidden={idx > 0}
          >
            {logos.map((logo, i) => renderLogo(logo, `${idx}-${i}`))}
          </ul>
        )),
      [copyCount, logos, renderLogo]
    );

    return (
      <div
        ref={containerRef}
        className={cx(
          'relative overflow-hidden select-none',
          scaleOnHover && 'py-[calc(var(--logoloop-logoHeight)*0.1)]',
          className
        )}
        style={{ width: toCssLength(width), ...cssVars, ...style }}
        role="region"
        aria-label={ariaLabel}
        onMouseEnter={() => handleHover(true)}
        onMouseLeave={() => handleHover(false)}
      >
        {fadeOut && (
          <>
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-[clamp(24px,8%,120px)] bg-gradient-to-r from-[var(--logoloop-fadeColor,#ffffff)] to-transparent z-10"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-[clamp(24px,8%,120px)] bg-gradient-to-l from-[var(--logoloop-fadeColor,#ffffff)] to-transparent z-10"
              aria-hidden
            />
          </>
        )}
        <div ref={trackRef} className="flex w-max will-change-transform">
          {logoLists}
        </div>
      </div>
    );
  }
);

LogoLoop.displayName = 'LogoLoop';
export default LogoLoop;
