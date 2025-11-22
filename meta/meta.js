// Meta analysis visualization using D3
import { fetchGitHubData } from '../global.js';

// Global variables for scales (needed for brushing)
let xScale, yScale;
let commits = [];
let timeScale;
let commitProgress = 100;
let commitMaxTime;
let filteredCommits = [];

// Step 1: Load and process CSV data
async function loadData() {
  try {
    // Load CSV data
    const data = await d3.csv('./loc.csv');
    
    // Process data: group by commit
    const commitMap = new Map();
    
    data.forEach(d => {
      const commitHash = d.commit;
      if (!commitMap.has(commitHash)) {
        commitMap.set(commitHash, {
          hash: commitHash,
          author: d.author,
          date: d.date,
          datetime: new Date(d.datetime),
          lines: []
        });
      }
      commitMap.get(commitHash).lines.push({
        file: d.file,
        type: d.type,
        length: +d.length,
        depth: +d.depth || 0
      });
    });
    
    commits = Array.from(commitMap.values());
    
    // Filter to 2025 data only (October 1 to November 21, 2025)
    const startDate = new Date('2025-10-01T00:00:00');
    const endDate = new Date('2025-11-21T23:59:59');
    commits = commits.filter(c => {
      const commitDate = c.datetime;
      return commitDate >= startDate && commitDate <= endDate;
    });
    
    // Sort commits by datetime (needed for Lab 8)
    commits.sort((a, b) => a.datetime - b.datetime);
    
    // Calculate hour fraction (0-1) for each commit
    commits.forEach(commit => {
      const hour = commit.datetime.getHours();
      const minutes = commit.datetime.getMinutes();
      commit.hourFrac = hour + minutes / 60;
      
      // Calculate total lines for each commit (for Lab 8)
      commit.totalLines = commit.lines.length;
      
      // Add commit URL (for Lab 8 scrollytelling)
      commit.url = `https://github.com/HOYALIM/portfolio/commit/${commit.hash}`;
    });
    
    // Create time scale for filtering
    timeScale = d3
      .scaleTime()
      .domain([
        d3.min(commits, (d) => d.datetime),
        d3.max(commits, (d) => d.datetime),
      ])
      .range([0, 100]);
    
    commitMaxTime = timeScale.invert(commitProgress);
    filteredCommits = commits;
    
    console.log('Data loaded:', {
      totalCommits: commits.length,
      filteredCommits: filteredCommits.length,
      dateRange: [d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)]
    });
    
    // Render visualizations
    renderSummaryStats();
    renderScatterPlot();
    renderUnitVisualization();
    
    // Initialize time slider
    setupTimeSlider();
    
    // Step 4 removed - files scrollytelling deleted
  } catch (error) {
    console.error('Error loading data:', error);
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer) {
      statsContainer.innerHTML = 
        '<p>Error loading data. Please run: <code>npx elocuent -d . -o meta/loc.csv --spaces 2</code> from the project root directory.</p>' +
        '<p>Error details: ' + error.message + '</p>';
    }
  }
}

// Step 1: Display summary statistics
function renderSummaryStats() {
  const container = document.getElementById('stats-container');
  if (!container) {
    console.error('stats-container not found');
    return;
  }
  
  if (commits.length === 0) {
    container.innerHTML = '<p>No commits data available</p>';
    return;
  }
  
  // Aggregate over whole dataset
  const totalLines = commits.reduce((sum, commit) => sum + commit.lines.length, 0);
  const totalFiles = new Set(commits.flatMap(c => c.lines.map(l => l.file))).size;
  const totalCommits = commits.length;
  
  // Number of distinct values
  const distinctAuthors = new Set(commits.map(c => c.author)).size;
  const distinctFileTypes = new Set(commits.flatMap(c => c.lines.map(l => l.type))).size;
  
  // Grouped aggregates (by file type)
  const linesByType = d3.rollup(
    commits.flatMap(c => c.lines),
    v => v.length,
    d => d.type
  );
  
  // Min/max dates
  const dates = commits.map(c => c.datetime);
  const minDate = d3.min(dates);
  const maxDate = d3.max(dates);
  
  container.innerHTML = `
    <dl class="stats">
      <dt>Total Commits</dt>
      <dd>${totalCommits}</dd>
      
      <dt>Total Lines</dt>
      <dd>${totalLines}</dd>
      
      <dt>Total Files</dt>
      <dd>${totalFiles}</dd>
      
      <dt>Distinct Authors</dt>
      <dd>${distinctAuthors}</dd>
      
      <dt>File Types</dt>
      <dd>${distinctFileTypes}</dd>
      
      <dt>Date Range</dt>
      <dd>2025-10-01 to 2025-11-21</dd>
    </dl>
    
    <h3>Lines by File Type</h3>
    <div class="file-types-inline">
      ${Array.from(linesByType.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => {
          const proportion = count / totalLines;
          const formatted = d3.format('.1~%')(proportion);
          return `<span class="file-type-badge">${type}: ${count} (${formatted})</span>`;
        }).join('')}
    </div>
  `;
}

