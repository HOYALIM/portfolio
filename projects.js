// Import required functions from global.js
import { fetchJSON, renderProjects } from './global.js';

// Main function to load and display projects
async function loadProjects() {
  try {
    // Fetch project data from JSON file
    const projects = await fetchJSON('../lib/projects.json');
    
    // Select the projects container
    const projectsContainer = document.querySelector('.projects');
    
    if (projectsContainer) {
      // Render all projects
      renderProjects(projects, projectsContainer, 'h2');
    }
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadProjects);
