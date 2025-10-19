console.log('IT\'S ALIVE!');

// Utility function
const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

// Navigation data
const navData = [
  { text: 'HOME', href: '/index.html' },
  { text: 'PROJECTS', href: '/projects/index.html' },
  { text: 'CONTACT', href: '/contact/index.html' },
  { text: 'RESUME', href: '/resume/index.html' },
  { text: 'GITHUB', href: 'https://github.com/HOYALIM', external: true }
];

// Step 2: Auto current page highlight
function highlightCurrentPage() {
  const currentLink = $$('nav a').find(a => 
    a.host === location.host && a.pathname === location.pathname
  );
  currentLink?.classList.add('current');
}

// Step 3: Auto navigation
function createNavigation() {
  const nav = document.createElement('nav');
  
  navData.forEach(item => {
    const link = document.createElement('a');
    link.textContent = item.text;
    link.href = item.href;
    
    if (item.external || item.href.startsWith('http')) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    
    nav.appendChild(link);
  });
  
  document.body.insertBefore(nav, document.body.firstChild);
  highlightCurrentPage();
}

// Step 4: Dark mode toggle
function setupDarkMode() {
  const container = document.createElement('div');
  container.className = 'theme-toggle-container';
  
  const button = document.createElement('button');
  button.id = 'theme-toggle';
  button.className = 'theme-toggle-switch';
  
  const track = document.createElement('div');
  track.className = 'toggle-track';
  track.appendChild(document.createElement('div')).className = 'toggle-slider';
  
  button.appendChild(track);
  container.appendChild(button);
  document.body.appendChild(container);
  
  // Load saved theme
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.body.setAttribute('data-theme', currentTheme);
  
  // Toggle theme
  button.addEventListener('click', () => {
    const newTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

// Step 5: Contact form with URL encoding
function setupContactForm() {
  const form = document.querySelector('form[action*="mailto"]');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const params = Array.from(data.entries())
      .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
      .join('&');
    location.href = `${form.action}?${params}`;
  });
}

// Resume coursework dropdown functionality
function setupCourseworkDropdown() {
  const mainHeader = document.querySelector('.coursework-main-header');
  const dropdownContent = document.querySelector('.coursework-dropdown-content');
  const dropdownIcon = document.querySelector('.dropdown-icon');
  const courseworkOptions = document.querySelectorAll('.coursework-option');
  
  if (!mainHeader || !dropdownContent) return;
  
  // Main dropdown toggle
  mainHeader.addEventListener('click', (e) => {
    e.preventDefault();
    dropdownContent.classList.toggle('expanded');
    
    if (dropdownIcon) {
      dropdownIcon.style.transform = dropdownContent.classList.contains('expanded') 
        ? 'rotate(180deg)' 
        : 'rotate(0deg)';
    }
  });
  
  // Option selection
  courseworkOptions.forEach(option => {
    const category = option.getAttribute('data-category');
    const content = document.getElementById(`${category}-courses`);
    
    if (option && content) {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Close dropdown
        dropdownContent.classList.remove('expanded');
        if (dropdownIcon) {
          dropdownIcon.style.transform = 'rotate(0deg)';
        }
        
        // Hide all other content
        document.querySelectorAll('.coursework-content').forEach(c => {
          c.classList.remove('expanded');
        });
        
        // Show selected content
        content.classList.add('expanded');
      });
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.coursework-dropdown')) {
      dropdownContent.classList.remove('expanded');
      if (dropdownIcon) {
        dropdownIcon.style.transform = 'rotate(0deg)';
      }
    }
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  createNavigation();
  setupDarkMode();
  setupContactForm();
  setupCourseworkDropdown();
});
