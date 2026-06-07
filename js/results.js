/* ==========================================
   Tata College Student Hub - Results Module
   Supports Results Selection Hub & Specific Exam Results Dashboards
   ========================================== */

import { showToast } from './app.js';

// Module-level state variables
let currentResultsDataset = [];
let datasetsMetadata = [];
let announcementsData = null;
let selectedMajor = 'All';

// Radar chart instance reference (for cleanup)
let comparisonChart = null;

/**
 * Main Coordinator for Results View
 * @param {HTMLElement} container - Page content mount element
 * @param {Object} queryParams - Query parameters from SPA router
 */
export async function initResultsView(container, queryParams) {
  // Load result dataset registry first
  await loadResultsRegistry();

  const examId = queryParams ? queryParams.exam : null;
  const dataset = examId ? datasetsMetadata.find(d => d.id === examId) : null;

  if (dataset) {
    // Render specific exam search and stats dashboard
    await renderExamDashboard(container, dataset);
  } else {
    // Render main Results Selection Hub landing page
    renderResultsHub(container);
  }
}

// ========== CONFIG & REGISTRY LOADING ==========

async function loadResultsRegistry() {
  if (!announcementsData || datasetsMetadata.length === 0) {
    try {
      const res = await fetch('data/results.json');
      const data = await res.json();
      announcementsData = data;
      datasetsMetadata = data.datasets || [];
    } catch (err) {
      console.error("Error loading results config: ", err);
      showToast("Failed to load results configuration.", "error");
    }
  }
}

// ========== VIEW RENDERING: RESULTS HUB ==========

function renderResultsHub(container) {
  // Build selections grid HTML
  let cardsHtml = '';
  if (datasetsMetadata.length === 0) {
    cardsHtml = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 40px;">
        <i data-lucide="alert-circle" style="width: 48px; height: 48px; color: var(--text-muted); margin: 0 auto 12px auto;"></i>
        <p>No result dashboards are currently available.</p>
      </div>
    `;
  } else {
    cardsHtml = datasetsMetadata.map(d => `
      <div class="results-card-select" data-exam="${d.id}">
        <div class="results-card-header">
          <div class="results-card-icon">
            <i data-lucide="award"></i>
          </div>
          <span class="results-card-badge">${d.status}</span>
        </div>
        <h3 class="results-card-title">${d.title}</h3>
        <p class="results-card-batch">${d.batch}</p>
        <div class="results-card-meta">
          <span><i data-lucide="calendar"></i> ${d.date}</span>
          <span><i data-lucide="globe"></i> ${d.university}</span>
        </div>
        <div class="results-card-action-btn">
          <span>Open Dashboard</span>
          <i data-lucide="arrow-right"></i>
        </div>
      </div>
    `).join('');
  }

  container.innerHTML = `
    <div class="animated-slide-up">
      <div class="page-title-section">
        <div>
          <h2 class="page-title">Results &amp; Analysis Hub</h2>
          <p class="page-subtitle">Select an examination batch to search results and view dashboards.</p>
        </div>
      </div>

      <!-- Selection Cards Grid -->
      <div class="results-hub-grid">
        ${cardsHtml}
      </div>

      <!-- Declared Results & Alerts -->
      <div class="card" style="margin-bottom: 32px;">
        <h3 class="section-title" style="margin-bottom: 16px;">
          <i data-lucide="bell" style="color: var(--success);"></i> Declared Results &amp; Alerts
        </h3>
        <div class="styled-table-wrapper" style="overflow-x: auto;">
          <table class="styled-table">
            <thead>
              <tr>
                <th>Result Announcement</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="results-table-body">
              <tr>
                <td colspan="4" style="text-align: center; color: var(--text-secondary);">Loading result info...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Render announcements table contents
  renderAnnouncementsTable();

  // Attach card click handlers to update the router hash
  container.querySelectorAll('.results-card-select').forEach(card => {
    card.addEventListener('click', () => {
      const examId = card.getAttribute('data-exam');
      window.location.hash = `#results?exam=${examId}`;
    });
  });

  lucide.createIcons();
}

// ========== VIEW RENDERING: EXAM DASHBOARD ==========

async function renderExamDashboard(container, dataset) {
  // Load specific exam marks dataset dynamically
  try {
    const res = await fetch(`data/${dataset.file}`);
    currentResultsDataset = await res.json();
  } catch (err) {
    console.error("Error loading results file: ", err);
    showToast("Failed to load results dataset.", "error");
    // Fall back to selection hub
    renderResultsHub(container);
    return;
  }

  // Clear any existing Chart.js instances to avoid canvas issues
  if (comparisonChart) {
    comparisonChart.destroy();
    comparisonChart = null;
  }

  // Classify student majors
  currentResultsDataset.forEach(s => {
    s.major = getStudentMajor(s);
  });

  // Check if we have multiple majors
  const distinctMajors = [...new Set(currentResultsDataset.map(s => s.major))].filter(m => m !== 'Unknown');
  selectedMajor = 'All';

  container.innerHTML = `
    <div class="animated-slide-up">
      <!-- Back to hub action button -->
      <button class="results-back-btn" id="results-back-hub-btn">
        <i data-lucide="arrow-left"></i>
        <span>Back to Results Hub</span>
      </button>

      <div class="page-title-section" style="margin-top: 8px;">
        <div>
          <h2 class="page-title">${dataset.title}</h2>
          <p class="page-subtitle">${dataset.batch} — ${dataset.university}</p>
        </div>
      </div>

      <!-- Filters Section -->
      <div id="results-filter-container"></div>

      <!-- Stats Cards -->
      <div id="results-stats-container"></div>

      <!-- ============================== -->
      <!--     ROLL NUMBER SEARCH  (TOP)  -->
      <!-- ============================== -->
      <div class="card results-search-section" id="results-search-section" style="margin-bottom: 32px;">
        <h3 class="section-title" style="margin-bottom: 6px;">
          <i data-lucide="search" style="color: var(--primary);"></i> Search Student Result
        </h3>
        <p class="results-section-desc">Enter your roll number or student name to view detailed marks cards.</p>
        
        <div class="results-search-bar" id="results-search-bar" style="position: relative; flex-wrap: wrap;">
          <div class="results-input-wrapper" style="position: relative; flex: 1; min-width: 200px;">
            <i data-lucide="search" class="results-input-icon"></i>
            <input type="text" id="result-search-input" placeholder="Type Roll Number or Name..." autocomplete="off" />
            <div id="results-search-suggestions" class="results-search-suggestions hidden"></div>
          </div>
          <button class="primary-btn results-search-btn" id="result-search-btn">
            <i data-lucide="search"></i>
            <span>Search</span>
          </button>
          <button class="secondary-btn" id="result-browse-all-btn" style="flex-shrink: 0;" title="Browse all student marks">
            <i data-lucide="users"></i>
            <span>Browse All</span>
          </button>
        </div>

        <!-- Search result card rendered here -->
        <div id="result-search-output"></div>
      </div>

      <!-- ================================================ -->
      <!--  LEADERBOARD + TOPPERS — SIDE BY SIDE ON DESKTOP -->
      <!-- ================================================ -->
      <div class="results-leaderboard-toppers-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; align-items: start;">

        <!-- BATCH LEADERBOARD -->
        <div class="card results-leaderboard-section" id="results-leaderboard-section" style="margin-bottom: 0; height: 100%;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <h3 class="section-title" style="margin-bottom: 0;">
              <i data-lucide="trophy" style="color: var(--warning);"></i> Batch Leaderboard
            </h3>
            <div class="leaderboard-sort-container" style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">Sort By:</span>
              <select id="leaderboard-sort-select" style="padding: 6px 12px; border-radius: var(--radius-md); background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 0.8rem; font-weight: 600; outline: none; cursor: pointer;">
                <option value="grand_total">Grand Total (Overall)</option>
              </select>
            </div>
          </div>
          <p class="results-section-desc" id="leaderboard-desc" style="margin-top: 6px; margin-bottom: 6px;">Top 10 students by Grand Total in this semester exam.</p>
          
          <div class="styled-table-wrapper" style="overflow-x: auto; margin-top: 16px;">
            <table class="styled-table results-leaderboard-table" id="leaderboard-table">
              <thead>
                <tr id="leaderboard-headers">
                  <th>Rank</th>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Grand Total</th>
                </tr>
              </thead>
              <tbody id="leaderboard-table-body">
                <tr>
                  <td colspan="4" style="text-align: center; color: var(--text-secondary);">Loading leaderboard...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SUBJECT TOPPERS (right column) -->
        <div id="results-toppers-container"></div>

      </div>

      <!-- ============================== -->
      <!--   HEAD-TO-HEAD COMPARISON      -->
      <!-- ============================== -->
      <div class="card results-compare-section" id="results-compare-section">
        <h3 class="section-title" style="margin-bottom: 6px;">
          <i data-lucide="git-compare" style="color: var(--info);"></i> Compare Students
        </h3>
        <p class="results-section-desc">Enter two roll numbers or student names to compare marks side by side with a radar chart.</p>

        <div class="results-compare-inputs" id="results-compare-inputs">
          <div class="results-input-wrapper" style="position: relative;">
            <i data-lucide="user" class="results-input-icon"></i>
            <input type="text" id="compare-roll-1" placeholder="Roll Number or Name 1" autocomplete="off" />
            <div id="compare-suggestions-1" class="results-search-suggestions hidden"></div>
          </div>
          <div class="results-vs-badge">VS</div>
          <div class="results-input-wrapper" style="position: relative;">
            <i data-lucide="user" class="results-input-icon"></i>
            <input type="text" id="compare-roll-2" placeholder="Roll Number or Name 2" autocomplete="off" />
            <div id="compare-suggestions-2" class="results-search-suggestions hidden"></div>
          </div>
          <button class="primary-btn results-search-btn" id="compare-btn">
            <i data-lucide="bar-chart-3"></i>
            <span>Compare</span>
          </button>
        </div>

        <!-- Comparison output rendered here -->
        <div id="compare-output"></div>
      </div>
    </div>
  `;

  // Bind back to hub button action
  container.querySelector('#results-back-hub-btn').addEventListener('click', () => {
    window.location.hash = '#results';
  });

  // Render Major Filter Select Dropdown if multi-major dataset
  const filterContainer = container.querySelector('#results-filter-container');
  if (filterContainer && distinctMajors.length > 1) {
    filterContainer.innerHTML = `
      <div class="results-filter-bar animated-slide-up">
        <div class="results-filter-group">
          <span class="results-filter-label"><i data-lucide="filter" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;"></i> Filter Major:</span>
          <select id="results-major-filter-select" class="results-filter-select">
            <option value="All">All Majors (${currentResultsDataset.length} Students)</option>
            ${distinctMajors.map(m => {
              const count = currentResultsDataset.filter(s => s.major === m).length;
              return `<option value="${m}">${m} Major (${count})</option>`;
            }).join('')}
          </select>
        </div>
      </div>
    `;

    const majorSelect = filterContainer.querySelector('#results-major-filter-select');
    majorSelect.addEventListener('change', (e) => {
      selectedMajor = e.target.value;
      updateDashboardData(container);
    });
  }

  // Initial dashboard load
  updateDashboardData(container);

  // Setup Leaderboard sort selector change handler
  const sortSelect = container.querySelector('#leaderboard-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      renderLeaderboard(e.target.value);
    });
  }

  // Bind search handlers
  bindSearchHandlers(container);

  // Bind comparison handlers
  bindCompareHandlers(container);

  lucide.createIcons();
}

