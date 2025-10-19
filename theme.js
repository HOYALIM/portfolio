// Theme toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    if (!themeToggle) return; // Exit if no toggle found
    
    // Check for saved theme preference or default to light mode
    const currentTheme = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', currentTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
    
    // Coursework toggle functionality
    const courseworkHeader = document.querySelector('.coursework-header');
    const courseworkContent = document.querySelector('.coursework-content');
    const toggleIcon = document.querySelector('.toggle-icon');
    
    console.log('Coursework elements found:', {
        header: !!courseworkHeader,
        content: !!courseworkContent,
        icon: !!toggleIcon
    });
    
    if (courseworkHeader && courseworkContent) {
        courseworkHeader.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Coursework header clicked!');
            courseworkContent.classList.toggle('expanded');
            
            // Update toggle icon rotation
            if (toggleIcon) {
                toggleIcon.style.transform = courseworkContent.classList.contains('expanded') 
                    ? 'rotate(180deg)' 
                    : 'rotate(0deg)';
            }
        });
    } else {
        console.log('Coursework elements not found on this page');
    }
});
