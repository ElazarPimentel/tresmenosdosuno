// file: scripts/main.js

document.addEventListener('DOMContentLoaded', function () {
    const localStorageKey = 'userTheme';
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const bodyElement = document.body;
    const burgerButton = document.querySelector('.burger'); // Select the burger menu button
    const navMenu = document.querySelector('.nav-bar ul'); // Select the navigation menu

    function loadTheme() {
        const savedTheme = localStorage.getItem(localStorageKey);
        if (savedTheme === 'light') {
            bodyElement.classList.add('light-mode');
            themeToggleButton.textContent = '|☯️|'; // Update button icon if needed
            themeToggleButton.setAttribute('aria-label', 'Switch to dark mode');
        } else {
            bodyElement.classList.remove('light-mode');
            themeToggleButton.textContent = '|☯️|'; // Update button icon if needed
            themeToggleButton.setAttribute('aria-label', 'Switch to light mode');
        }
    }

    function toggleTheme() {
        if (bodyElement.classList.contains('light-mode')) {
            bodyElement.classList.remove('light-mode');
            localStorage.setItem(localStorageKey, 'dark');
            themeToggleButton.setAttribute('aria-label', 'Switch to light mode');
        } else {
            bodyElement.classList.add('light-mode');
            localStorage.setItem(localStorageKey, 'light');
            themeToggleButton.setAttribute('aria-label', 'Switch to dark mode');
        }
    }

    function toggleNavMenu() {
        navMenu.classList.toggle('active');
        const isActive = navMenu.classList.contains('active');
        burgerButton.setAttribute('aria-expanded', isActive);
    }

    function closeNavMenu() {
        if (navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            burgerButton.setAttribute('aria-expanded', 'false');
        }
    }

    themeToggleButton.addEventListener('click', toggleTheme);
    burgerButton.addEventListener('click', toggleNavMenu);

    // Optional: Close the navigation menu when a link is clicked (for better UX on mobile)
    const navLinks = document.querySelectorAll('.nav-bar ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', closeNavMenu);
    });

    loadTheme();
});
