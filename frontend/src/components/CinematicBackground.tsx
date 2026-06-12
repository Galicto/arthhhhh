import React, { lazy, Suspense, useEffect, useRef } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

interface CinematicBackgroundProps {
  onSplineClick?: () => void;
}

/**
 * CinematicBackground — Spline 3D scene embed
 * Loads the Metal Crypto Credit Card animation as the login hero background.
 * Triggers onSplineClick when the user clicks the 3D 'ConnectWalletBtn' inside Spline.
 */
const CinematicBackground: React.FC<CinematicBackgroundProps> = ({ onSplineClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Aggressively remove the Spline watermark after the scene loads
  useEffect(() => {
    const removeWatermark = () => {
      if (!containerRef.current) return;

      // Target all links to spline.design anywhere in the container
      const links = containerRef.current.querySelectorAll('a[href*="spline"]');
      links.forEach((el) => {
        (el as HTMLElement).style.display = 'none';
        el.remove();
      });

      // Also scan for the watermark logo by checking for <a> tags near the canvas
      const allAnchors = containerRef.current.querySelectorAll('a');
      allAnchors.forEach((a) => {
        const text = a.textContent || '';
        if (text.includes('Spline') || text.includes('Built with')) {
          a.style.display = 'none';
          a.remove();
        }
      });

      // Check for any img with Spline logo
      const allImgs = containerRef.current.querySelectorAll('img');
      allImgs.forEach((img) => {
        const src = img.src || '';
        if (src.includes('spline') || src.includes('logo')) {
          const parent = img.closest('a') || img.parentElement;
          if (parent) {
            (parent as HTMLElement).style.display = 'none';
            parent.remove();
          }
        }
      });
    };

    // Run immediately and keep checking with a MutationObserver
    // because Spline injects the watermark asynchronously after canvas loads
    const observer = new MutationObserver(() => {
      removeWatermark();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    // Also run on intervals for the first few seconds to catch late injections
    const intervals = [500, 1000, 2000, 3000, 5000, 8000];
    const timers = intervals.map((ms) => setTimeout(removeWatermark, ms));

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="cinematic-wrapper"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'auto',
        background: 'rgb(var(--background))',
      }}
      aria-hidden="true"
    >
      <Suspense
        fallback={
          <div
            style={{
              width: '100%',
              height: '100%',
              background: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                border: '2px solid rgba(98,244,166,0.15)',
                borderTopColor: 'rgba(98,244,166,0.6)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        }
      >
        <Spline
          scene="https://prod.spline.design/UnuobDw1fM-DbsCl/scene.splinecode"
          style={{ width: '100%', height: '100%', cursor: onSplineClick ? 'pointer' : 'default' }}
          onMouseDown={(e) => {
            // Check if the clicked 3D object is the connect button
            if (e.target && e.target.name === 'ConnectWalletBtn') {
              if (onSplineClick) {
                onSplineClick();
              }
            }
          }}
        />
      </Suspense>
    </div>
  );
};

export default CinematicBackground;
