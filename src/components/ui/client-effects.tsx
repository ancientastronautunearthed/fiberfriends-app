'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ClientEffects() {
  const pathname = usePathname();

  // Page transition effect
  useEffect(() => {
    document.body.classList.add('page-transitioning');
    const timeout = setTimeout(() => {
      document.body.classList.remove('page-transitioning');
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [pathname]);

  // Cursor glow and scroll animations
  useEffect(() => {
    // Only run on desktop devices with hover capability
    if (!window.matchMedia('(hover: hover)').matches) return;

    // Create cursor glow element
    const cursorGlow = document.createElement('div');
    cursorGlow.id = 'cursor-glow';
    cursorGlow.className = 'fixed w-96 h-96 pointer-events-none opacity-0 transition-opacity duration-300';
    cursorGlow.style.cssText = `
      background: radial-gradient(circle, hsl(217 100% 50% / 0.1), transparent 40%);
      transform: translate(-50%, -50%);
      filter: blur(40px);
      z-index: 9999;
      mix-blend-mode: screen;
    `;
    document.body.appendChild(cursorGlow);

    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorGlow.style.opacity = '1';
    };

    const handleMouseLeave = () => {
      cursorGlow.style.opacity = '0';
    };

    // Smooth cursor follow animation
    const animateCursor = () => {
      glowX += (mouseX - glowX) * 0.1;
      glowY += (mouseY - glowY) * 0.1;
      
      cursorGlow.style.left = glowX + 'px';
      cursorGlow.style.top = glowY + 'px';
      
      animationFrameId = requestAnimationFrame(animateCursor);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    animateCursor();

    // Intersection observer for scroll animations
    const animateOnScroll = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            // Optional: stop observing after animation
            animateOnScroll.unobserve(entry.target);
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    // Observe elements with animation classes
    const observeElements = () => {
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        animateOnScroll.observe(el);
      });
    };

    // Initial observation
    observeElements();

    // Re-observe on DOM changes (for dynamically added content)
    const mutationObserver = new MutationObserver(() => {
      observeElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
      cursorGlow.remove();
      animateOnScroll.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  // Add interactive hover effects to buttons and cards
  useEffect(() => {
    const addRippleEffect = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLElement;
      if (!target.classList.contains('btn-ripple')) return;

      const ripple = document.createElement('span');
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: hsl(217 100% 50% / 0.3);
        transform: translate(${x}px, ${y}px) scale(0);
        animation: ripple-effect 0.6s ease-out;
        pointer-events: none;
      `;

      target.style.position = 'relative';
      target.style.overflow = 'hidden';
      target.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    };

    // Add ripple effect to all buttons
    const buttons = document.querySelectorAll('button, .btn-ripple');
    buttons.forEach(button => {
      button.addEventListener('click', addRippleEffect as any);
    });

    return () => {
      buttons.forEach(button => {
        button.removeEventListener('click', addRippleEffect as any);
      });
    };
  }, [pathname]); // Re-run when route changes

  return (
    <style jsx global>{`
      /* Page transition styles */
      .page-transitioning * {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      
      /* Animate on scroll base */
      .animate-on-scroll {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .animate-on-scroll.animate-in {
        opacity: 1;
        transform: translateY(0);
      }
      
      /* Stagger animations for lists */
      .animate-on-scroll:nth-child(1) { transition-delay: 0ms; }
      .animate-on-scroll:nth-child(2) { transition-delay: 50ms; }
      .animate-on-scroll:nth-child(3) { transition-delay: 100ms; }
      .animate-on-scroll:nth-child(4) { transition-delay: 150ms; }
      .animate-on-scroll:nth-child(5) { transition-delay: 200ms; }
      .animate-on-scroll:nth-child(6) { transition-delay: 250ms; }
      .animate-on-scroll:nth-child(7) { transition-delay: 300ms; }
      .animate-on-scroll:nth-child(8) { transition-delay: 350ms; }
      
      /* Ripple effect animation */
      @keyframes ripple-effect {
        to {
          transform: translate(var(--x), var(--y)) scale(4);
          opacity: 0;
        }
      }
      
      /* Enhanced focus styles */
      *:focus-visible {
        outline: 2px solid hsl(217 100% 50%);
        outline-offset: 2px;
        border-radius: 4px;
      }
      
      /* Smooth scrolling for the entire page */
      html {
        scroll-behavior: smooth;
        overflow-y: scroll;
      }
      
      /* Performance optimizations */
      #cursor-glow,
      .fiber-bg::before,
      .gradient-bg,
      [class*="animate-"] {
        will-change: transform, opacity;
      }
      
      /* Disable animations for users who prefer reduced motion */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
        
        #cursor-glow {
          display: none;
        }
      }
    `}</style>
  );
}