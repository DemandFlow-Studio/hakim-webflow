// parallax-webflow.js - Version for CDN hosting
(function() { 
  'use strict';
  
  const CONFIG = {
    attribute: 'data-parallax',
    defaultSpeed: 2,
    defaultHeight: 130,
    mobileBreakpoint: 768,
    observeDOM: true // Watch for dynamically added images
  };
  
  let instances = [];
  
  function initParallax() {
    // Find all elements with data-parallax attribute
    const parallaxElements = document.querySelectorAll(`[${CONFIG.attribute}]`);
    
    if (parallaxElements.length === 0) return;
    
    parallaxElements.forEach((img) => {
      // Skip if already initialized
      if (img.dataset.parallaxInit === 'true') return;
      
      const parent = img.parentElement;
      if (!parent) return;
      
      // Get configuration from data attributes
      const speed = parseFloat(img.dataset.parallaxSpeed) || CONFIG.defaultSpeed;
      const imageHeight = parseInt(img.dataset.parallaxHeight) || CONFIG.defaultHeight;
      const disableMobile = img.dataset.parallaxMobile === 'false';
      const disableTablet = img.dataset.parallaxTablet === 'false';
      
      // Setup parent container
      const originalPosition = window.getComputedStyle(parent).position;
      if (originalPosition === 'static') {
        parent.style.position = 'relative';
      }
      parent.style.overflow = 'hidden';
      
      // Copy border-radius and other visual properties
      const computedStyle = window.getComputedStyle(img);
      if (computedStyle.borderRadius && computedStyle.borderRadius !== '0px') {
        parent.style.borderRadius = computedStyle.borderRadius;
      }
      
      // Copy box-shadow if exists
      if (computedStyle.boxShadow && computedStyle.boxShadow !== 'none') {
        parent.style.boxShadow = computedStyle.boxShadow;
        img.style.boxShadow = 'none';
      }
      
      // Setup image
      img.style.position = 'relative';
      img.style.width = '100%';
      img.style.height = `${imageHeight}%`;
      img.style.objectFit = 'cover';
      img.style.top = `-${(imageHeight - 100) / 2}%`;
      img.style.willChange = 'transform';
      img.style.borderRadius = '0';
      
      // Mark as initialized
      img.dataset.parallaxInit = 'true';
      
      // Store instance data
      instances.push({
        img,
        parent,
        speed,
        disableMobile,
        disableTablet
      });
    });
    
    if (instances.length > 0 && !window._parallaxListenerAdded) {
      attachScrollListener();
      window._parallaxListenerAdded = true;
    }
    
    // Initial update
    updateParallax();
  }
  
  function updateParallax() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    instances.forEach(({ img, parent, speed, disableMobile, disableTablet }) => {
      // Check if should disable on current breakpoint
      if ((disableMobile && windowWidth < CONFIG.mobileBreakpoint) ||
          (disableTablet && windowWidth >= CONFIG.mobileBreakpoint && windowWidth < 992)) {
        img.style.transform = 'translate3d(0, 0, 0)';
        return;
      }
      
      const rect = parent.getBoundingClientRect();
      
      // Only calculate if in viewport (performance optimization)
      if (rect.top < windowHeight && rect.bottom > 0) {
        const scrollProgress = (windowHeight - rect.top) / (windowHeight + rect.height);
        const parallaxOffset = (scrollProgress - 0.5) * 200 * speed;
        img.style.transform = `translate3d(0, ${parallaxOffset}px, 0)`;
      }
    });
  }
  
  function attachScrollListener() {
    let ticking = false;
    
    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          updateParallax();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
    
    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateParallax, 150);
    }, { passive: true });
  }
  
  // Watch for dynamically added images (CMS, conditional visibility, etc.)
  function observeDOM() {
    if (!CONFIG.observeDOM || !window.MutationObserver) return;
    
    const observer = new MutationObserver(function(mutations) {
      let shouldReinit = false;
      
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) { // Element node
            if (node.hasAttribute(CONFIG.attribute) || 
                node.querySelector(`[${CONFIG.attribute}]`)) {
              shouldReinit = true;
            }
          }
        });
      });
      
      if (shouldReinit) {
        setTimeout(initParallax, 100);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // Initialize on various load states
  function init() {
    initParallax();
    observeDOM();
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Webflow-specific initialization
  if (window.Webflow) {
    window.Webflow.push(function() {
      setTimeout(init, 100);
    });
  }
  
  // Expose public API for manual re-initialization if needed
  window.WebflowParallax = {
    init: initParallax,
    update: updateParallax,
    version: '1.0.0'
  };
  
})();
