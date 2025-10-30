(function() {
    // Navbar scroll behavior (existing code)
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');

    if (navbar) {
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

            if (currentScroll > lastScrollTop) {
                navbar.classList.add('navbar-hidden');
            } else {
                navbar.classList.remove('navbar-hidden');
            }
            lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
        });
    }

    // Contact form submission
    document.addEventListener('DOMContentLoaded', () => {
        const contactForm = document.getElementById('contactForm');
        const submitBtn = document.getElementById('submitBtn');
        const formMessage = document.getElementById('formMessage');

        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Disable button and show loading
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';
                formMessage.textContent = '';
                formMessage.className = 'form-message';

                try {
                    const response = await fetch('/api/s1/contactus/submit', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            firstName: document.getElementById('first_name').value,
                            lastName: document.getElementById('last_name').value,
                            phone: document.getElementById('phone').value,
                            email: document.getElementById('email').value,
                            message: document.getElementById('message').value,
                            consent: document.getElementById('consent').checked
                        })
                    });

                    const result = await response.json();

                    if (response.ok) {
                        formMessage.textContent = result.message || 'Thank you! Your message has been sent.';
                        formMessage.classList.add('success');
                        contactForm.reset();
                    } else {
                        formMessage.textContent = result.message || 'Failed to submit form. Please try again.';
                        formMessage.classList.add('error');
                    }
                } catch (error) {
                    console.error('Error submitting form:', error);
                    formMessage.textContent = 'An error occurred. Please try again later.';
                    formMessage.classList.add('error');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'SUBMIT FORM';
                }
            });
        }
    });
})();