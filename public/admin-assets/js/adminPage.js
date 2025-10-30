// adminPage.js
document.addEventListener('DOMContentLoaded', function() {
    // === REMOVED: Navigation functionality (navLinks.forEach, e.preventDefault, data-target logic) ===
    // This is now handled by server-side routing (Express.js and EJS)

    // Mobile menu functionality (KEEP THIS - it controls the sidebar's appearance, not page navigation)
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const closeMobileMenuBtn = document.querySelector('.close-mobile-menu');
    const mobileSidebarOverlay = document.querySelector('.mobile-sidebar-overlay');
    const adminSidebar = document.querySelector('.admin-sidebar');
    const mobileSidebar = document.querySelector('.mobile-sidebar'); // Make sure this selector is correct if you have a separate mobile sidebar element

    // Ensure the mobile sidebar exists before attaching listeners
    if (mobileMenuBtn && adminSidebar && mobileSidebarOverlay) {
        mobileMenuBtn.addEventListener('click', function() {
            adminSidebar.classList.add('active'); // Add 'active' to show sidebar
            mobileSidebarOverlay.style.display = 'block'; // Show overlay
        });
    }

    if (closeMobileMenuBtn) {
        closeMobileMenuBtn.addEventListener('click', closeMobileMenu);
    }

    if (mobileSidebarOverlay) {
        mobileSidebarOverlay.addEventListener('click', closeMobileMenu);
    }

    function closeMobileMenu() {
        if (adminSidebar) {
            adminSidebar.classList.remove('active'); // Remove 'active' to hide sidebar
        }
        if (mobileSidebarOverlay) {
            mobileSidebarOverlay.style.display = 'none'; // Hide overlay
        }
    }

    // Logout button functionality (REMOVE THIS IF USING SERVER-SIDE LOGOUT ROUTE)
    // If you changed your logout button to an <a> tag with href="/admin/logout",
    // then this JavaScript is no longer needed for the *actual logout*.
    // It's still fine to keep it if you want the 'alert' for debugging,
    // but ultimately the <a> tag will handle the navigation.
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // alert('Logout functionality would be implemented here'); // You can remove this
            // If it's an <a> tag, the browser will navigate automatically.
            // If it's still a button, you might need window.location.href = '/admin/logout';
        });
    });

    // Add product button functionality (KEEP THIS - it's an internal page action)
    const addProductBtn = document.querySelector('.add-btn');
    if (addProductBtn) { // Check if element exists before adding listener
        addProductBtn.addEventListener('click', function() {
            alert('Add product functionality would be implemented here');
        });
    }

    // Notification button functionality (KEEP THIS - it's an internal page action)
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) { // Check if element exists
        notificationBtn.addEventListener('click', function() {
            alert('Notification center would be shown here');
        });
    }

    // Profile image change functionality (KEEP THIS - it's an internal page action)
    const changePhotoBtn = document.querySelector('.change-photo-btn');
    if (changePhotoBtn) { // Check if element exists
        changePhotoBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Keep this preventDefault if it's a form submission or AJAX
            alert('Profile photo change functionality would be implemented here');
        });
    }
});