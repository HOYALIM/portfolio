// Import required functions from global.js
import { fetchJSON, renderProjects } from '../global.js';

// Color scale for pie chart - using D3's category10 scheme (Lab 5 requirement)
const colors = d3.scaleOrdinal(d3.schemeCategory10);

// Selected year for filtering (null means no filter)
let selectedYear = null;
let allProjects = [];

// Function to filter projects by search query
function filterProjectsByQuery(projects, query) {
  if (!query || query.trim() === '') {
    return projects;
  }
  
  const lowerQuery = query.toLowerCase();
  return projects.filter(project => {
    const title = project.title?.toLowerCase() || '';
    const description = project.description?.toLowerCase() || '';
    const year = project.year?.toString() || '';
    return title.includes(lowerQuery) || 
           description.includes(lowerQuery) || 
           year.includes(lowerQuery);
  });
}

// Function to filter projects by year
function filterProjectsByYear(projects, year) {
  if (!year) {
    return projects;
  }
  return projects.filter(project => project.year === year);
}

// Apply all filters (search + year)
function applyAllFilters() {
  const searchInput = document.getElementById('project-search');
  const query = searchInput ? searchInput.value : '';
  
  let filtered = filterProjectsByQuery(allProjects, query);
  if (selectedYear) {
    filtered = filterProjectsByYear(filtered, selectedYear);
  }
  
  return filtered;
}

// Render pie chart based on visible projects
function renderPieChart(visibleProjects) {
  // Clear existing SVG paths
  const svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  
  // Clear existing legend
  const legend = d3.select('#projects-legend');
  legend.selectAll('li').remove();
  
  // Group visible projects by year
  const yearCounts = d3.rollup(
    visibleProjects,
    (v) => v.length,
    (d) => d.year
  );
  
  // Convert to array format
  const data = Array.from(yearCounts, ([year, count]) => ({
    year: year,
    count: count
  })).sort((a, b) => a.year.localeCompare(b.year));
  
  if (data.length === 0) {
    return; // No data to display
  }
  
  // Create pie generator
  const pie = d3.pie()
    .value(d => d.count)
    .sort(null);
  
  // Create arc generator
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(45);
  
  // Generate arc data
  const arcs = pie(data);
  
  // Find the color for selected year
  const selectedColorIndex = selectedYear 
    ? data.findIndex(d => d.year === selectedYear)
    : -1;
  const selectedColor = selectedColorIndex >= 0 ? colors(selectedColorIndex) : null;

  // Draw paths
  svg.selectAll('path')
    .data(arcs)
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', (d, i) => {
      // If a year is selected, use that year's color for all slices
      if (selectedYear && selectedColor) {
        return selectedColor;
      }
      // Otherwise use each slice's own color
      return colors(i);
    })
    .attr('class', (d) => {
      return d.data.year === selectedYear ? 'selected' : '';
    })
    .style('cursor', 'pointer')
    .on('click', function(event, d) {
      // Toggle selection
      if (selectedYear === d.data.year) {
        selectedYear = null; // Deselect
      } else {
        selectedYear = d.data.year; // Select new year
      }
      
      // Update display with new filters
      updateDisplay();
    });
  
  // Create legend
  legend.selectAll('li')
    .data(data)
    .enter()
    .append('li')
    .attr('class', (d) => {
      return d.year === selectedYear ? 'selected' : '';
    })
    .attr('style', (d, i) => {
      const color = colors(i);
      return `--color: ${color}`;
    })
    .style('cursor', 'pointer')
    .on('click', function(event, d) {
      // Toggle selection
      if (selectedYear === d.year) {
        selectedYear = null; // Deselect
      } else {
        selectedYear = d.year; // Select new year
      }
      
      // Update display with new filters
      updateDisplay();
    })
    .each(function(d, i) {
      const li = d3.select(this);
      const color = colors(i);
      
      li.append('span')
        .attr('class', 'legend-swatch')
        .style('background-color', color);
      
      li.append('span')
        .text(`${d.year}: ${d.count}`);
    });
}

// Update both projects list and pie chart
function updateDisplay() {
  const filteredProjects = applyAllFilters();
  const projectsContainer = document.querySelector('.projects');
  const titleElement = document.getElementById('projects-title');
  
  if (projectsContainer) {
    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
    
    // Update title with project count
    if (titleElement) {
      titleElement.textContent = `${filteredProjects.length} Project${filteredProjects.length !== 1 ? 's' : ''}`;
    }
  }
}

// Main function to load and display projects
async function loadProjects() {
  try {
    // Fetch project data from JSON file
    const projects = await fetchJSON('../lib/projects.json');
    allProjects = projects;
    
    // Select the projects container and search input
    const projectsContainer = document.querySelector('.projects');
    const searchInput = document.getElementById('project-search');
    
    if (projectsContainer) {
      // Initial render
      updateDisplay();
      
      // Search functionality - update display when search query changes
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          updateDisplay();
        });
      }
    }
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadProjects);