// ========== ANNOUNCEMENTS TABLE ==========

function renderAnnouncementsTable() {
  const tbody = document.getElementById('results-table-body');
  if (!tbody || !announcementsData) return;

  tbody.innerHTML = announcementsData.announcements.map(res => `
    <tr>
      <td style="font-weight: 600;">${res.title}</td>
      <td style="color: var(--text-secondary); font-size: 0.85rem;">${res.date}</td>
      <td>
        <span class="badge-status ${res.status === 'Declared' ? 'declared' : 'pending'}">${res.status}</span>
      </td>
      <td>
        ${res.status === 'Declared' 
          ? `<a href="${res.link}" target="_blank" rel="noopener" class="primary-btn btn-icon-only" style="width: 28px; height: 28px; font-size: 0.8rem;" title="View Marksheet"><i data-lucide="external-link" style="width: 12px; height: 12px;"></i></a>` 
          : `<span style="font-size: 0.8rem; color: var(--text-muted);">Exams Pending</span>`}
      </td>
    </tr>
  `).join('');

  lucide.createIcons();
}

// ========== SEARCH & AUTOCOMPLETE LOGIC ==========

function bindSearchHandlers(container) {
  const searchBtn = container.querySelector('#result-search-btn');
  const searchInput = container.querySelector('#result-search-input');
  const suggestionsDiv = container.querySelector('#results-search-suggestions');
  const browseBtn = container.querySelector('#result-browse-all-btn');

  if (searchBtn) {
    searchBtn.addEventListener('click', () => performSearch());
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (suggestionsDiv) suggestionsDiv.classList.add('hidden');
        performSearch();
      }
    });

    // Autocomplete text listener
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.toLowerCase().trim();
      if (!suggestionsDiv) return;

      if (val.length < 1) {
        suggestionsDiv.classList.add('hidden');
        suggestionsDiv.innerHTML = '';
        return;
      }

      // Filter matches by name, roll number, and selected major filter
      const matches = currentResultsDataset.filter(s => {
        const matchesMajor = selectedMajor === 'All' || s.major === selectedMajor;
        const matchesQuery = s.roll_number.includes(val) || s.student_name.toLowerCase().includes(val);
        return matchesMajor && matchesQuery;
      }).slice(0, 6);

      if (matches.length === 0) {
        suggestionsDiv.classList.add('hidden');
        suggestionsDiv.innerHTML = '';
        return;
      }

      suggestionsDiv.innerHTML = matches.map(s => `
        <div class="results-suggestion-item" data-roll="${s.roll_number}">
          <span class="suggestion-name">${s.student_name}</span>
          <span class="suggestion-roll">${s.roll_number}</span>
        </div>
      `).join('');

      suggestionsDiv.classList.remove('hidden');

      // Bind clicks on suggestions list
      suggestionsDiv.querySelectorAll('.results-suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          const roll = item.getAttribute('data-roll');
          searchInput.value = roll;
          suggestionsDiv.classList.add('hidden');
          performSearch();
        });
      });
    });
  }

  // Dismiss autocomplete dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (searchInput && suggestionsDiv && !searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
      suggestionsDiv.classList.add('hidden');
    }
  });

  // Bind Browse All button
  if (browseBtn) {
    browseBtn.addEventListener('click', () => openBrowseAllModal());
  }
}