// Step 2: Render scatterplot
function renderScatterPlot() {
  const svg = d3.select('#scatterplot');
  const container = document.getElementById('scatterplot-container');
  
  if (!container || svg.empty()) {
    console.error('scatterplot container or svg not found');
    return;
  }
  
  if (commits.length === 0) {
    console.warn('No commits to render');
    return;
  }
  
  // Clear previous content
  svg.selectAll('*').remove();
  
  // Set up dimensions - larger scatterplot
  const margin = { top: 20, right: 20, bottom: 60, left: 60 };
  const containerWidth = container.clientWidth || 1200;
  const width = Math.max(containerWidth - margin.left - margin.right, 1000);
  const height = 600 - margin.top - margin.bottom;
  
  svg.attr('width', width + margin.left + margin.right)
     .attr('height', height + margin.top + margin.bottom);
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Create scales
  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([0, width]);
  
  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([height, 0]);
  
  // Add axes
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%a %d')))
    .selectAll('text')
    .style('text-anchor', 'end')
    .attr('dx', '-.8em')
    .attr('dy', '.15em')
    .attr('transform', 'rotate(-45)');
  
  // Y-axis with time format (00:00, 02:00, etc.)
  g.append('g')
    .call(d3.axisLeft(yScale)
      .tickFormat(d => {
        const hours = Math.floor(d);
        return `${String(hours).padStart(2, '0')}:00`;
      })
    );
  
  // Add axis labels
  g.append('text')
    .attr('transform', `translate(${width / 2}, ${height + 50})`)
    .style('text-anchor', 'middle')
    .text('Date');
  
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -40)
    .attr('x', -height / 2)
    .style('text-anchor', 'middle')
    .text('Time of Day');
  
  // Step 2.3: Add horizontal grid lines
  g.append('g')
    .attr('class', 'grid')
    .call(d3.axisLeft(yScale)
      .tickSize(-width)
      .tickFormat('')
    )
    .selectAll('line')
    .attr('stroke', '#ccc')
    .attr('stroke-opacity', 0.3);
  
  // Step 2.1: Draw dots with size based on number of commits (each dot represents one commit)
  // Since each dot is one commit, we'll use a fixed size or scale by lines if needed
  // But user wants size based on commit count - each commit is one dot, so we'll use lines.length as proxy
  const linesExtent = d3.extent(commits, d => d.lines.length);
  const radiusScale = d3.scaleSqrt()
    .domain(linesExtent)
    .range([3, 12]);
  
  const dotsGroup = g.append('g').attr('class', 'dots');
  
  dotsGroup.selectAll('circle')
    .data(filteredCommits, d => d.hash)
    .enter()
    .append('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => radiusScale(d.lines.length))
    .attr('fill', 'steelblue')
    .attr('opacity', 0)
    .on('mouseover', showTooltip)
    .on('mousemove', moveTooltip)
    .on('mouseout', hideTooltip)
    .transition()
    .duration(500)
    .attr('opacity', 0.6);
  
  // Brush removed per user request - selection-info section deleted
}

// Step 3: Tooltip functions
function showTooltip(event, d) {
  const tooltip = d3.select('#tooltip');
  tooltip.style('display', 'block')
    .html(`
      <strong>Commit:</strong> ${d.hash.substring(0, 7)}<br>
      <strong>Author:</strong> ${d.author}<br>
      <strong>Date:</strong> ${d3.timeFormat('%Y-%m-%d %H:%M')(d.datetime)}<br>
      <strong>Lines:</strong> ${d.lines.length}
    `);
}

function moveTooltip(event) {
  const tooltip = d3.select('#tooltip');
  tooltip.style('left', (event.pageX + 10) + 'px')
    .style('top', (event.pageY - 10) + 'px');
}

function hideTooltip() {
  d3.select('#tooltip').style('display', 'none');
}

// Brush and selection functions removed per user request

