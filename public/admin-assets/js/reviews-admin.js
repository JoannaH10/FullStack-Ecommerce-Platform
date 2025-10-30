 let allReviews = [];
        let currentFilter = 'all';

        // Initialize the admin panel
        document.addEventListener('DOMContentLoaded', () => {
            loadReviews();
            setupEventListeners();
        });

        function setupEventListeners() {
            // Filter buttons
            document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    currentFilter = e.target.dataset.filter;
                    filterAndDisplayReviews();
                });
            });

            // Search input
            document.getElementById('searchInput').addEventListener('input', filterAndDisplayReviews);
        }

        async function loadReviews() {
            try {
                showLoading();
                
                // Load all reviews (including unapproved ones for admin)
                const response = await fetch('/api/s1/reviews?approved=false');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                allReviews = await response.json();
                updateStats();
                filterAndDisplayReviews();
                
            } catch (error) {
                console.error('Error loading reviews:', error);
                showError('Failed to load reviews. Please try again.');
            }
        }

        function updateStats() {
            const total = allReviews.length;
            const approved = allReviews.filter(r => r.approved === true).length;
            const pending = allReviews.filter(r => r.approved === false).length;
            const rejected = 0; // You can add this field to your model if needed

            document.getElementById('totalReviews').textContent = total;
            document.getElementById('approvedReviews').textContent = approved;
            document.getElementById('pendingReviews').textContent = pending;
            document.getElementById('rejectedReviews').textContent = rejected;
        }

        function filterAndDisplayReviews() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            
            let filteredReviews = allReviews.filter(review => {
                const matchesFilter = currentFilter === 'all' || 
                    (currentFilter === 'approved' && review.approved === true) ||
                    (currentFilter === 'pending' && review.approved === false);

                const matchesSearch = !searchTerm || 
                    review.text.toLowerCase().includes(searchTerm) ||
                    (review.user?.name || '').toLowerCase().includes(searchTerm) ||
                    (review.reviewerType || '').toLowerCase().includes(searchTerm);

                return matchesFilter && matchesSearch;
            });

            displayReviews(filteredReviews);
        }

        function displayReviews(reviews) {
            const container = document.getElementById('reviewsContainer');
            
            if (reviews.length === 0) {
                container.innerHTML = '<div class="no-reviews">📭 No reviews found matching your criteria.</div>';
                return;
            }

            const reviewsHTML = reviews.map(review => createReviewCard(review)).join('');
            container.innerHTML = `<div class="reviews-grid">${reviewsHTML}</div>`;
        }

        function createReviewCard(review) {
            const statusClass = review.approved ? 'approved' : 'pending';
            const statusText = review.approved ? 'Approved' : 'Pending Review';
            const statusBadgeClass = review.approved ? 'status-approved' : 'status-pending';
            
            const stars = Array.from({length: 5}, (_, i) => 
                `<span class="star ${i < review.rating ? '' : 'empty'}">★</span>`
            ).join('');

            const reviewerInitials = (review.user?.name || 'Unknown User').split(' ').map(n => n[0]).join('').toUpperCase();
            const reviewDate = new Date(review.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            return `
                <div class="review-card ${statusClass}" data-review-id="${review._id}">
                    <div class="review-header">
                        <div class="reviewer-info">
                            <div class="reviewer-avatar">${reviewerInitials}</div>
                            <div class="reviewer-details">
                                <h3>${review.user?.name || 'Unknown User'}</h3>
                                <span class="reviewer-type">${review.reviewerType || 'Customer'}</span>
                            </div>
                        </div>
                        <div class="rating-display">
                            ${stars}
                            <span class="rating-number">${review.rating}/5</span>
                        </div>
                    </div>
                    
                    <div class="review-content">
                        <div class="review-text">"${review.text}"</div>
                        
                        <div class="review-meta">
                            <span>📅 ${reviewDate}</span>
                            <span class="status-badge ${statusBadgeClass}">${statusText}</span>
                        </div>
                        
                        <div class="review-actions">
                            ${!review.approved ? 
                                `<button class="action-btn btn-approve" onclick="approveReview('${review._id}')">
                                    ✅ Approve
                                </button>` : 
                                `<button class="action-btn btn-reject" onclick="unapproveReview('${review._id}')">
                                    ⏳ Unapprove
                                </button>`
                            }
                            <button class="action-btn btn-delete" onclick="deleteReview('${review._id}')">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        async function approveReview(reviewId) {
            try {
                showLoadingNotification('Approving review...');
                
                const response = await fetch(`/api/s1/reviews/admin/approve/${reviewId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (response.ok) {
                    showSuccessNotification('✅ Review approved successfully! Now visible on frontend.');
                    
                    // Update the review in our local array
                    const reviewIndex = allReviews.findIndex(r => r._id === reviewId);
                    if (reviewIndex !== -1) {
                        allReviews[reviewIndex].approved = true;
                    }
                    
                    updateStats();
                    filterAndDisplayReviews();
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to approve review');
                }
            } catch (error) {
                console.error('Error approving review:', error);
                showErrorNotification('❌ Failed to approve review: ' + error.message);
            }
        }

        async function unapproveReview(reviewId) {
            try {
                showLoadingNotification('Unapproving review...');
                
                const response = await fetch(`/api/s1/reviews/admin/unapprove/${reviewId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (response.ok) {
                    showSuccessNotification('⏳ Review unapproved successfully! Hidden from frontend.');
                    
                    // Update the review in our local array
                    const reviewIndex = allReviews.findIndex(r => r._id === reviewId);
                    if (reviewIndex !== -1) {
                        allReviews[reviewIndex].approved = false;
                    }
                    
                    updateStats();
                    filterAndDisplayReviews();
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to unapprove review');
                }
            } catch (error) {
                console.error('Error unapproving review:', error);
                showErrorNotification('❌ Failed to unapprove review: ' + error.message);
            }
        }

        async function deleteReview(reviewId) {
            // Enhanced confirmation dialog
            const reviewToDelete = allReviews.find(r => r._id === reviewId);
            const userName = reviewToDelete?.user?.name || 'Unknown User';
            
            if (!confirm(`⚠️ Are you sure you want to permanently delete this review by ${userName}?\n\nThis action cannot be undone and will remove the review from both admin panel and frontend.`)) {
                return;
            }

            try {
                showLoadingNotification('Deleting review...');
                
                const response = await fetch(`/api/s1/reviews/admin/${reviewId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (response.ok) {
                    showSuccessNotification('🗑️ Review deleted successfully! Removed from frontend.');
                    
                    // Remove the review from our local array
                    allReviews = allReviews.filter(r => r._id !== reviewId);
                    
                    updateStats();
                    filterAndDisplayReviews();
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete review');
                }
            } catch (error) {
                console.error('Error deleting review:', error);
                showErrorNotification('❌ Failed to delete review: ' + error.message);
            }
        }

        function refreshReviews() {
            showLoadingNotification('Refreshing reviews...');
            loadReviews();
        }

        function showLoading() {
            document.getElementById('reviewsContainer').innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    Loading reviews from database...
                </div>
            `;
        }

        function showError(message) {
            document.getElementById('reviewsContainer').innerHTML = `
                <div class="no-reviews" style="color: #dc3545; border-color: #dc3545;">
                    ❌ ${message}
                    <br><br>
                    <button class="filter-btn" onclick="loadReviews()">🔄 Try Again</button>
                </div>
            `;
        }

        function showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.innerHTML = `
                <span>${message}</span>
                <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; font-size: 1.2rem; cursor: pointer; margin-left: 10px;">×</button>
            `;
            
            document.body.appendChild(notification);
            
            // Trigger animation
            setTimeout(() => notification.classList.add('show'), 100);
            
            // Auto remove after 4 seconds
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                }
            }, 4000);
        }

        function showSuccessNotification(message) {
            showNotification(message, 'success');
        }

        function showErrorNotification(message) {
            showNotification(message, 'error');
        }

        function showLoadingNotification(message) {
            showNotification('⏳ ' + message, 'success');
            // Remove loading notification after 2 seconds
            setTimeout(() => {
                const notifications = document.querySelectorAll('.notification');
                notifications.forEach(n => {
                    if (n.textContent.includes('⏳')) {
                        n.classList.remove('show');
                        setTimeout(() => n.remove(), 300);
                    }
                });
            }, 2000);
        }