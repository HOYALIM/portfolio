// Import required functions from global.js
import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

// Main function to load and display latest projects and GitHub data
async function loadHomePage() {
  try {
    // Fetch and display latest 3 projects
    const projects = await fetchJSON('./lib/projects.json');
    const latestProjects = projects.slice(0, 3);
    
    // Select the projects container
    const projectsContainer = document.querySelector('.projects');
    
    if (projectsContainer) {
      // Render the latest projects
      renderProjects(latestProjects, projectsContainer, 'h2');
    }
    
    // Fetch and display GitHub data
    const githubData = await fetchGitHubData('HOYALIM');
    
    // Select the profile stats container
    const profileStats = document.querySelector('#profile-stats');
    
    if (profileStats) {
      profileStats.innerHTML = `
        <dl>
          <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
          <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
          <dt>Followers:</dt><dd>${githubData.followers}</dd>
          <dt>Following:</dt><dd>${githubData.following}</dd>
        </dl>
      `;
    }
  } catch (error) {
    console.error('Error loading home page data:', error);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadHomePage);