function performSearch() {
  const input = document.getElementById('result-search-input');
  const output = document.getElementById('result-search-output');
  if (!input || !output) return;

  const query = input.value.trim().toLowerCase();

  if (!query) {
    showToast("Please enter a roll number or name.", "warning");
    return;
  }

  // Match by roll number or exact name, or fallback to fuzzy name includes
  const student = currentResultsDataset.find(s => 
    s.roll_number === query || 
    s.student_name.toLowerCase() === query ||
    s.student_name.toLowerCase().includes(query)
  );

  if (!student) {
    output.innerHTML = `
      <div class="results-error-card animated-slide-up">
        <div class="results-error-icon">
          <i data-lucide="user-x"></i>
        </div>
        <h4>Student Not Found</h4>
        <p>No student matching <strong>"${escapeHtml(query)}"</strong> was found. Please check spelling or roll number.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  renderStudentCard(output, student);
}

// ========== BROWSE ALL MODAL ==========

function openBrowseAllModal() {
  const modal = document.getElementById('universal-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  if (!modal || !title || !body) return;

  title.textContent = "Browse All Student Results";

  // Push dummy state in history so back button closes the modal
  history.pushState({ modalOpen: true }, '');

  const handleModalBack = () => {
    modal.classList.add('hidden');
  };
  window.addEventListener('popstate', handleModalBack, { once: true });

  // Filter dataset by major
  const filteredData = selectedMajor === 'All'
    ? currentResultsDataset
    : currentResultsDataset.filter(s => s.major === selectedMajor);

  // Sort by total descending (ranks)
  const sorted = [...filteredData].sort((a, b) => b.grand_total - a.grand_total);

  // Render modal content
  const renderRows = (dataList) => {
    return dataList.map(s => {
      const rank = sorted.findIndex(item => item.roll_number === s.roll_number) + 1;
      const isPass = s.result === 'Pass';
      const rankBadge = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
      return `
        <tr class="browse-results-row" data-roll="${s.roll_number}">
          <td style="font-weight: 800; text-align: center; font-size: 0.85rem;">${rankBadge}</td>
          <td style="font-weight: 600; font-size: 0.85rem;">
            ${s.student_name}
            <span style="display: block; font-size: 0.68rem; color: var(--text-muted); font-weight: 500; margin-top: 2px;">Major: ${s.major}</span>
          </td>
          <td style="font-family: monospace; font-size: 0.78rem; color: var(--text-secondary);">${s.roll_number}</td>
          <td style="font-weight: 700; text-align: center; color: var(--primary); font-size: 0.85rem;">${s.grand_total}</td>
          <td style="text-align: center;">
            <span class="badge-status ${isPass ? 'declared' : 'pending'}" style="font-size: 0.68rem; padding: 2px 6px;">${s.result}</span>
          </td>
        </tr>
      `;
    }).join('');
  };

  body.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <p class="text-secondary" style="font-size: 0.82rem; line-height: 1.4; margin-bottom: 2px;">
        Click on any student row below to load their detailed marks card dashboard.
      </p>
      
      <input type="text" id="modal-browse-search" class="browse-results-filter" placeholder="Search by name or roll number..." autocomplete="off">
      
      <div class="browse-results-table-wrapper">
        <table class="styled-table" style="margin: 0; min-width: 100%;">
          <thead>
            <tr>
              <th style="width: 55px; text-align: center; font-size: 0.75rem;">Rank</th>
              <th style="font-size: 0.75rem;">Student Name</th>
              <th style="font-size: 0.75rem;">Roll Number</th>
              <th style="width: 70px; text-align: center; font-size: 0.75rem;">Total</th>
              <th style="width: 75px; text-align: center; font-size: 0.75rem;">Result</th>
            </tr>
          </thead>
          <tbody id="browse-modal-table-body">
            ${renderRows(sorted)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  lucide.createIcons();
  modal.classList.remove('hidden');

  // Helper function to bind click events to table rows
  const bindRowClicks = () => {
    body.querySelectorAll('.browse-results-row').forEach(row => {
      row.addEventListener('click', () => {
        const roll = row.getAttribute('data-roll');
        const searchInput = document.getElementById('result-search-input');
        if (searchInput) {
          searchInput.value = roll;
          modal.classList.add('hidden');
          // Revert dummy history state
          if (history.state && history.state.modalOpen) {
            history.back();
          }
          window.removeEventListener('popstate', handleModalBack);
          performSearch();
          // Scroll dynamically to the search output
          const searchSection = document.getElementById('results-search-section');
          if (searchSection) searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  };

  bindRowClicks();

  // Search input inside browse all modal
  const modalSearch = body.querySelector('#modal-browse-search');
  const tableBody = body.querySelector('#browse-modal-table-body');

  if (modalSearch && tableBody) {
    modalSearch.focus();
    modalSearch.addEventListener('input', (e) => {
      const val = e.target.value.toLowerCase().trim();
      const filtered = sorted.filter(s => 
        s.student_name.toLowerCase().includes(val) || 
        s.roll_number.includes(val)
      );

      if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 24px;">No student results match "${escapeHtml(e.target.value)}".</td></tr>`;
      } else {
        tableBody.innerHTML = renderRows(filtered);
        bindRowClicks();
      }
    });
  }
}

// ========== STUDENT MARKS CARD RENDER ==========

