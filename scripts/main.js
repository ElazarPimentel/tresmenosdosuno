// file name: scripts/main.js

document.addEventListener('DOMContentLoaded', function () {
    const localStorageKey = 'userTheme';
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const bodyElement = document.body;

    function loadTheme() {
        const savedTheme = localStorage.getItem(localStorageKey);
        if (savedTheme === 'light') {
            bodyElement.classList.add('light-mode');
            themeToggleButton.textContent = '|☯️|';
            themeToggleButton.setAttribute('aria-label', 'Switch to dark mode');
        } else {
            bodyElement.classList.remove('light-mode');
            themeToggleButton.textContent = '|☯️|';
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

    themeToggleButton.addEventListener('click', toggleTheme);

    loadTheme();
});
