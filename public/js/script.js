/*------------------------------------------------------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------NAVBAR--------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------------------------------------------------*/

document.addEventListener('DOMContentLoaded', () => {
    const searchToggle = document.getElementById('searchToggle');
    const searchContainer = document.querySelector('.search-container');

    // Check if searchToggle exists before adding listener
    if (searchToggle && searchContainer) {
        searchToggle.addEventListener('click', () => {
            searchContainer.classList.toggle('active');
        });
    }

    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');

    // Check if navbar exists before adding scroll listener
    if (navbar) {
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            if (currentScroll <= 0) {
                navbar.classList.remove('hidden');
                return;
            }

            if (currentScroll > lastScroll && !navbar.classList.contains('hidden')) {
                navbar.classList.add('hidden');
            } else if (currentScroll < lastScroll && navbar.classList.contains('hidden')) {
                navbar.classList.remove('hidden');
            }

            lastScroll = currentScroll;
        });
    }

/*------------------------------------------------------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------FOOTER--------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------------------------------------------------*/

    const logo = document.querySelector('.logo-animate');
    // Check if logo exists
    if (logo) {
        logo.addEventListener('click', () => {
            logo.style.animation = 'none';
            setTimeout(() => {
                logo.style.animation = 'spin 0.5s ease 1';
            }, 10);
            setTimeout(() => {
                logo.style.animation = 'bounce 0.5s ease infinite';
            }, 600);
        });
    }

    const flags = document.querySelectorAll('.flag-icon');
    // Iterate over flags and add event listeners only if they exist
    flags.forEach(flag => {
        flag.addEventListener('mouseenter', () => {
            const emoji = flag.querySelector('span');
            if (emoji) emoji.style.transform = 'scale(1.3)';
        });
        flag.addEventListener('mouseleave', () => {
            const emoji = flag.querySelector('span');
            if (emoji) emoji.style.transform = 'scale(1)';
        });
    });
});