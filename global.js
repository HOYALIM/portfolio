console.log('IT\'S ALIVE!');

// Utility function
const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

// Fetch JSON data from URL
export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

// Render projects dynamically
export function renderProjects(projects, container, headingLevel = 'h2') {
  // Clear existing content
  container.innerHTML = '';
  
  // Create and append each project
  projects.forEach(project => {
    const article = document.createElement('article');
    
    const descriptionDiv = document.createElement('div');
    descriptionDiv.innerHTML = `<p>${project.description}</p>`;
    
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${project.image}" alt="${project.title}">
    `;
    article.appendChild(descriptionDiv);
    
    // Add year in bottom-right corner
    if (project.year) {
      const yearElement = document.createElement('time');
      yearElement.textContent = project.year;
      yearElement.className = 'project-year';
      article.appendChild(yearElement);
    }
    
    container.appendChild(article);
  });
}

// Fetch GitHub data
export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}

// Get base path for GitHub Pages (e.g., '/portfolio/' or '/')
function getBasePath() {
  const pathname = window.location.pathname;
  // Remove trailing filename and keep only directory path
  const pathParts = pathname.split('/').filter(p => p);
  // If pathname starts with repository name (portfolio), include it in base path
  if (pathParts[0] === 'portfolio') {
    return '/portfolio/';
  }
  // Otherwise assume root deployment
  return '/';
}

// Navigation data with dynamic base path
const basePath = getBasePath();
const navData = [
  { text: 'HOME', href: `${basePath}index.html` },
  { text: 'PROJECTS', href: `${basePath}projects/index.html` },
  { text: 'CONTACT', href: `${basePath}contact/index.html` },
  { text: 'RESUME', href: `${basePath}resume/index.html` },
  { text: 'META', href: `${basePath}meta/index.html` }
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

// GitHub logo button in top left
function setupGitHubButton() {
  const container = document.createElement('div');
  container.className = 'github-button-container';
  
  const link = document.createElement('a');
  link.href = 'https://github.com/HOYALIM';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.className = 'github-button';
  link.setAttribute('aria-label', 'GitHub Profile');
  
  // GitHub logo SVG
  link.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  `;
  
  container.appendChild(link);
  document.body.appendChild(container);
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
  setupGitHubButton();
  setupContactForm();
  setupCourseworkDropdown();
});
