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

  const tiltItems = Array.from(document.querySelectorAll('[data-ss-tilt]'));
  const zoomItems = Array.from(
    document.querySelectorAll('.ss-product-ritual-card__media, .template-product .product__media')
  );
  const addToCartForms = Array.from(document.querySelectorAll('[data-ss-add-to-cart]'));
  const buyNowForms = Array.from(document.querySelectorAll('[data-ss-buy-now]'));

  const submitCartRequest = async (form) => {
    const endpoint = form.action.endsWith('.js') ? form.action : `${form.action}.js`;

    const response = await fetch(endpoint, {
      method: 'POST',
      body: new FormData(form),
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!response.ok) {
      throw new Error('Cart request failed');
    }

    return response.json().catch(() => null);
  };

  if (addToCartForms.length && window.fetch && window.FormData) {
    addToCartForms.forEach((form) => {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const button = form.querySelector('[data-ss-add-label]');
        const status = form.querySelector('[data-ss-cart-status]');
        const originalLabel = button ? button.textContent : '';

        if (button) {
          button.disabled = true;
          button.textContent = 'Adding...';
        }
        if (status) {
          status.textContent = '';
        }

        try {
          await submitCartRequest(form);

          if (button) {
            button.textContent = 'Added';
          }
          if (status) {
            status.innerHTML = 'Added to cart. <a href="/cart">View cart</a>';
          }

          window.setTimeout(() => {
            if (button) {
              button.disabled = false;
              button.textContent = originalLabel;
            }
          }, 1600);
        } catch (error) {
          if (button) {
            button.disabled = false;
            button.textContent = originalLabel || 'Add to cart';
          }
          if (status) {
            status.textContent = 'Could not add this item. Please try again.';
          }
        }
      });
    });
  }

  if (buyNowForms.length && window.fetch && window.FormData) {
    buyNowForms.forEach((form) => {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const button = form.querySelector('[data-ss-buy-now-label]');
        const originalLabel = button ? button.textContent : '';

        if (button) {
          button.disabled = true;
          button.textContent = 'Redirecting...';
        }

        try {
          await submitCartRequest(form);
          window.location.href = '/checkout';
        } catch (error) {
          if (button) {
            button.disabled = false;
            button.textContent = originalLabel || 'Buy now';
          }
        }
      });
    });
  }

  if (allowMotion && zoomItems.length && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    zoomItems.forEach((item) => {
      const image = item.querySelector('.ss-product-ritual-card__image, img');

      if (!image) return;

      item.addEventListener('pointermove', (event) => {
        const rect = item.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        image.style.transformOrigin = `${x.toFixed(1)}% ${y.toFixed(1)}%`;
      });

      item.addEventListener('pointerleave', () => {
        image.style.transformOrigin = '50% 50%';
      });
    });
  }

  if (allowMotion && tiltItems.length && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    tiltItems.forEach((item) => {
      item.addEventListener('pointermove', (event) => {
        const rect = item.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        item.style.setProperty('--ss-tilt-x', `${(-y * 7).toFixed(2)}deg`);
        item.style.setProperty('--ss-tilt-y', `${(x * 8).toFixed(2)}deg`);
      });

      item.addEventListener('pointerleave', () => {
        item.style.setProperty('--ss-tilt-x', '0deg');
        item.style.setProperty('--ss-tilt-y', '0deg');
      });
    });
  }

  const parallaxItems = Array.from(document.querySelectorAll('[data-ss-parallax]'));

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

  if (allowMotion && parallaxItems.length) {
    requestParallaxFrame();
    window.addEventListener('scroll', requestParallaxFrame, { passive: true });
    window.addEventListener('resize', requestParallaxFrame);
  }

  if (typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', (event) => {
      if (!event.matches) return;

      root.classList.remove('ss-motion-ready');
      showAllRevealItems();
      parallaxItems.forEach((item) => {
        item.style.transform = 'none';
      });
      tiltItems.forEach((item) => {
        item.style.setProperty('--ss-tilt-x', '0deg');
        item.style.setProperty('--ss-tilt-y', '0deg');
      });
    });
  }
})();