function renderStudentCard(container, student) {
  const subjects = student.subjects;
  const isPass = student.result === 'Pass';
  const statusClass = isPass ? 'pass' : 'promoted';
  const statusLabel = student.result;

  // Build desktop subject rows
  let subjectRows = '';
  // Build mobile stacked cards subject content
  let mobileSubjectRows = '';

  for (const [key, sub] of Object.entries(subjects)) {
    const subjectName = cleanSubjectName(sub.subject);
    const theory = sub.theory !== null && sub.theory !== undefined ? sub.theory : '-';
    const internal = sub.internal !== null && sub.internal !== undefined ? sub.internal : '-';
    const practical = sub.practical !== null && sub.practical !== undefined ? sub.practical : '-';
    const total = sub.total !== null && sub.total !== undefined ? sub.total : '-';

    // Desktop table row structure
    subjectRows += `
      <tr>
        <td class="subject-name-cell">${subjectName}</td>
        <td class="mark-cell">${theory}</td>
        <td class="mark-cell">${internal}</td>
        <td class="mark-cell">${practical}</td>
        <td class="mark-cell mark-total">${total}</td>
      </tr>
    `;

    // Mobile block structure
    mobileSubjectRows += `
      <div class="results-mobile-mark-row">
        <div class="res-mob-subject-title">${subjectName}</div>
        <div class="res-mob-marks-grid">
          <div class="res-mob-mark-item">
            <span class="label">Theory</span>
            <span class="value">${theory}</span>
          </div>
          <div class="res-mob-mark-item">
            <span class="label">Internal</span>
            <span class="value">${internal}</span>
          </div>
          <div class="res-mob-mark-item">
            <span class="label">Practical</span>
            <span class="value">${practical}</span>
          </div>
          <div class="res-mob-mark-item highlight">
            <span class="label">Total Marks</span>
            <span class="value">${total}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Calculate student rank relative to dataset
  const sorted = [...currentResultsDataset].sort((a, b) => b.grand_total - a.grand_total);
  const rank = sorted.findIndex(s => s.roll_number === student.roll_number) + 1;

  container.innerHTML = `
    <div class="results-student-card animated-slide-up" style="margin-top: 24px;">
      <div class="results-student-header">
        <div class="results-student-avatar">
          ${student.student_name.charAt(0)}
        </div>
        <div class="results-student-info">
          <h3 class="results-student-name">${student.student_name}</h3>
          <div class="results-student-meta">
            <span><i data-lucide="hash"></i> ${student.roll_number}</span>
            <span><i data-lucide="bar-chart-2"></i> Rank #${rank} of ${currentResultsDataset.length}</span>
          </div>
        </div>
        <div class="results-student-status ${statusClass}">
          <i data-lucide="${isPass ? 'check-circle' : 'alert-circle'}"></i>
          <span>${statusLabel}</span>
        </div>
      </div>

      <div class="results-student-stats">
        <div class="results-stat-pill">
          <span class="results-stat-label">Grand Total</span>
          <span class="results-stat-value">${student.grand_total}</span>
        </div>
        <div class="results-stat-pill">
          <span class="results-stat-label">Subjects</span>
          <span class="results-stat-value">${Object.keys(subjects).length}</span>
        </div>
        <div class="results-stat-pill">
          <span class="results-stat-label">Batch Rank</span>
          <span class="results-stat-value">#${rank}</span>
        </div>
      </div>

      <!-- DESKTOP MODE: Traditional Marks Table -->
      <div class="results-marks-table-wrapper desktop-marks-view">
        <table class="results-marks-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Theory</th>
              <th>Internal</th>
              <th>Practical</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${subjectRows}
          </tbody>
          <tfoot>
            <tr>
              <td class="subject-name-cell" style="font-weight: 800;">Grand Total</td>
              <td></td>
              <td></td>
              <td></td>
              <td class="mark-cell mark-total mark-grand">${student.grand_total}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- MOBILE MODE: Mobile Friendly Stacked Cards list (Overflow scroll solved) -->
      <div class="results-mobile-marks-list mobile-marks-view">
        ${mobileSubjectRows}
        <div class="results-mobile-mark-row" style="background: var(--primary-glow); border-color: var(--border-color-focus);">
          <div class="res-mob-marks-grid" style="grid-template-columns: 1fr;">
            <div class="res-mob-mark-item highlight" style="background: transparent; border: none; padding: 0; display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <span class="label" style="font-size: 0.95rem; font-weight: 700;">Grand Total</span>
              <span class="value" style="font-size: 1.2rem; font-weight: 800;">${student.grand_total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();
}

// ========== LEADERBOARD RENDERING ==========

function renderLeaderboard(sortBy = 'grand_total') {
  const tbody = document.getElementById('leaderboard-table-body');
  const headers = document.getElementById('leaderboard-headers');
  const desc = document.getElementById('leaderboard-desc');
  if (!tbody || currentResultsDataset.length === 0) return;

  // Filter dataset by major
  const filteredData = selectedMajor === 'All'
    ? currentResultsDataset
    : currentResultsDataset.filter(s => s.major === selectedMajor);

  if (filteredData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No leaderboard entries match filters.</td></tr>`;
    return;
  }

  // Determine sorted list
  let sorted = [];
  if (sortBy === 'grand_total') {
    sorted = [...filteredData].sort((a, b) => b.grand_total - a.grand_total);
    if (desc) desc.textContent = "Top 10 students by Grand Total in this semester exam.";
    if (headers) {
      headers.innerHTML = `
        <th>Rank</th>
        <th>Student Name</th>
        <th>Roll Number</th>
        <th>Grand Total</th>
      `;
    }
  } else {
    sorted = [...filteredData].sort((a, b) => {
      const t1 = a.subjects[sortBy]?.total ?? 0;
      const t2 = b.subjects[sortBy]?.total ?? 0;
      return t2 - t1;
    });

    const firstStudent = filteredData[0];
    const subName = cleanSubjectName(firstStudent?.subjects[sortBy]?.subject);
    if (desc) desc.textContent = `Top 10 students sorted by marks in ${subName || 'Subject'}.`;
    if (headers) {
      headers.innerHTML = `
        <th>Rank</th>
        <th>Student Name</th>
        <th>Roll Number</th>
        <th>${subName || 'Subject'} Marks</th>
      `;
    }
  }

  const top10 = sorted.slice(0, 10);

  tbody.innerHTML = top10.map((student, index) => {
    const rank = index + 1;
    let medalIcon = '';
    let rankClass = '';
    
    if (rank === 1) { medalIcon = '🥇'; rankClass = 'rank-gold'; }
    else if (rank === 2) { medalIcon = '🥈'; rankClass = 'rank-silver'; }
    else if (rank === 3) { medalIcon = '🥉'; rankClass = 'rank-bronze'; }

    const val = sortBy === 'grand_total' 
      ? student.grand_total 
      : (student.subjects[sortBy]?.total ?? '-');
      
    const subVal = sortBy === 'grand_total' 
      ? '' 
      : `<span style="display: block; font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; font-weight: 500;">Overall: ${student.grand_total}</span>`;

    return `
      <tr class="leaderboard-row ${rankClass}" data-roll="${student.roll_number}">
        <td>
          <span class="leaderboard-rank">${medalIcon || rank}</span>
        </td>
        <td>
          <div class="leaderboard-student-cell">
            <div class="leaderboard-avatar">${student.student_name.charAt(0)}</div>
            <div class="leaderboard-name-wrapper">
              <span class="leaderboard-name">${student.student_name}</span>
              <span class="leaderboard-roll-sub">${student.roll_number}</span>
            </div>
          </div>
        </td>
        <td style="font-family: monospace; font-size: 0.85rem; color: var(--text-secondary);">${student.roll_number}</td>
        <td>
          <span class="leaderboard-total">${val}</span>
          ${subVal}
        </td>
      </tr>
    `;
  }).join('');

  // Make leaderboard rows clickable to view student's marks immediately
  tbody.querySelectorAll('.leaderboard-row').forEach(row => {
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => {
      const roll = row.getAttribute('data-roll');
      const searchInput = document.getElementById('result-search-input');
      if (searchInput) {
        searchInput.value = roll;
        performSearch();
        // Scroll to search container
        const searchSection = document.getElementById('results-search-section');
        if (searchSection) searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ========== HEAD-TO-HEAD COMPARISON ==========

function bindCompareHandlers(container) {
  const compareBtn = container.querySelector('#compare-btn');

  if (compareBtn) {
    compareBtn.addEventListener('click', () => performComparison());
  }

  const input1 = container.querySelector('#compare-roll-1');
  const input2 = container.querySelector('#compare-roll-2');
  const suggestions1 = container.querySelector('#compare-suggestions-1');
  const suggestions2 = container.querySelector('#compare-suggestions-2');

  // Helper: build and bind autocomplete suggestions for a compare input
  function bindCompareSuggestions(inputEl, suggestionsEl, otherInputEl) {
    if (!inputEl || !suggestionsEl) return;

    inputEl.addEventListener('input', (e) => {
      const val = e.target.value.toLowerCase().trim();
      if (val.length < 1) {
        suggestionsEl.classList.add('hidden');
        suggestionsEl.innerHTML = '';
        return;
      }

      const matches = currentResultsDataset.filter(s => {
        const matchesMajor = selectedMajor === 'All' || s.major === selectedMajor;
        const matchesQuery = s.roll_number.toLowerCase().includes(val) || s.student_name.toLowerCase().includes(val);
        return matchesMajor && matchesQuery;
      }).slice(0, 6);

      if (matches.length === 0) {
        suggestionsEl.classList.add('hidden');
        suggestionsEl.innerHTML = '';
        return;
      }

      suggestionsEl.innerHTML = matches.map(s => `
        <div class="results-suggestion-item" data-roll="${s.roll_number}">
          <span class="suggestion-name">${s.student_name}</span>
          <span class="suggestion-roll">${s.roll_number}</span>
        </div>
      `).join('');

      suggestionsEl.classList.remove('hidden');

      suggestionsEl.querySelectorAll('.results-suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          inputEl.value = item.getAttribute('data-roll');
          suggestionsEl.classList.add('hidden');
        });
      });
    });

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        suggestionsEl.classList.add('hidden');
        performComparison();
      }
    });
  }

  bindCompareSuggestions(input1, suggestions1, input2);
  bindCompareSuggestions(input2, suggestions2, input1);

  // Dismiss dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (suggestions1 && input1 && !input1.contains(e.target) && !suggestions1.contains(e.target)) {
      suggestions1.classList.add('hidden');
    }
    if (suggestions2 && input2 && !input2.contains(e.target) && !suggestions2.contains(e.target)) {
      suggestions2.classList.add('hidden');
    }
  });
}

function performComparison() {
  const roll1 = document.getElementById('compare-roll-1')?.value.trim();
  const roll2 = document.getElementById('compare-roll-2')?.value.trim();
  const output = document.getElementById('compare-output');

  if (!output) return;

  if (!roll1 || !roll2) {
    showToast("Please enter both roll numbers or names to compare.", "warning");
    return;
  }

  if (roll1.toLowerCase() === roll2.toLowerCase()) {
    showToast("Please enter two different students to compare.", "warning");
    return;
  }

  // Resolve roll number or name query matches
  const student1 = currentResultsDataset.find(s => 
    s.roll_number === roll1 || s.student_name.toLowerCase().includes(roll1.toLowerCase())
  );
  const student2 = currentResultsDataset.find(s => 
    s.roll_number === roll2 || s.student_name.toLowerCase().includes(roll2.toLowerCase())
  );

  // Handle errors
  const errors = [];
  if (!student1) errors.push(roll1);
  if (!student2) errors.push(roll2);

  if (errors.length > 0) {
    output.innerHTML = `
      <div class="results-error-card animated-slide-up">
        <div class="results-error-icon">
          <i data-lucide="user-x"></i>
        </div>
        <h4>Student Not Found</h4>
        <p>No student matching <strong>"${errors.map(e => escapeHtml(e)).join('" or "')}"</strong> was found. Please check spelling or roll number.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  renderComparison(output, student1, student2);
}

function renderComparison(container, s1, s2) {
  const sorted = [...currentResultsDataset].sort((a, b) => b.grand_total - a.grand_total);
  const rank1 = sorted.findIndex(s => s.roll_number === s1.roll_number) + 1;
  const rank2 = sorted.findIndex(s => s.roll_number === s2.roll_number) + 1;

  // Determine winner
  const s1Wins = s1.grand_total > s2.grand_total;
  const tie = s1.grand_total === s2.grand_total;

  // Build comparison subject rows
  const subjectKeys = Object.keys(s1.subjects);
  let comparisonRows = '';
  for (const key of subjectKeys) {
    const sub1 = s1.subjects[key];
    const sub2 = s2.subjects[key];
    if (!sub1 || !sub2) continue;

    const t1 = sub1.total ?? 0;
    const t2 = sub2.total ?? 0;
    const highlightClass1 = t1 > t2 ? 'compare-winner' : t1 < t2 ? 'compare-loser' : '';
    const highlightClass2 = t2 > t1 ? 'compare-winner' : t2 < t1 ? 'compare-loser' : '';

    const name1 = cleanSubjectName(sub1.subject);
    const name2 = cleanSubjectName(sub2.subject);
    let displaySubjectName = name1;
    if (name1 !== name2) {
      const majorPrefixMatch1 = name1.match(/^(Major\s+[A-Z0-9]+):\s*(.*)/i);
      const majorPrefixMatch2 = name2.match(/^(Major\s+[A-Z0-9]+):\s*(.*)/i);
      if (majorPrefixMatch1 && majorPrefixMatch2 && majorPrefixMatch1[1] === majorPrefixMatch2[1]) {
        displaySubjectName = `${majorPrefixMatch1[1]}: ${majorPrefixMatch1[2]} / ${majorPrefixMatch2[2]}`;
      } else {
        const minorPrefixMatch1 = name1.match(/^(Minor):\s*(.*)/i);
        const minorPrefixMatch2 = name2.match(/^(Minor):\s*(.*)/i);
        if (minorPrefixMatch1 && minorPrefixMatch2) {
          displaySubjectName = `Minor: ${minorPrefixMatch1[2]} / ${minorPrefixMatch2[2]}`;
        } else {
          displaySubjectName = `${name1} / ${name2}`;
        }
      }
    }

    comparisonRows += `
      <tr>
        <td class="mark-cell ${highlightClass1}">${t1}</td>
        <td class="subject-name-cell compare-subject-center">${displaySubjectName}</td>
        <td class="mark-cell ${highlightClass2}">${t2}</td>
      </tr>
    `;
  }

  container.innerHTML = `
    <div class="results-compare-output animated-slide-up">
      <!-- Side by side cards -->
      <div class="compare-cards-row">
        <div class="compare-student-card ${s1Wins && !tie ? 'compare-winner-card' : ''}">
          ${s1Wins && !tie ? '<div class="compare-crown"><i data-lucide="crown"></i></div>' : ''}
          <div class="compare-avatar">${s1.student_name.charAt(0)}</div>
          <h4>${s1.student_name}</h4>
          <p class="compare-roll">${s1.roll_number}</p>
          <div class="compare-card-stats">
            <div class="compare-stat">
              <span class="compare-stat-num">${s1.grand_total}</span>
              <span class="compare-stat-label">Total</span>
            </div>
            <div class="compare-stat">
              <span class="compare-stat-num">#${rank1}</span>
              <span class="compare-stat-label">Rank</span>
            </div>
            <div class="compare-stat">
              <span class="compare-stat-num result-status-${s1.result === 'Pass' ? 'pass' : 'promoted'}">${s1.result}</span>
              <span class="compare-stat-label">Status</span>
            </div>
          </div>
        </div>

        <div class="compare-vs-divider">
          <span>VS</span>
        </div>

        <div class="compare-student-card ${!s1Wins && !tie ? 'compare-winner-card' : ''}">
          ${!s1Wins && !tie ? '<div class="compare-crown"><i data-lucide="crown"></i></div>' : ''}
          <div class="compare-avatar">${s2.student_name.charAt(0)}</div>
          <h4>${s2.student_name}</h4>
          <p class="compare-roll">${s2.roll_number}</p>
          <div class="compare-card-stats">
            <div class="compare-stat">
              <span class="compare-stat-num">${s2.grand_total}</span>
              <span class="compare-stat-label">Total</span>
            </div>
            <div class="compare-stat">
              <span class="compare-stat-num">#${rank2}</span>
              <span class="compare-stat-label">Rank</span>
            </div>
            <div class="compare-stat">
              <span class="compare-stat-num result-status-${s2.result === 'Pass' ? 'pass' : 'promoted'}">${s2.result}</span>
              <span class="compare-stat-label">Status</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Subject comparison table -->
      <div class="results-marks-table-wrapper" style="margin-top: 24px;">
        <table class="results-marks-table compare-table">
          <thead>
            <tr>
              <th style="text-align: center;">${s1.student_name.split(' ')[0]}</th>
              <th style="text-align: center;">Subject</th>
              <th style="text-align: center;">${s2.student_name.split(' ')[0]}</th>
            </tr>
          </thead>
          <tbody>
            ${comparisonRows}
          </tbody>
          <tfoot>
            <tr>
              <td class="mark-cell mark-grand ${s1Wins ? 'compare-winner' : ''}">${s1.grand_total}</td>
              <td class="subject-name-cell compare-subject-center" style="font-weight: 800;">Grand Total</td>
              <td class="mark-cell mark-grand ${!s1Wins && !tie ? 'compare-winner' : ''}">${s2.grand_total}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Radar Chart -->
      <div class="compare-radar-wrapper" style="margin-top: 24px;">
        <h4 class="section-title" style="margin-bottom: 12px; font-size: 1rem;">
          <i data-lucide="radar" style="color: var(--primary);"></i> Subject-wise Radar Comparison
        </h4>
        <div class="compare-radar-canvas-container">
          <canvas id="compare-radar-chart"></canvas>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();

  // Render Radar Chart visual representation
  renderRadarChart(s1, s2, subjectKeys);
}

function renderRadarChart(s1, s2, subjectKeys) {
  const canvas = document.getElementById('compare-radar-chart');
  if (!canvas) return;

  // Destroy previous chart instance if it exists
  if (comparisonChart) {
    comparisonChart.destroy();
    comparisonChart = null;
  }

  const labels = subjectKeys.map(key => {
    const sub1 = s1.subjects[key];
    const sub2 = s2.subjects[key];
    if (!sub1 && !sub2) return key;
    if (sub1 && !sub2) return cleanSubjectName(sub1.subject);
    if (!sub1 && sub2) return cleanSubjectName(sub2.subject);
    
    const name1 = cleanSubjectName(sub1.subject);
    const name2 = cleanSubjectName(sub2.subject);
    if (name1 === name2) return name1;
    
    const majorPrefixMatch1 = name1.match(/^(Major\s+[A-Z0-9]+):\s*(.*)/i);
    const majorPrefixMatch2 = name2.match(/^(Major\s+[A-Z0-9]+):\s*(.*)/i);
    if (majorPrefixMatch1 && majorPrefixMatch2 && majorPrefixMatch1[1] === majorPrefixMatch2[1]) {
      return `${majorPrefixMatch1[1]}: ${majorPrefixMatch1[2]} / ${majorPrefixMatch2[2]}`;
    }
    
    const minorPrefixMatch1 = name1.match(/^(Minor):\s*(.*)/i);
    const minorPrefixMatch2 = name2.match(/^(Minor):\s*(.*)/i);
    if (minorPrefixMatch1 && minorPrefixMatch2) {
      return `Minor: ${minorPrefixMatch1[2]} / ${minorPrefixMatch2[2]}`;
    }
    
    return `${name1} / ${name2}`;
  });

  const data1 = subjectKeys.map(key => s1.subjects[key]?.total ?? 0);
  const data2 = subjectKeys.map(key => s2.subjects[key]?.total ?? 0);

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const labelColor = isDark ? '#94a3b8' : '#475569';

  const isMobile = window.innerWidth <= 768;
  const pointLabelSize = isMobile ? 8.2 : 11;

  comparisonChart = new Chart(canvas, {
    type: 'radar',
    data: {
      labels,
      datasets: [
        {
          label: s1.student_name,
          data: data1,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          borderWidth: 2.5,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: s2.student_name,
          data: data2,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          borderWidth: 2.5,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: isMobile ? { top: 10, bottom: 10, left: 15, right: 15 } : { top: 0, bottom: 0, left: 0, right: 0 }
      },
      scales: {
        r: {
          beginAtZero: true,
          grid: {
            color: gridColor,
          },
          angleLines: {
            color: gridColor,
          },
          ticks: {
            color: labelColor,
            backdropColor: 'transparent',
            font: { size: isMobile ? 8 : 10, family: "'Plus Jakarta Sans', sans-serif" }
          },
          pointLabels: {
            color: labelColor,
            font: { size: pointLabelSize, weight: '600', family: "'Plus Jakarta Sans', sans-serif" },
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: labelColor,
            padding: isMobile ? 12 : 20,
            font: { size: isMobile ? 11 : 12, weight: '600', family: "'Plus Jakarta Sans', sans-serif" },
            usePointStyle: true,
            pointStyle: 'circle',
          }
        },
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          titleColor: isDark ? '#f8fafc' : '#0f172a',
          bodyColor: isDark ? '#94a3b8' : '#475569',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          titleFont: { weight: '700', family: "'Plus Jakarta Sans', sans-serif" },
          bodyFont: { family: "'Plus Jakarta Sans', sans-serif" },
        }
      }
    }
  });
}

// ========== UTILITY FUNCTIONS ==========

function cleanSubjectName(name) {
  if (!name) return 'Unknown';
  
  let cleaned = name;
  
  // 1. Parse Majors
  const majorMatch = name.match(/^MAJOR-([lIVX]+)\s*-\s*(.*)/i);
  if (majorMatch) {
    cleaned = `Major ${majorMatch[1].toUpperCase()}: ${majorMatch[2].trim()}`;
  } 
  // 2. Parse Minors
  else if (name.toLowerCase().startsWith('minor')) {
    const paperMatch = name.match(/Paper Name:?-?\s*(.*)/i);
    if (paperMatch) {
      cleaned = `Minor: ${paperMatch[1].trim()}`;
    } else {
      const parts = name.split('-');
      if (parts.length >= 3) {
        cleaned = `Minor: ${parts.slice(2).join('-').trim()}`;
      } else {
        cleaned = name.replace(/^Minor-[A-Z0-9]+-?/i, 'Minor: ');
      }
    }
  }
  // 3. Parse MDC
  else if (name.toLowerCase().includes('multi disciplinary course')) {
    cleaned = name.replace(/^Multi Disciplinary Course-II\s*-\s*/i, 'MDC: ').replace(/^Multi Disciplinary Course-II\s*/i, 'MDC: ').replace(/Geography-/, 'Geography');
  }
  // 4. Parse SEC
  else if (name.toLowerCase().includes('skill enhancement course')) {
    cleaned = name.replace(/^Skill Enhancement Course-II\s*-\s*/i, 'SEC: ').replace(/^Skill Enhancement Course-II-?\s*/i, 'SEC: ').replace(/^Skill Enhancement Course-ll\s*-\s*/i, 'SEC: ').replace(/^Skill Enhancement Course-\s*-\s*/i, 'SEC: ');
  }
  // 5. Parse AEC
  else if (name.toLowerCase().includes('ability enhancement course')) {
    cleaned = name.replace(/^Ability Enhancement Courses-II\s*-\s*/i, 'AEC: ').replace(/^Ability Enhancement Courses-\s*-\s*/i, 'AEC: ').replace(/^Ability Enhancement Courses-II-?\s*/i, 'AEC: ').replace(/^Ability Enhancement Courses-IV\s*-\s*/i, 'AEC: ').replace(/^Ability Enhancement Courses-IV-?\s*/i, 'AEC: ');
  }
  // 6. Parse VAC
  else if (name.toLowerCase().includes('value addes course') || name.toLowerCase().includes('value added course')) {
    cleaned = name.replace(/^Value Addes Courses-ll\s*-\s*/i, 'VAC: ').replace(/^Value Addes Courses-\s*-\s*/i, 'VAC: ').replace(/^Value Addes Courses-?\s*/i, 'VAC: ');
  } else {
    // General fallback cleaning
    cleaned = name
      .replace(/^MAJOR-[VIX]+-/i, '')
      .replace(/^Minor-[IIB]+-/i, '')
      .replace(/^Ability Enhancement Courses-[IVX]+ ?- ?/i, 'AEC: ')
      .replace(/^Value Addes Courses-[lIVX]* ?-? ?/i, 'VAC: ')
      .trim();
  }

  // Custom abbreviations for extremely long subjects (fixes radar chart centering on mobile)
  cleaned = cleaned
    .replace(/Global Citizenship Education for Sustainable Development/gi, "Global Citizenship")
    .replace(/Communication Skills & Personality development/gi, "Comm. Skills & Personality")
    .replace(/News Writing and Reporting/gi, "News Writing")
    .replace(/Chemistry in Everyday Life/gi, "Chem in Everyday Life")
    .replace(/Electrical Circuits and Network Skills/gi, "Electrical Circuits")
    .replace(/Analytical Chemistry/gi, "Analyt. Chem")
    .replace(/Digital Systems and Applications/gi, "Digital Sys")
    .replace(/Digital Systems/gi, "Digital Sys")
    .replace(/Mathematics/gi, "Math")
    .replace(/Composition/gi, "Comp");

  return cleaned;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ========== DYNAMIC RESULTS DASHBOARD HELPERS ==========

function getStudentMajor(student) {
  if (!student || !student.subjects) return 'Unknown';
  // Try major_ii or major_iii first
  for (const key of ['major_ii', 'major_iii', 'major_vi', 'major_vii', 'major_viii']) {
    const subObj = student.subjects[key];
    if (subObj && subObj.subject) {
      const title = subObj.subject.toLowerCase();
      if (title.includes('mathematics') || title.includes('math')) return 'Mathematics';
      if (title.includes('physics')) return 'Physics';
      if (title.includes('chemistry')) return 'Chemistry';
    }
  }
  // Fallback to check all subjects
  for (const key in student.subjects) {
    const subObj = student.subjects[key];
    if (subObj && subObj.subject) {
      const title = subObj.subject.toLowerCase();
      if (title.includes('mathematics') || title.includes('math')) return 'Mathematics';
      if (title.includes('physics')) return 'Physics';
      if (title.includes('chemistry')) return 'Chemistry';
    }
  }
  return 'General';
}

function getSubjectToppers(filteredData) {
  if (!filteredData || filteredData.length === 0) return {};
  const toppers = {};
  
  for (const student of filteredData) {
    if (!student.subjects) continue;
    for (const [key, subObj] of Object.entries(student.subjects)) {
      if (!subObj || subObj.total === null || subObj.total === undefined) continue;
      
      const score = subObj.total;
      const subName = cleanSubjectName(subObj.subject);
      
      if (!toppers[subName] || score > toppers[subName].maxScore) {
        toppers[subName] = {
          student,
          maxScore: score,
          subjectName: subName
        };
      }
    }
  }
  return toppers;
}

function updateDashboardData(container) {
  const filteredData = selectedMajor === 'All'
    ? currentResultsDataset
    : currentResultsDataset.filter(s => s.major === selectedMajor);

  updateStatsCards(container, filteredData);
  updateSubjectToppers(container, filteredData);
  updateLeaderboardSelection(container, filteredData);
}

function updateStatsCards(container, filteredData) {
  const statsContainer = container.querySelector('#results-stats-container');
  if (!statsContainer) return;

  if (filteredData.length === 0) {
    statsContainer.innerHTML = '';
    return;
  }

  const totalStudents = filteredData.length;
  const passCount = filteredData.filter(s => s.result.toLowerCase() === 'pass').length;
  const passPercent = totalStudents ? ((passCount / totalStudents) * 100).toFixed(1) : 0;
  
  // Sort by grand total to find highest
  const sorted = [...filteredData].sort((a, b) => b.grand_total - a.grand_total);
  const highestScore = sorted[0]?.grand_total || 0;
  const highestName = sorted[0]?.student_name || 'N/A';
  const highestRoll = sorted[0]?.roll_number || '';

  // Calculate cohort average
  const avgScore = totalStudents 
    ? (filteredData.reduce((sum, s) => sum + s.grand_total, 0) / totalStudents).toFixed(1) 
    : 0;

  statsContainer.innerHTML = `
    <div class="results-stats-grid animated-slide-up">
      <div class="results-stat-card">
        <div class="results-stat-card-header">
          <span>Total Enrolled</span>
          <div class="results-stat-card-icon blue"><i data-lucide="users" style="width:16px;height:16px;"></i></div>
        </div>
        <div class="results-stat-card-value">${totalStudents}</div>
        <div class="results-stat-card-sub">Students in batch</div>
      </div>

      <div class="results-stat-card">
        <div class="results-stat-card-header">
          <span>Pass Percentage</span>
          <div class="results-stat-card-icon green"><i data-lucide="check-circle" style="width:16px;height:16px;"></i></div>
        </div>
        <div class="results-stat-card-value">${passPercent}%</div>
        <div class="results-stat-card-sub">${passCount} of ${totalStudents} Passed</div>
        <div class="results-stat-progress-bg">
          <div class="results-stat-progress-fill" style="width: ${passPercent}%;"></div>
        </div>
      </div>

      <div class="results-stat-card" style="cursor: pointer;" id="stats-topper-card" data-roll="${highestRoll}">
        <div class="results-stat-card-header">
          <span>Batch Topper</span>
          <div class="results-stat-card-icon amber"><i data-lucide="crown" style="width:16px;height:16px;"></i></div>
        </div>
        <div class="results-stat-card-value">${highestScore}</div>
        <div class="results-stat-card-sub" style="font-weight: 700; color: var(--text-primary); text-overflow: ellipsis; white-space: nowrap; overflow: hidden;" title="${highestName}">
          ${highestName}
        </div>
      </div>

      <div class="results-stat-card">
        <div class="results-stat-card-header">
          <span>Batch Average</span>
          <div class="results-stat-card-icon purple"><i data-lucide="bar-chart" style="width:16px;height:16px;"></i></div>
        </div>
        <div class="results-stat-card-value">${avgScore}</div>
        <div class="results-stat-card-sub">Avg grand total score</div>
      </div>
    </div>
  `;

  // Click on topper card searches for them
  const topperCard = statsContainer.querySelector('#stats-topper-card');
  if (topperCard && highestRoll) {
    topperCard.addEventListener('click', () => {
      const searchInput = document.getElementById('result-search-input');
      if (searchInput) {
        searchInput.value = highestRoll;
        performSearch();
        const searchSection = document.getElementById('results-search-section');
        if (searchSection) searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  lucide.createIcons();
}

function updateSubjectToppers(container, filteredData) {
  const toppersContainer = container.querySelector('#results-toppers-container');
  if (!toppersContainer) return;

  if (filteredData.length === 0) {
    toppersContainer.innerHTML = '';
    return;
  }

  const toppersMap = getSubjectToppers(filteredData);
  const toppersList = Object.entries(toppersMap);

  if (toppersList.length === 0) {
    toppersContainer.innerHTML = '';
    return;
  }

  toppersContainer.innerHTML = `
    <div class="animated-slide-up">
      <div style="
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: 16px;
        overflow: visible;
        position: relative;
      ">
        <h3 class="section-title" style="margin-bottom: 4px; font-size: 1rem;">
          <i data-lucide="award" style="color: var(--warning); width:18px; height:18px;"></i> Subject Toppers
        </h3>
        <p class="results-section-desc" style="margin-bottom: 12px; font-size: 0.78rem;">Click a row to view marks card.</p>
        <div class="results-toppers-compact-list">
          ${toppersList.map(([key, item]) => `
            <div class="results-topper-compact-row" data-roll="${item.student.roll_number}">
              <div class="rtc-medal"><i data-lucide="medal" style="width:14px;height:14px;"></i></div>
              <div class="rtc-info">
                <span class="rtc-subject">${item.subjectName}</span>
                <span class="rtc-name">${item.student.student_name}</span>
              </div>
              <span class="rtc-score" style="display:inline-block;flex-shrink:0;min-width:34px;text-align:center;white-space:nowrap;padding:3px 9px;border-radius:9999px;background:rgba(99,102,241,0.18);border:1px solid rgba(99,102,241,0.4);color:var(--primary);font-weight:800;font-size:0.88rem;">${item.maxScore}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Bind clicks on topper rows
  toppersContainer.querySelectorAll('.results-topper-compact-row').forEach(row => {
    row.addEventListener('click', () => {
      const roll = row.getAttribute('data-roll');
      const searchInput = document.getElementById('result-search-input');
      if (searchInput) {
        searchInput.value = roll;
        performSearch();
        const searchSection = document.getElementById('results-search-section');
        if (searchSection) searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  lucide.createIcons();
}

function updateLeaderboardSelection(container, filteredData) {
  const sortSelect = container.querySelector('#leaderboard-sort-select');
  if (!sortSelect || filteredData.length === 0) return;

  // Get current sorting selection
  const previousSortKey = sortSelect.value;

  // Get all unique subject keys in the filtered dataset
  const subjectKeysMap = {};
  for (const student of filteredData) {
    if (!student.subjects) continue;
    for (const [key, subObj] of Object.entries(student.subjects)) {
      if (!subObj || subObj.subject === undefined) continue;
      const cleanedName = cleanSubjectName(subObj.subject);
      subjectKeysMap[key] = cleanedName;
    }
  }

  // Populate select
  let optionsHtml = '<option value="grand_total">Grand Total (Overall)</option>';
  for (const [key, cleanedName] of Object.entries(subjectKeysMap)) {
    optionsHtml += `<option value="${key}">${cleanedName}</option>`;
  }
  sortSelect.innerHTML = optionsHtml;

  // Restore selection if still valid, otherwise default to grand_total
  if (subjectKeysMap[previousSortKey]) {
    sortSelect.value = previousSortKey;
    renderLeaderboard(previousSortKey);
  } else {
    sortSelect.value = 'grand_total';
    renderLeaderboard('grand_total');
  }
}
