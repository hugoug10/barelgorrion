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
});
