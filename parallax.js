// parallax-webflow.js - Version 2.3 with Scale-based Horizontal
(function() { 
  'use strict';
  
  const CONFIG = {
    attribute: 'data-parallax',
    defaultSpeed: 2,
    defaultHeight: 130,
    defaultHorizontalScale: 1.1, // Scale factor for horizontal
    defaultDirection: 'vertical',
    mobileBreakpoint: 768,
    observeDOM: true
  };
  
  let instances = [];
  
  function initParallax() {
    const parallaxElements = document.querySelectorAll(`[${CONFIG.attribute}]`);
    
    if (parallaxElements.length === 0) return;
    
    parallaxElements.forEach((img) => {
      // Skip if already initialized
      if (img.dataset.parallaxInit === 'true') return;
      
      // Get configuration from data attributes
      const direction = (img.dataset.parallaxDirection || CONFIG.defaultDirection).toLowerCase();
      const speed = parseFloat(img.dataset.parallaxSpeed) || CONFIG.defaultSpeed;
      const imageHeight = parseInt(img.dataset.parallaxHeight) || CONFIG.defaultHeight;
      const horizontalScale = parseFloat(img.dataset.parallaxScale) || CONFIG.defaultHorizontalScale;
      const disableMobile = img.dataset.parallaxMobile === 'false';
      const disableTablet = img.dataset.parallaxTablet === 'false';
      
      // Create wrapper div if not already wrapped
      let wrapper;
      const parent = img.parentElement;
      
      if (!parent.classList.contains('parallax-wrapper')) {
        // Create new wrapper
        wrapper = document.createElement('div');
        wrapper.className = 'parallax-wrapper';
        
        // Copy computed styles from image to wrapper
        const computedStyle = window.getComputedStyle(img);
        
        // Copy display properties
        const imgDisplay = computedStyle.display;
        if (imgDisplay === 'block') {
          wrapper.style.display = 'block';
        }
        
        // Copy dimensions if image has explicit width/height
        const imgWidth = computedStyle.width;
        const imgHeight = computedStyle.height;
        if (imgWidth && imgWidth !== 'auto') {
          wrapper.style.width = imgWidth;
        }
        if (imgHeight && imgHeight !== 'auto' && imgHeight !== '0px') {
          wrapper.style.height = imgHeight;
        }
        
        // Copy margin from image to wrapper
        wrapper.style.marginTop = computedStyle.marginTop;
        wrapper.style.marginRight = computedStyle.marginRight;
        wrapper.style.marginBottom = computedStyle.marginBottom;
        wrapper.style.marginLeft = computedStyle.marginLeft;
        
        // Copy border-radius
        if (computedStyle.borderRadius && computedStyle.borderRadius !== '0px') {
          wrapper.style.borderRadius = computedStyle.borderRadius;
        }
        
        // Copy box-shadow
        if (computedStyle.boxShadow && computedStyle.boxShadow !== 'none') {
          wrapper.style.boxShadow = computedStyle.boxShadow;
          img.style.boxShadow = 'none';
        }
        
        // Set wrapper styles for parallax
        wrapper.style.position = 'relative';
        wrapper.style.overflow = 'hidden';
        
        // Insert wrapper before image and move image inside
        parent.insertBefore(wrapper, img);
        wrapper.appendChild(img);
        
        // Clear margin from image (now on wrapper)
        img.style.margin = '0';
      } else {
        // Already wrapped
        wrapper = parent;
      }
      
      // Setup wrapper
      wrapper.style.position = 'relative';
      wrapper.style.overflow = 'hidden';
      
      // Setup image - SIMPLE approach
      img.style.display = 'block';
      img.style.objectFit = 'cover';
      img.style.willChange = 'transform';
      img.style.borderRadius = '0';
      
      // Direction-specific setup
      if (direction === 'horizontal' || direction === 'both') {
        // For horizontal, just set basic styles
        img.style.width = '100%';
        img.style.height = direction === 'both' ? `${imageHeight}%` : '100%';
        img.style.position = 'relative';
        
        // For vertical component in 'both' mode
        if (direction === 'both') {
          img.style.top = `-${(imageHeight - 100) / 2}%`;
        } else {
          img.style.top = '0';
        }
      } else {
        // Vertical parallax (default)
        img.style.position = 'relative';
        img.style.width = '100%';
        img.style.height = `${imageHeight}%`;
        img.style.top = `-${(imageHeight - 100) / 2}%`;
      }
      
      // Mark as initialized
      img.dataset.parallaxInit = 'true';
      
      // Store instance data
      instances.push({
        img,
        wrapper,
        direction,
        speed,
        imageHeight,
        horizontalScale,
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
    
    instances.forEach(({ img, wrapper, direction, speed, imageHeight, horizontalScale, disableMobile, disableTablet }) => {
      // Check if should disable on current breakpoint
      if ((disableMobile && windowWidth < CONFIG.mobileBreakpoint) ||
          (disableTablet && windowWidth >= CONFIG.mobileBreakpoint && windowWidth < 992)) {
        img.style.transform = 'none';
        return;
      }
      
      const rect = wrapper.getBoundingClientRect();
      
      // Only calculate if in viewport (performance optimization)
      if (rect.top < windowHeight && rect.bottom > 0) {
        // Calculate scroll progress from 0 to 1
        const scrollProgress = (windowHeight - rect.top) / (windowHeight + rect.height);
        const centerProgress = scrollProgress - 0.5;
        
        let transformParts = [];
        
        if (direction === 'horizontal') {
          // Horizontal: scale and translate
          // Movement range based on how much extra width the scale creates
          const extraSpace = (horizontalScale - 1) * 100; // e.g., 0.1 * 100 = 10%
          const translateX = centerProgress * extraSpace * speed;
          
          transformParts.push(`scale(${horizontalScale})`);
          transformParts.push(`translateX(${translateX}%)`);
          
        } else if (direction === 'both') {
          // Both directions
          const extraSpaceX = (horizontalScale - 1) * 100;
          const translateX = centerProgress * extraSpaceX * speed;
          const translateY = centerProgress * 100 * speed;
          
          transformParts.push(`scale(${horizontalScale})`);
          transformParts.push(`translate(${translateX}%, ${translateY}%)`);
          
        } else {
          // Vertical only (default)
          const parallaxOffset = centerProgress * 200 * speed;
          transformParts.push(`translate3d(0, ${parallaxOffset}px, 0)`);
        }
        
        img.style.transform = transformParts.join(' ');
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
    version: '2.3.0'
  };
  
})();
