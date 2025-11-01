// Import required functions from global.js
import { fetchJSON, renderProjects } from '../global.js';

// Color scale for pie chart - using D3's category10 scheme (Lab 5 requirement)
const colors = d3.scaleOrdinal(d3.schemeCategory10);

// Store year-to-color mapping to ensure consistency
const yearColorMap = new Map();

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
  
  // Clear existing legend items but keep the container
  const legend = d3.select('#projects-legend');
  legend.selectAll('li').remove();
  
  // Group visible projects by year
  const yearCounts = d3.rollup(
    visibleProjects,
    (v) => v.length,
    (d) => d.year
  );
  
  // Convert to array format and assign colors to years
  const data = Array.from(yearCounts, ([year, count]) => ({
    year: year,
    count: count
  })).sort((a, b) => a.year.localeCompare(b.year));
  
  if (data.length === 0) {
    return; // No data to display
  }
  
  // Assign colors to each year and store in map (consistent across updates)
  data.forEach((d, i) => {
    if (!yearColorMap.has(d.year)) {
      yearColorMap.set(d.year, colors(i));
    }
  });
  
  // Get the color for selected year from the map
  const selectedColor = selectedYear ? yearColorMap.get(selectedYear) : null;
  
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
      // Otherwise use each year's stored color
      return yearColorMap.get(d.data.year) || colors(i);
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
  
  // Create legend - always keep original colors regardless of selection
  const legendItems = legend.selectAll('li')
    .data(data);
  
  const legendItemsEnter = legendItems.enter()
    .append('li')
    .attr('class', (d) => {
      return d.year === selectedYear ? 'selected' : '';
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
    });
  
  // Add swatch and text to new items - always use stored color for each year
  legendItemsEnter.each(function(d, i) {
    const li = d3.select(this);
    const originalColor = yearColorMap.get(d.year) || colors(i); // Use stored color for this year
    
    li.append('span')
      .attr('class', 'legend-swatch')
      .style('background-color', originalColor);
    
    li.append('span')
      .attr('class', 'legend-text')
      .text(`${d.year}: ${d.count}`);
  });
  
  // Update existing items (class for selected state, but keep original colors)
  legendItems.merge(legendItemsEnter)
    .attr('class', (d) => {
      return d.year === selectedYear ? 'selected' : '';
    })
    .each(function(d, i) {
      const li = d3.select(this);
      const originalColor = yearColorMap.get(d.year) || colors(i); // Always use stored color
      
      // Ensure swatch keeps original color (not affected by selection)
      const swatch = li.select('.legend-swatch');
      if (!swatch.empty()) {
        swatch.style('background-color', originalColor);
      }
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
    
    // Initialize year color mapping with all unique years from all projects
    const allYears = [...new Set(projects.map(p => p.year))].sort((a, b) => a.localeCompare(b));
    allYears.forEach((year, i) => {
      if (!yearColorMap.has(year)) {
        yearColorMap.set(year, colors(i));
      }
    });
    
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
