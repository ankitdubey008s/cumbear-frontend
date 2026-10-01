// --- Header Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const searchBtn = document.getElementById('searchBtn');
    const homeLogoBtn = document.getElementById('homeLogoBtn');

    // Menu Button (Hamburger)
    menuBtn.addEventListener('click', () => {
        console.log('Hamburger clicked - Opening Sidebar in Step 3');
    });

    // Search Button
    searchBtn.addEventListener('click', () => {
        console.log('Search clicked - Opening Search in Step 4');
    });

    // Logo Click -> Go Home
    homeLogoBtn.addEventListener('click', () => {
        console.log('Logo clicked - Returning to Home');
        
        // 1. Hide all view sections (Future-proofing for Step 5)
        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.remove('active');
            section.classList.add('hidden');
        });
        
        // 2. Show Home view
        const homeView = document.getElementById('homeView');
        if (homeView) {
            homeView.classList.remove('hidden');
            homeView.classList.add('active');
        }
        
        // 3. Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // 4. Reset bottom nav active state (Future-proofing)
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        const homeNavBtn = document.querySelector('.nav-item[data-view="homeView"]');
        if (homeNavBtn) homeNavBtn.classList.add('active');
    });
});
