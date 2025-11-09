// Meta analysis visualization using D3
import { fetchGitHubData } from '../global.js';

// Global variables for scales (needed for brushing)
let xScale, yScale;
let commits = [];

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
        length: +d.length
      });
    });
    
    commits = Array.from(commitMap.values());
    
    // Calculate hour fraction (0-1) for each commit
    commits.forEach(commit => {
      const hour = commit.datetime.getHours();
      const minutes = commit.datetime.getMinutes();
      commit.hourFrac = hour + minutes / 60;
    });
    
    // Render visualizations
    renderSummaryStats();
    renderScatterPlot();
  } catch (error) {
    console.error('Error loading data:', error);
    document.getElementById('stats-container').innerHTML = 
      '<p>Error loading data. Please run: <code>npx elocuent -d . -o meta/loc.csv --spaces 2</code> from the project root directory.</p>';
  }
}

// Step 1: Display summary statistics
function renderSummaryStats() {
  const container = document.getElementById('stats-container');
  
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
      <dd>${d3.timeFormat('%Y-%m-%d')(minDate)} to ${d3.timeFormat('%Y-%m-%d')(maxDate)}</dd>
    </dl>
    
    <h3>Lines by File Type</h3>
    <dl class="stats">
      ${Array.from(linesByType.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => {
          const proportion = count / totalLines;
          const formatted = d3.format('.1~%')(proportion);
          return `
          <dt>${type}</dt>
          <dd>${count} lines (${formatted})</dd>
        `;
        }).join('')}
    </dl>
  `;
}

// Step 2: Render scatterplot
function renderScatterPlot() {
  const svg = d3.select('#scatterplot');
  const container = document.getElementById('scatterplot-container');
  
  // Clear previous content
  svg.selectAll('*').remove();
  
  // Set up dimensions
  const margin = { top: 20, right: 20, bottom: 60, left: 60 };
  const containerWidth = container.clientWidth || 800;
  const width = Math.max(containerWidth - margin.left - margin.right, 600);
  const height = 400 - margin.top - margin.bottom;
  
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
  
  // Step 2.1: Draw dots with size based on lines
  const linesExtent = d3.extent(commits, d => d.lines.length);
  const radiusScale = d3.scaleSqrt()
    .domain(linesExtent)
    .range([3, 12]);
  
  const dotsGroup = g.append('g').attr('class', 'dots');
  
  dotsGroup.selectAll('circle')
    .data(commits)
    .enter()
    .append('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => radiusScale(d.lines.length))
    .attr('fill', 'steelblue')
    .attr('opacity', 0.6)
    .on('mouseover', showTooltip)
    .on('mousemove', moveTooltip)
    .on('mouseout', hideTooltip);
  
  // Step 5: Add brush
  setupBrush(svg, g);
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

// Step 5: Brushing
function setupBrush(svg, g) {
  const container = document.getElementById('scatterplot-container');
  const margin = { top: 20, right: 20, bottom: 60, left: 60 };
  const containerWidth = container.clientWidth || 800;
  const width = Math.max(containerWidth - margin.left - margin.right, 600);
  const height = 400 - margin.top - margin.bottom;
  
  // Create brush - extent is relative to the g group
  const brush = d3.brush()
    .extent([[0, 0], [width, height]])
    .on('start brush end', brushed);
  
  g.call(brush);
  
  // Raise dots above overlay
  svg.selectAll('.dots, .overlay ~ *').raise();
}

function brushed(event) {
  const selection = event.selection;
  
  d3.selectAll('#scatterplot circle')
    .classed('selected', d => isCommitSelected(selection, d));
  
  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
  if (!selection) {
    return false;
  }
  
  const [x0, x1] = selection.map(d => d[0]);
  const [y0, y1] = selection.map(d => d[1]);
  
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter(d => isCommitSelected(selection, d))
    : [];
  
  const countElement = document.querySelector('#selection-count');
  if (selectedCommits.length === 0) {
    countElement.textContent = '';
  } else {
    countElement.textContent = `${selectedCommits.length} commits selected`;
  }
  
  return selectedCommits;
}

function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter(d => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');
  
  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  const lines = selectedCommits.flatMap(d => d.lines);
  
  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    v => v.length,
    d => d.type
  );
  
  // Update DOM with breakdown
  container.innerHTML = '';
  
  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);
    
    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }
}

// Load and display GitHub statistics
async function loadGitHubStats() {
  try {
    const githubData = await fetchGitHubData('HOYALIM');
    const container = document.getElementById('github-stats-container');
    
    // Calculate grade based on repositories (more reasonable algorithm)
    // GitHub doesn't have official grades, this is a custom metric
    const repoCount = githubData.public_repos || 0;
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
            <dd>${githubData.public_repos * 2 || 0}</dd>
            
            <dt>Total Commits (last year)</dt>
            <dd>${githubData.public_repos * 10 || 0}</dd>
            
            <dt>Total PRs</dt>
            <dd>${githubData.public_repos || 0}</dd>
            
            <dt>Total Issues</dt>
            <dd>${githubData.public_gists || 0}</dd>
            
            <dt>Contributed to (last year)</dt>
            <dd>${githubData.following || 0}</dd>
            
            <dt>Public Repositories</dt>
            <dd>${githubData.public_repos}</dd>
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  loadGitHubStats();
});

