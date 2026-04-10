document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        // Add a slight delay for aesthetic reasons so users see the loading animation briefly even on fast connections
        setTimeout(() => {
            preloader.classList.add('hidden');
            // Optionally remove from DOM after transition ends
            setTimeout(() => preloader.remove(), 800);
        }, 1300);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('Bar El Gorrión - Premium Experience Loaded');

    // Smooth Scrolling for Navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Navbar Scroll Effect (Glassmorphism on scroll)
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(26, 32, 44, 0.98)';
            navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        } else {
            navbar.style.background = 'rgba(26, 32, 44, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });


    // Simple Parallax Effect for Hero - DISABLED (Interferes with fixed background)
    // const hero = document.querySelector('.hero');
    // window.addEventListener('scroll', () => {
    //     const scrolled = window.pageYOffset;
    //     if (hero) {
    //         hero.style.backgroundPositionY = `${scrolled * 0.5}px`;
    //     }
    // });

    // Reveal on Scroll Animation (Simple Intersection Observer)
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Alseo add .active to .reveal elements
                if (entry.target.classList.contains('reveal')) {
                    entry.target.classList.add('active');
                }
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.section h2, .menu-item, .intro p').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // Add 'visible' class styles dynamically
    const style = document.createElement('style');
    style.innerHTML = `
        .visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // Mobile Menu Toggle
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");
    const links = document.querySelectorAll(".nav-links li");

    if (hamburger) {
        hamburger.addEventListener("click", () => {
            navLinks.classList.toggle("active");
            hamburger.classList.toggle("toggle");
        });
    }

    // Close mobile menu when clicking a link
    links.forEach(link => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("active");
            hamburger.classList.remove("toggle");
        });
    });

    // --- Premium Features JS ---

    // Additional elements to reveal
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    // Lightbox Functionality
    const lightbox = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');

    if (lightbox && lightboxImg) {
        document.querySelectorAll('.gallery-item img').forEach(img => {
            img.style.cursor = 'pointer'; // add pointer cursor
            img.addEventListener('click', (e) => {
                lightbox.classList.add('show');
                lightboxImg.src = e.target.src;
            });
        });

        const closeLightbox = () => lightbox.classList.remove('show');

        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('show')) closeLightbox();
        });
    }

    // Cookie Banner
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptCookies = document.getElementById('accept-cookies');
    const rejectCookies = document.getElementById('reject-cookies');

    if (cookieBanner) {
        if (!localStorage.getItem('cookies-accepted')) {
            setTimeout(() => {
                cookieBanner.classList.add('show');
            }, 1000);
        }

        const hideBanner = (value) => {
            localStorage.setItem('cookies-accepted', value);
            cookieBanner.classList.remove('show');
        };

        if (acceptCookies) acceptCookies.addEventListener('click', () => hideBanner('true'));
        if (rejectCookies) rejectCookies.addEventListener('click', () => hideBanner('false'));
    }

    // --- Content Protection ---
    const showProtectionToast = (e) => {
        const toast = document.createElement('div');
        toast.className = 'protection-toast';
        toast.innerText = 'Código privado';
        document.body.appendChild(toast);

        // Position toast above click
        const x = e.pageX || e.clientX + window.scrollX;
        const y = e.pageY || e.clientY + window.scrollY;

        toast.style.left = `${x}px`;
        toast.style.top = `${y - 40}px`; // 40px above click
        toast.style.transform = 'translateX(-50%)'; // Center horizontally over click

        // Animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove after animation
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    };

    // Disable Right Click
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showProtectionToast(e);
    }, false);

    // Disable Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }

        // Ctrl/Cmd + U (View Source)
        if ((e.ctrlKey || e.metaKey) && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }

        // Ctrl/Cmd + Shift + I (Inspect)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }

        // Ctrl/Cmd + Shift + J (Console)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }

        // Ctrl/Cmd + Shift + C (Inspect Element)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode === 67) {
            e.preventDefault();
            return false;
        }

        // Ctrl/Cmd + S (Save)
        if ((e.ctrlKey || e.metaKey) && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }
    }, false);

    // --- Interactive Infinite Gallery ---
    const galleryStrip = document.querySelector('.gallery-strip');
    const galleryTrack = document.querySelector('.gallery-track');
    
    if (galleryStrip && galleryTrack) {
        let isDragging = false;
        let startX;
        let scrollLeft;
        let autoScrollSpeed = 0.5; // Pixels per frame
        let currentX = 0;
        let animationId;
        let isPaused = false;
        let lastInteractionTime = Date.now();
        const nextBtn = document.getElementById('gallery-next');
        const prevBtn = document.getElementById('gallery-prev');

        const updateGallery = () => {
            if (!isDragging && !isPaused) {
                currentX -= autoScrollSpeed;
                
                const halfWidth = galleryTrack.scrollWidth / 2;
                if (Math.abs(currentX) >= halfWidth) {
                    currentX = 0;
                }
                
                galleryTrack.style.transform = `translateX(${currentX}px)`;
            }
            animationId = requestAnimationFrame(updateGallery);
        };

        const startDragging = (e) => {
            // Disable drag with mouse on desktop (non-touch)
            if (e.type === 'mousedown' && window.innerWidth > 1024) return;

            isDragging = true;
            lastInteractionTime = Date.now();
            const pageX = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
            startX = pageX - galleryStrip.offsetLeft;
            scrollLeft = currentX;
            galleryTrack.style.transition = 'none';
        };

        const stopDragging = () => {
            if (!isDragging) return;
            isDragging = false;
            setTimeout(() => {
                if (Date.now() - lastInteractionTime > 3000) {
                    isPaused = false;
                }
            }, 3000);
        };

        const move = (e) => {
            if (!isDragging) return;
            const pageX = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
            const x = pageX - galleryStrip.offsetLeft;
            const walk = (x - startX);
            currentX = scrollLeft + walk;

            const halfWidth = galleryTrack.scrollWidth / 2;
            if (currentX > 0) currentX = -halfWidth;
            if (Math.abs(currentX) >= halfWidth) currentX = 0;

            galleryTrack.style.transform = `translateX(${currentX}px)`;
            lastInteractionTime = Date.now();
        };

        // Navigation Arrows Logic
        const shiftGallery = (direction) => {
            isPaused = true;
            lastInteractionTime = Date.now();
            
            const itemWidth = 380; // 350px width + 30px total margins
            galleryTrack.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            
            currentX += (direction === 'next' ? -itemWidth : itemWidth);
            
            // Boundary checks for seamless feel during jump
            const halfWidth = galleryTrack.scrollWidth / 2;
            if (currentX > 0) currentX = -halfWidth + itemWidth;
            if (Math.abs(currentX) >= halfWidth) currentX = 0;
            
            galleryTrack.style.transform = `translateX(${currentX}px)`;
            
            // Remove transition after it's done so auto-scroll remains linear
            setTimeout(() => {
                galleryTrack.style.transition = 'none';
                if (!isDragging && !galleryStrip.matches(':hover')) {
                    isPaused = false;
                }
            }, 500);
        };

        if (nextBtn) nextBtn.addEventListener('click', () => shiftGallery('next'));
        if (prevBtn) prevBtn.addEventListener('click', () => shiftGallery('prev'));

        // Drag Events
        galleryStrip.addEventListener('mousedown', startDragging);
        galleryStrip.addEventListener('touchstart', startDragging, { passive: true });
        
        window.addEventListener('mousemove', move);
        window.addEventListener('touchmove', (e) => {
            if (isDragging) e.preventDefault();
            move(e);
        }, { passive: false });
        
        window.addEventListener('mouseup', stopDragging);
        window.addEventListener('touchend', stopDragging);

        galleryStrip.addEventListener('mouseenter', () => isPaused = true);
        galleryStrip.addEventListener('mouseleave', () => {
            if (!isDragging) {
                setTimeout(() => {
                    if (Date.now() - lastInteractionTime > 2000) isPaused = false;
                }, 2000);
            }
        });

        updateGallery();
    }
});
