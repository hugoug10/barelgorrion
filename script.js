document.addEventListener('DOMContentLoaded', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Smooth Scrolling for Navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // La barra se vuelve opaca al bajar (en portada empieza transparente sobre la foto)
    const navbar = document.querySelector('.navbar');
    const updateNavbar = () => navbar && navbar.classList.toggle('scrolled', window.scrollY > 40);
    updateNavbar();
    window.addEventListener('scroll', updateNavbar, { passive: true });

    // Aparición suave de bloques al hacer scroll. El contenido es visible por defecto:
    // solo se oculta cuando este script está activo y el navegador soporta IntersectionObserver.
    const revealEls = document.querySelectorAll('.reveal');
    let observer = null;
    if (!reduceMotion && 'IntersectionObserver' in window && revealEls.length) {
        document.documentElement.classList.add('js-reveal');
        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        revealEls.forEach(el => observer.observe(el));
    }

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
        let autoScrollSpeed = reduceMotion ? 0 : 0.4; // Pixels per frame
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
            
            // Desplaza el ancho de una foto (los anchos varían, se usa el de la primera + márgenes)
            const first = galleryTrack.querySelector('.gallery-item');
            const firstStyle = getComputedStyle(first);
            const itemWidth = first.offsetWidth + parseFloat(firstStyle.marginLeft) + parseFloat(firstStyle.marginRight);
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
