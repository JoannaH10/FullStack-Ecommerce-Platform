// public/js/faq.js

// Wrap in IIFE
(function() {

    // Move search toggle logic inside DOMContentLoaded or handle carefully
    const searchToggle = document.getElementById('searchToggle');
    const searchContainer = document.querySelector('.search-container');
    if (searchToggle && searchContainer) {
        searchToggle.addEventListener('click', () => {
            searchContainer.classList.toggle('active');
        });
    } else {
        console.warn('Search toggle elements not found on FAQ page.');
    }


    // Consolidate all DOM manipulation inside a single DOMContentLoaded
    document.addEventListener("DOMContentLoaded", function() {

        // FAQ Accordion functionality
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                question.classList.toggle('active');
                const answer = question.nextElementSibling;
                if (question.classList.contains('active')) {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                } else {
                    answer.style.maxHeight = null;
                }
            });
        });

        // NOTE: The navbar scroll effect is duplicated here, in homepage.js, and contactus.js.
        // It's best to put this in ONE global script (e.g., `script.js` if it's loaded first and always present).
        // For now, I'll keep it scoped here, but be aware of the redundancy.
        // If you want a common navbar effect across all pages, remove it from here, homepage.js, and contactus.js
        // and put it *once* in `script.js` (or a new `global-navbar.js` file).
        const navbar = document.querySelector('.navbar'); // Local to this IIFE and DCL
        if (navbar) {
            // First navbar scroll effect (shrink)
            window.addEventListener('scroll', function() {
                if (window.scrollY > 50) {
                    navbar.classList.add('shrink');
                } else {
                    navbar.classList.remove('shrink');
                }
            });

            // Second navbar scroll effect (hide/show)
            let lastScrollTop = 0; // Local to this IIFE and DCL
            window.addEventListener('scroll', () => {
                const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
                if (currentScroll > lastScrollTop) {
                    navbar.classList.add('navbar-hidden');
                } else {
                    navbar.classList.remove('navbar-hidden');
                }
                lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
            });
        } else {
            console.warn('Navbar element not found for scroll effects in faq.js.');
        }

    }); // End of DOMContentLoaded

})(); // End of IIFE for faq.js