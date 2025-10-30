// public/js/homepage.js

(function() {

    document.addEventListener('DOMContentLoaded', () => {

        // Search Toggle (if it's truly specific to homepage, otherwise move to global.js)
        const searchToggle = document.getElementById('searchToggle');
        const searchContainer = document.querySelector('.search-container');
        if (searchToggle && searchContainer) {
            searchToggle.addEventListener('click', () => {
                searchContainer.classList.toggle('active');
            });
        } else {
            console.warn('Search toggle elements not found on homepage.');
        }

        // Product Slider
        const productList = document.getElementById('productList');
        const prevButton = document.querySelector('.slider-wrapper .prev-btn');
        const nextButton = document.querySelector('.slider-wrapper .next-btn');

        if (productList && prevButton && nextButton) {
            let scrollAmount = 0;
            const scrollPerClick = 170;

            nextButton.addEventListener('click', () => {
                scrollAmount += scrollPerClick;
                if (scrollAmount > productList.scrollWidth - productList.clientWidth) {
                    scrollAmount = productList.scrollWidth - productList.clientWidth;
                }
                productList.scrollTo({ left: scrollAmount, behavior: 'smooth' });
            });

            prevButton.addEventListener('click', () => {
                scrollAmount -= scrollPerClick;
                if (scrollAmount < 0) {
                    scrollAmount = 0;
                }
                productList.scrollTo({ left: scrollAmount, behavior: 'smooth' });
            });
        } else {
            console.warn('Product slider elements not found on homepage.');
        }

        // --- NEW JAVASCRIPT FOR QUICK VIEW MODAL (MODIFIED BLOCK STARTS HERE) ---
        const quickViewModal = document.getElementById('quickViewModal');
        // Select the close button specifically within the quick view modal
        const closeButton = document.querySelector('#quickViewModal .close-button');
        const modalProductDetails = document.getElementById('modal-product-details');

        // IMPORTANT: Add a check here to ensure all modal elements exist before proceeding
        if (!quickViewModal || !closeButton || !modalProductDetails) {
            console.warn('Quick View Modal elements (modal container, close button, or product details div) not found. Quick View functionality will not work.');
            // This return stops the quick view logic from running if elements are missing.
            // Other homepage scripts will continue as normal.
            return;
        }

        // Open modal when ANY 'circle-product' is clicked
        document.querySelectorAll('.circle-product').forEach(productCard => {
            productCard.addEventListener('click', async (event) => {
                event.stopPropagation(); // Prevent issues if nested clickable elements are added later

                const productId = productCard.dataset.productId;
                if (!productId) {
                    console.error("Product ID not found on the clicked product card. Ensure data-product-id attribute is set.");
                    return;
                }

                modalProductDetails.innerHTML = '<p>Loading product details...</p>'; // Show loading message
                // Add the 'active' class to show the modal and trigger CSS animations
                quickViewModal.classList.add('active');

                try {
                    // Fetch product details from your API
                    // IMPORTANT: Ensure this API path matches your backend setup (e.g., /api/v1/products/)
                    const response = await fetch(`/api/s1/products/${productId}`);
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Unknown error'}`);
                    }
                    const product = await response.json();

                    // Populate modal with product details and NEW BUTTONS
                    modalProductDetails.innerHTML = `
                        <div class="quick-view-content">
                            <img src="${product.image}" alt="${product.name}" class="quick-view-img">
                            <div class="quick-view-info">
                                <h3>${product.name}</h3>
                                <p class="quick-view-price">$${product.price ? product.price.toFixed(2) : 'N/A'}</p>
                                <p class="quick-view-description">${product.description || 'No description available.'}</p>
                                <p><strong>Category:</strong> ${product.category || 'N/A'}</p>
                                <p><strong>Brand:</strong> ${product.brand || 'N/A'}</p>
                                <p><strong>Country:</strong> ${product.country || 'N/A'}</p>
                                <input type="number" value="1" min="1" class="quick-view-quantity">
                                <div class="modal-buttons"> <button class="add-to-cart-btn" data-product-id="${product._id}">Add to Cart</button>
                                    <button class="buy-now-btn" data-product-id="${product._id}">Buy Now</button> </div>
                            </div>
                        </div>
                    `;

                    // Add to Cart button listener inside the modal (after it's populated)
                    const addToCartBtn = modalProductDetails.querySelector('.add-to-cart-btn');
                    if(addToCartBtn) {
                        addToCartBtn.addEventListener('click', (cartEvent) => {
                            cartEvent.stopPropagation();
                            const quantityInput = modalProductDetails.querySelector('.quick-view-quantity');
                            const quantity = parseInt(quantityInput.value, 10);
                            if (isNaN(quantity) || quantity < 1) {
                                alert('Please enter a valid quantity (1 or more).');
                                return;
                            }
                            // Add to cart logic: store in localStorage (append or update quantity)
                            let cart = JSON.parse(localStorage.getItem('cart') || '[]');
                            let found = false;
                            for (let item of cart) {
                                if (item.id === product._id) {
                                    item.quantity = (item.quantity || 1) + quantity;
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                cart.push({ id: product._id, title: product.name, image: product.image, price: product.price, quantity });
                            }
                            localStorage.setItem('cart', JSON.stringify(cart));
                            quickViewModal.classList.remove('active');
                        });
                    }

                    // Buy Now button listener (NEW)
                    const buyNowBtn = modalProductDetails.querySelector('.buy-now-btn');
                    if(buyNowBtn) {
                        buyNowBtn.addEventListener('click', (buyEvent) => {
                            buyEvent.stopPropagation();
                            const quantityInput = modalProductDetails.querySelector('.quick-view-quantity');
                            const quantity = parseInt(quantityInput.value, 10);
                            if (isNaN(quantity) || quantity < 1) {
                                alert('Please enter a valid quantity (1 or more).');
                                return;
                            }
                            // Buy Now logic: store only this item in localStorage as a temporary cart
                            const buyNowCart = [{ id: product._id, name: product.name, image: product.image, price: product.price, quantity }];
                            localStorage.setItem('cart', JSON.stringify(buyNowCart));
                            window.location.href = `/checkout?buyNowType=product&id=${product._id}&quantity=${quantity}`;
                            quickViewModal.classList.remove('active');
                        });
                    }

                } catch (error) {
                    console.error("Error fetching product for quick view:", error);
                    modalProductDetails.innerHTML = `<p style="color: red;">Error loading product details: ${error.message}.</p>`;
                }
            });
        });

        // Close modal when close button is clicked
        closeButton.addEventListener('click', () => {
            quickViewModal.classList.remove('active');
        });

       
        window.addEventListener('click', (event) => {
            if (event.target === quickViewModal) {
                quickViewModal.classList.remove('active');
            }
        });
        


      
      
        const aboutSection = document.querySelector('.about-section');
        if (aboutSection) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        aboutSection.classList.add('visible');
                    }
                });
            }, { threshold: 0.3 });
            observer.observe(aboutSection);
        } else {
            console.warn('About section not found on homepage.');
        }

        // Logo Animation (if specific to homepage)
        const logo = document.querySelector('.logo-animate');
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
        } else {
            console.warn('Logo animation element not found on homepage.');
        }

        // Flag Icons
        const flags = document.querySelectorAll('.flag');
        if (flags.length > 0) {
            flags.forEach(flag => {
                const flagImage = flag.querySelector('img');
                if (flagImage) {
                    flag.addEventListener('mouseenter', () => {
                        flagImage.style.transform = 'scale(1.1)';
                        flagImage.style.transition = 'transform 0.3s ease';
                    });
                    flag.addEventListener('mouseleave', () => {
                        flagImage.style.transform = 'scale(1)';
                    });
                }
            });
        } else {
            console.warn('No flag icons found on homepage.');
        }

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });

        // Navbar hide/show on scroll
        let lastScroll = 0;
        const navbar = document.querySelector('.navbar');

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
        } else {
            console.warn('Navbar element not found for scroll hide/show in homepage.js.');
        }

        // --- NEW JAVASCRIPT FOR BANNER CAROUSEL ---
        const homepageCarousel = document.getElementById('homepage-carousel');
        if (homepageCarousel) {
            const carouselItems = homepageCarousel.querySelectorAll('.carousel-item');
            const prevCarouselBtn = homepageCarousel.querySelector('.carousel-control-prev');
            const nextCarouselBtn = homepageCarousel.querySelector('.carousel-control-next');
            let currentSlide = 0;

            if (carouselItems.length > 0 && prevCarouselBtn && nextCarouselBtn) {
                // Function to show a specific slide
                const showSlide = (index) => {
                    carouselItems.forEach((item, i) => {
                        if (i === index) {
                            item.classList.add('active');
                        } else {
                            item.classList.remove('active');
                        }
                    });
                };

                // Initialize to the first slide
                showSlide(currentSlide);

                // Event listener for Next button
                nextCarouselBtn.addEventListener('click', (e) => {
                    e.preventDefault(); // Prevent default link behavior
                    currentSlide = (currentSlide + 1) % carouselItems.length;
                    showSlide(currentSlide);
                });

                // Event listener for Previous button
                prevCarouselBtn.addEventListener('click', (e) => {
                    e.preventDefault(); // Prevent default link behavior
                    currentSlide = (currentSlide - 1 + carouselItems.length) % carouselItems.length;
                    showSlide(currentSlide);
                });

                // Optional: Auto-advance slides
                // setInterval(() => {
                //     currentSlide = (currentSlide + 1) % carouselItems.length;
                //     showSlide(currentSlide);
                // }, 5000); // Change slide every 5 seconds
            } else {
                console.warn('Homepage banner carousel elements not found or insufficient items. Carousel will not function.');
            }
        } else {
            console.warn('Homepage carousel container #homepage-carousel not found.');
        }

        const reviewsContainer = document.querySelector('.reviews-container');
        const reviewScrollLeftBtn = document.querySelector('.review-nav-buttons .fa-hand-point-left');
        const reviewScrollRightBtn = document.querySelector('.review-nav-buttons .fa-hand-point-right');

        if (reviewsContainer && reviewScrollLeftBtn && reviewScrollRightBtn) {
            const scrollAmount = 200; // Example: scroll by 200px

            reviewScrollLeftBtn.addEventListener('click', () => {
                reviewsContainer.scrollBy({
                    left: -scrollAmount,
                    behavior: 'smooth'
                });
            });

            reviewScrollRightBtn.addEventListener('click', () => {
                reviewsContainer.scrollBy({
                    left: scrollAmount,
                    behavior: 'smooth'
                });
            });
        } else {
            console.warn('Review carousel elements not found on homepage. Scrolling will not work.');
        }

        // --- EXISTING JAVASCRIPT FOR STAR RATING AND REVIEW FORM ---
        const stars = document.querySelectorAll('.rating-input .fas.fa-star');
        const selectedRatingInput = document.getElementById('selectedRating');
        const reviewForm = document.getElementById('reviewForm');
        const reviewText = document.getElementById('reviewText');

        if (stars.length > 0 && selectedRatingInput && reviewForm && reviewText) {

            function updateStars(rating) {
                stars.forEach(star => {
                    if (parseInt(star.dataset.rating) <= parseInt(rating)) {
                        star.classList.remove('text-gray-500'); 
                        star.classList.add('text-blue-500'); 
                    } else {
                        star.classList.remove('text-blue-500'); 
                        star.classList.add('text-gray-500'); 
                    }
                });
            }

            stars.forEach(star => {
                star.addEventListener('click', () => {
                    const rating = star.dataset.rating;
                    selectedRatingInput.value = rating;
                    updateStars(rating);
                });

                star.addEventListener('mouseover', () => {
                    const hoverRating = star.dataset.rating;
                    stars.forEach(s => {
                        if (parseInt(s.dataset.rating) <= parseInt(hoverRating)) {
                            s.classList.add('text-blue-300');
                            s.classList.remove('text-gray-500');
                            s.classList.remove('text-blue-500');
                        } else {
                            s.classList.remove('text-blue-300');
                        }
                    });
                });

                star.addEventListener('mouseout', () => {
                    updateStars(selectedRatingInput.value);
                    stars.forEach(s => {
                        s.classList.remove('text-yellow-300');
                    });
                });
            });


 reviewForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const reviewContent = reviewText.value.trim();
                const ratingValue = selectedRatingInput.value;
                const productId = document.querySelector('.product-container')?.dataset?.productId; // Get product ID from page if applicable

                if (!reviewContent || !ratingValue || ratingValue === '0') {
                    alert('Please write a review and select a star rating before submitting.');
                    return;
                }

                try {
                    
                    const response = await fetch('/api/s1/reviews', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}` // IMPORTANT: Only send if using JWT and user is logged in
                        },
                        body: JSON.stringify({
                            productId: productId, // This assumes you have a way to get the product ID on the page
                            rating: parseInt(ratingValue, 10),
                            reviewText: reviewContent 
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error('Failed to post review. Server responded with:', errorData);
                        throw new Error(errorData.message || 'Failed to submit review due to server error.');
                    }

                    const data = await response.json();
                    console.log('Review posted successfully:', data);

                    alert('Thank you for your review!'); 
                  
                    reviewText.value = '';
                    selectedRatingInput.value = '0';
                    updateStars(0); 

                     if (typeof loadReviews === 'function') {
                        loadReviews(); // Assuming you have a function to load/display reviews
                    }

                } catch (error) {
                    console.error('Review submission error:', error.message);
                    alert(`Error submitting review: ${error.message}`);
                }
            });
        } else {
            console.warn('Review submission elements not found. Review functionality may not work.');
        }
    });
})();