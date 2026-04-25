(() => {
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const allowMotion = !motionQuery.matches;
  const root = document.documentElement;
  const revealItems = Array.from(document.querySelectorAll('[data-ss-reveal]'));

  const showAllRevealItems = () => {
    revealItems.forEach((item) => {
      item.classList.remove('ss-await');
      item.classList.add('is-visible');
    });
  };

  if (allowMotion) {
    root.classList.add('ss-motion-ready');
    const viewportHeight = window.innerHeight || 1;

    revealItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const shouldWait = rect.top > viewportHeight * 0.92;

      if (shouldWait) {
        item.classList.add('ss-await');
      } else {
        item.classList.add('is-visible');
      }
    });
  } else {
    showAllRevealItems();
  }

  if (allowMotion && revealItems.length && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove('ss-await');
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.16,
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    showAllRevealItems();
  }

  const parallaxItems = Array.from(document.querySelectorAll('[data-ss-parallax]'));

  if (!allowMotion || !parallaxItems.length) {
    return;
  }

  let ticking = false;

  const updateParallax = () => {
    const viewportHeight = window.innerHeight || 1;

    parallaxItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
      const clamped = Math.min(Math.max(progress, 0), 1);
      const translateY = (0.5 - clamped) * 34;
      const rotateX = (0.5 - clamped) * 10;
      const rotateY = (clamped - 0.5) * 14;

      item.style.transform =
        `translate3d(0, ${translateY.toFixed(2)}px, 0) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    });

    ticking = false;
  };

  const requestParallaxFrame = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateParallax);
  };

  requestParallaxFrame();
  window.addEventListener('scroll', requestParallaxFrame, { passive: true });
  window.addEventListener('resize', requestParallaxFrame);

  if (typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', (event) => {
      if (!event.matches) return;

      root.classList.remove('ss-motion-ready');
      showAllRevealItems();
      parallaxItems.forEach((item) => {
        item.style.transform = 'none';
      });
    });
  }
})();