// Load and display GitHub statistics
async function loadGitHubStats() {
  try {
    const githubData = await fetchGitHubData('HOYALIM');
    const container = document.getElementById('github-stats-container');
    
    // Use actual GitHub data from API
    // Based on https://github.com/HOYALIM?tab=overview
    const repoCount = githubData.public_repos || 16;
    const starsCount = 12; // From GitHub profile
    const followersCount = githubData.followers || 2;
    const followingCount = githubData.following || 9;
    const totalContributions = 119; // From GitHub profile: "119 contributions in the last year"
    const actualCommits = commits.length; // From elocuent data (filtered Oct-Nov 2025)
    
    // Calculate grade based on repositories
    let grade = 'F';
    if (repoCount >= 50) grade = 'A+';
    else if (repoCount >= 30) grade = 'A';
    else if (repoCount >= 20) grade = 'B+';
    else if (repoCount >= 10) grade = 'B';
    else if (repoCount >= 5) grade = 'C+';
    else if (repoCount >= 3) grade = 'C';
    else if (repoCount >= 1) grade = 'D';
    
    // Calculate percentage for circular progress (based on repos)
    const maxRepos = 50;
    const percentage = Math.min((repoCount / maxRepos) * 100, 100);
    
    container.innerHTML = `
      <div class="github-stats-layout">
        <div class="github-stats-list">
          <dl class="stats">
            <dt>Total Stars Earned</dt>
            <dd>${starsCount}</dd>
            
            <dt>Total Contributions (last year)</dt>
            <dd>${totalContributions}</dd>
            
            <dt>Total Commits (Oct-Nov 2025)</dt>
            <dd>${actualCommits}</dd>
            
            <dt>Public Repositories</dt>
            <dd>${repoCount}</dd>
            
            <dt>Followers</dt>
            <dd>${followersCount}</dd>
            
            <dt>Following</dt>
            <dd>${followingCount}</dd>
            
            <dt>GitHub Profile</dt>
            <dd><a href="https://github.com/HOYALIM" target="_blank">@HOYALIM</a></dd>
          </dl>
        </div>
        <div class="github-grade-container">
          <svg class="github-grade-circle" viewBox="0 0 120 120">
            <circle class="grade-circle-bg" cx="60" cy="60" r="50" fill="none" stroke="var(--border-color)" stroke-width="8"/>
            <circle class="grade-circle-progress" cx="60" cy="60" r="50" fill="none" 
                    stroke="var(--color-accent)" stroke-width="8" 
                    stroke-dasharray="${2 * Math.PI * 50}" 
                    stroke-dashoffset="${2 * Math.PI * 50 * (1 - percentage / 100)}"
                    stroke-linecap="round" transform="rotate(-90 60 60)"/>
            <text class="grade-text" x="60" y="70" text-anchor="middle" font-size="36" font-weight="bold" fill="var(--text-color)">${grade}</text>
          </svg>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading GitHub stats:', error);
    document.getElementById('github-stats-container').innerHTML = 
      '<p>Error loading GitHub statistics. Please check your connection.</p>';
  }
}

// Step 1.1 & 1.2: Time slider setup and filtering
function setupTimeSlider() {
  const slider = document.getElementById('commit-progress');
  if (!slider) return;
  
  slider.addEventListener('input', onTimeSliderChange);
  
  // Initialize on page load
  onTimeSliderChange();
}

function onTimeSliderChange() {
  const slider = document.getElementById('commit-progress');
  const timeDisplay = document.getElementById('commit-time');
  
  if (!slider || !timeDisplay) return;
  
  // Update commitProgress
  commitProgress = +slider.value;
  
  // Update commitMaxTime
  commitMaxTime = timeScale.invert(commitProgress);
  
  // Update time display
  timeDisplay.textContent = commitMaxTime.toLocaleString('en', {
    dateStyle: 'long',
    timeStyle: 'short'
  });
  timeDisplay.dateTime = commitMaxTime.toISOString();
  
  // Step 1.2: Filter commits
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
  
  console.log('Slider changed:', {
    commitProgress,
    commitMaxTime: commitMaxTime.toISOString(),
    totalCommits: commits.length,
    filteredCommits: filteredCommits.length
  });
  
  // Update scatter plot
  updateScatterPlot();
  
  // Update unit visualization
  renderUnitVisualization();
  
  // Update filtered stats
  renderFilteredStats();
}

// Step 1.3: Update scatter plot (instead of recreating)
function updateScatterPlot() {
  const svg = d3.select('#scatterplot');
  const g = svg.select('g');
  
  if (g.empty()) {
    // If no g element exists, render from scratch
    renderScatterPlot();
    return;
  }
  
  // Update x-axis domain if needed - larger scatterplot
  const container = document.getElementById('scatterplot-container');
  const margin = { top: 20, right: 20, bottom: 60, left: 60 };
  const containerWidth = container.clientWidth || 1200;
  const width = Math.max(containerWidth - margin.left - margin.right, 1000);
  const height = 600 - margin.top - margin.bottom;
  
  // Update x-axis
  xScale.domain(d3.extent(commits, d => d.datetime));
  g.select('g[transform*="translate(0,"]').call(
    d3.axisBottom(xScale).tickFormat(d3.timeFormat('%a %d'))
  );
  
  // Update dots
  const linesExtent = d3.extent(commits, d => d.lines.length);
  const radiusScale = d3.scaleSqrt()
    .domain(linesExtent)
    .range([3, 12]);
  
  const dotsGroup = g.select('.dots');
  const circles = dotsGroup.selectAll('circle')
    .data(filteredCommits, d => d.hash);
  
  // Remove circles that are no longer in filteredCommits
  circles.exit().remove();
  
  // Add new circles
  const circlesEnter = circles.enter()
    .append('circle')
    .attr('fill', 'steelblue')
    .attr('opacity', 0)
    .on('mouseover', showTooltip)
    .on('mousemove', moveTooltip)
    .on('mouseout', hideTooltip);
  
  // Update all circles (existing + new)
  // Size based on number of lines in commit (represents commit size/complexity)
  circles.merge(circlesEnter)
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => radiusScale(d.lines.length))
    .transition()
    .duration(300)
    .attr('opacity', 0.6);
  
  // Step 1.4: Entry transitions for new circles
  circlesEnter
    .transition()
    .duration(500)
    .attr('opacity', 0.6);
}

// Render filtered stats (for display between unit viz and scatterplot)
function renderFilteredStats() {
  const container = document.getElementById('filtered-stats');
  if (!container) return;
  
  const totalLines = filteredCommits.reduce((sum, commit) => sum + commit.lines.length, 0);
  const totalFiles = new Set(filteredCommits.flatMap(c => c.lines.map(l => l.file))).size;
  const totalCommits = filteredCommits.length;
  const maxDepth = d3.max(filteredCommits.flatMap(c => c.lines.map(l => l.depth || 0)));
  const longestLine = d3.max(filteredCommits.flatMap(c => c.lines.map(l => l.length || 0)));
  const maxLines = d3.max(d3.rollup(
    filteredCommits.flatMap(c => c.lines),
    v => v.length,
    d => d.file
  ).values()) || 0;
  
  container.innerHTML = `
    <div class="selection-stats">
      <div class="stat-item">
        <span class="stat-label">COMMITS:</span>
        <span class="stat-value">${totalCommits}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">FILES:</span>
        <span class="stat-value">${totalFiles}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">TOTAL LOC:</span>
        <span class="stat-value">${totalLines}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">MAX DEPTH:</span>
        <span class="stat-value">${maxDepth}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">LONGEST LINE:</span>
        <span class="stat-value">${longestLine}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">MAX LINES:</span>
        <span class="stat-value">${maxLines}</span>
      </div>
    </div>
  `;
}

// Step 2: Unit Visualization
function renderUnitVisualization() {
  // Step 2: Render in scatterplot section (for slider updates)
  const containerStep2 = d3.select('#files-step2');
  // Step 4: Render in files section (for scrollytelling)
  const containerStep4 = d3.select('#files');
  
  // Update Step 2 visualization (for slider)
  if (!containerStep2.empty()) {
    containerStep2.selectAll('*').remove();
    renderUnitVizToContainer(containerStep2);
  }
  
  // Update Step 4 visualization (for scrollytelling)
  if (!containerStep4.empty()) {
    containerStep4.selectAll('*').remove();
    renderUnitVizToContainer(containerStep4);
  }
}

function renderUnitVizToContainer(container) {
  
  // Get all lines from filtered commits
  const lines = filteredCommits.flatMap(d => d.lines);
  
  console.log('Rendering unit visualization:', {
    filteredCommits: filteredCommits.length,
    totalLines: lines.length,
    files: new Set(lines.map(l => l.file)).size
  });
  
  if (lines.length === 0) {
    console.warn('No lines to visualize');
    container.html('<p style="color: var(--text-color); padding: 1em;">No commits selected for this time period.</p>');
    return;
  }
  
  // Step 2.3: Group by file and sort by number of lines (descending)
  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, fileLines]) => {
      return { name, lines: fileLines };
    })
    .sort((a, b) => b.lines.length - a.lines.length);
  
  // Step 2.4: Create color scale for technologies
  const colors = d3.scaleOrdinal(d3.schemeTableau10);
  
  // Create dl structure for files
  const dl = container.append('dl').attr('class', 'files-list');
  
  // Create dt/dd pairs for each file
  const fileItems = dl.selectAll('div')
    .data(files)
    .enter()
    .append('div')
    .attr('class', 'file-item');
  
  fileItems.append('dt')
    .text(d => d.name);
  
  const fileDots = fileItems.append('dd')
    .selectAll('span.loc')
    .data(d => d.lines)
    .enter()
    .append('span')
    .attr('class', 'loc')
    .attr('style', (d) => `--color: ${colors(d.type)}`);
}

// Step 4 removed - files scrollytelling deleted per user request

// Scrollytelling removed per user request

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  loadGitHubStats();
});

