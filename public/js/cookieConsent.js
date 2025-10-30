// public/js/cookieConsent.js

document.addEventListener('DOMContentLoaded', () => {
    const cookieConsent = document.getElementById('cookieConsent');
    const acceptCookiesBtn = document.getElementById('acceptCookies');
    const declineCookiesBtn = document.getElementById('declineCookies');

    // Define cookie names and expiration times
    const CONSENT_COOKIE_NAME = 'cookie_consent';
    const DECLINE_COOKIE_NAME = 'cookie_declined'; // New cookie name for decline
    const ACCEPT_EXPIRY_DAYS = 365; // Example: 1 year for accepted consent
    const DECLINE_EXPIRY_DAYS = 30; // Example: Re-ask after 30 days if declined

    // Function to set a cookie (expiration in DAYS now for clarity)
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000)); // Convert days to milliseconds
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
    }

    // Function to get a cookie
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // Check if the user has already accepted or declined cookies
    const consentAccepted = getCookie(CONSENT_COOKIE_NAME);
    const consentDeclined = getCookie(DECLINE_COOKIE_NAME);

    // Only show the pop-up if neither 'accepted' nor 'declined' cookie is present
    if (!consentAccepted && !consentDeclined) {
        cookieConsent.style.display = 'block';
    }

    // Event listener for Accept button
    acceptCookiesBtn.addEventListener('click', () => {
        // Set accept cookie for a long duration
        setCookie(CONSENT_COOKIE_NAME, 'true', ACCEPT_EXPIRY_DAYS);
        // Remove the decline cookie if it exists (in case user changes mind)
        setCookie(DECLINE_COOKIE_NAME, '', -1); // Set expiration to past to delete
        cookieConsent.style.display = 'none'; // Hide the pop-up
    });

    // Event listener for Decline button
    declineCookiesBtn.addEventListener('click', () => {
        // Set a 'declined' cookie for a shorter duration
        setCookie(DECLINE_COOKIE_NAME, 'true', DECLINE_EXPIRY_DAYS);
        // Remove the accept cookie if it exists
        setCookie(CONSENT_COOKIE_NAME, '', -1); // Set expiration to past to delete
        cookieConsent.style.display = 'none'; // Hide the pop-up
    });
});