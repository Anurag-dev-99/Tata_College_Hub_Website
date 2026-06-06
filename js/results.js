/* ==========================================
   Tata College Student Hub - Results Module
   Sem 4 Maths Major Result (2022-2026 Batch)
   Search, Leaderboard, Head-to-Head Comparison
   ========================================== */

import { showToast } from './app.js';

// Global results data store
let sem4MathsResults = [];
let announcementsData = null;

// Radar chart instance references (for cleanup)
let comparisonChart = null;

export async function initResultsView(container) {
  // Build the complete results page HTML
  container.innerHTML = `
    <div class="animated-slide-up">
      <div class="page-title-section">
        <div>
          <h2 class="page-title">Results & Analysis</h2>
          <p class="page-subtitle">Semester 4 — Mathematics Major — Batch 2022-2026 (Kolhan University)</p>
        </div>
      </div>

      <!-- Announcements Table -->
      <div class="card" style="margin-bottom: 32px;">
        <h3 class="section-title" style="margin-bottom: 16px;">
          <i data-lucide="award" style="color: var(--success);"></i> Declared Results & Alerts
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

      <!-- ============================== -->
      <!--     ROLL NUMBER SEARCH         -->
      <!-- ============================== -->
      <div class="card results-search-section" id="results-search-section" style="margin-bottom: 32px;">
        <h3 class="section-title" style="margin-bottom: 6px;">
          <i data-lucide="search" style="color: var(--primary);"></i> Search Student Result
        </h3>
        <p class="results-section-desc">Enter your roll number to view detailed marks and pass/fail status.</p>
        
        <div class="results-search-bar" id="results-search-bar">
          <div class="results-input-wrapper">
            <i data-lucide="hash" class="results-input-icon"></i>
            <input type="text" id="result-search-input" placeholder="Enter Roll Number (e.g., 231305779917)" autocomplete="off" />
          </div>
          <button class="primary-btn results-search-btn" id="result-search-btn">
            <i data-lucide="search"></i>
            <span>Search</span>
          </button>
        </div>

        <!-- Search result card rendered here -->
        <div id="result-search-output"></div>
      </div>

      <!-- ============================== -->
      <!--     BATCH LEADERBOARD          -->
      <!-- ============================== -->
      <div class="card results-leaderboard-section" id="results-leaderboard-section" style="margin-bottom: 32px;">
        <h3 class="section-title" style="margin-bottom: 6px;">
          <i data-lucide="trophy" style="color: var(--warning);"></i> Batch Leaderboard
        </h3>
        <p class="results-section-desc">Top 10 students by Grand Total in Semester 4 Mathematics Major.</p>
        
        <div class="styled-table-wrapper" style="overflow-x: auto; margin-top: 16px;">
          <table class="styled-table results-leaderboard-table" id="leaderboard-table">
            <thead>
              <tr>
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

      <!-- ============================== -->
      <!--   HEAD-TO-HEAD COMPARISON      -->
      <!-- ============================== -->
      <div class="card results-compare-section" id="results-compare-section">
        <h3 class="section-title" style="margin-bottom: 6px;">
          <i data-lucide="git-compare" style="color: var(--info);"></i> Compare Students
        </h3>
        <p class="results-section-desc">Enter two roll numbers to compare marks side by side with a radar chart.</p>

        <div class="results-compare-inputs" id="results-compare-inputs">
          <div class="results-input-wrapper">
            <i data-lucide="user" class="results-input-icon"></i>
            <input type="text" id="compare-roll-1" placeholder="Roll Number 1" autocomplete="off" />
          </div>
          <div class="results-vs-badge">VS</div>
          <div class="results-input-wrapper">
            <i data-lucide="user" class="results-input-icon"></i>
            <input type="text" id="compare-roll-2" placeholder="Roll Number 2" autocomplete="off" />
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

  lucide.createIcons();

  // Load data
  await loadAllResultsData();

  // Render announcements
  renderAnnouncementsTable();

  // Render leaderboard
  renderLeaderboard();

  // Bind search
  bindSearchHandlers(container);

  // Bind comparison
  bindCompareHandlers(container);
}


// ========== DATA LOADING ==========

async function loadAllResultsData() {
  // Load sem4 maths results
  if (sem4MathsResults.length === 0) {
    try {
      const res = await fetch('data/sem4_maths_results.json');
      sem4MathsResults = await res.json();
    } catch (err) {
      console.error("Error fetching sem4 maths results: ", err);
      showToast("Failed to load semester results data.", "error");
    }
  }

  // Load announcements
  if (!announcementsData) {
    try {
      const res = await fetch('data/results.json');
      announcementsData = await res.json();
    } catch (err) {
      console.error("Error fetching announcements: ", err);
    }
  }
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


// ========== SEARCH FEATURE ==========

function bindSearchHandlers(container) {
  const searchBtn = container.querySelector('#result-search-btn');
  const searchInput = container.querySelector('#result-search-input');

  if (searchBtn) {
    searchBtn.addEventListener('click', () => performSearch());
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performSearch();
    });
  }
}

function performSearch() {
  const input = document.getElementById('result-search-input');
  const output = document.getElementById('result-search-output');
  if (!input || !output) return;

  const rollNumber = input.value.trim();

  if (!rollNumber) {
    showToast("Please enter a roll number to search.", "warning");
    return;
  }

  const student = sem4MathsResults.find(s => s.roll_number === rollNumber);

  if (!student) {
    output.innerHTML = `
      <div class="results-error-card animated-slide-up">
        <div class="results-error-icon">
          <i data-lucide="user-x"></i>
        </div>
        <h4>Roll Number Not Found</h4>
        <p>No student found with roll number <strong>"${escapeHtml(rollNumber)}"</strong>. Please check and try again.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  renderStudentCard(output, student);
}

function renderStudentCard(container, student) {
  const subjects = student.subjects;
  const isPass = student.result === 'Pass';
  const statusClass = isPass ? 'pass' : 'promoted';
  const statusLabel = student.result;

  // Build subject rows
  let subjectRows = '';
  for (const [key, sub] of Object.entries(subjects)) {
    const subjectName = cleanSubjectName(sub.subject);
    const theory = sub.theory !== null && sub.theory !== undefined ? sub.theory : '-';
    const internal = sub.internal !== null && sub.internal !== undefined ? sub.internal : '-';
    const practical = sub.practical !== null && sub.practical !== undefined ? sub.practical : '-';
    const total = sub.total !== null && sub.total !== undefined ? sub.total : '-';

    subjectRows += `
      <tr>
        <td class="subject-name-cell">${subjectName}</td>
        <td class="mark-cell">${theory}</td>
        <td class="mark-cell">${internal}</td>
        <td class="mark-cell">${practical}</td>
        <td class="mark-cell mark-total">${total}</td>
      </tr>
    `;
  }

  // Calculate rank
  const sorted = [...sem4MathsResults].sort((a, b) => b.grand_total - a.grand_total);
  const rank = sorted.findIndex(s => s.roll_number === student.roll_number) + 1;

  container.innerHTML = `
    <div class="results-student-card animated-slide-up">
      <div class="results-student-header">
        <div class="results-student-avatar">
          ${student.student_name.charAt(0)}
        </div>
        <div class="results-student-info">
          <h3 class="results-student-name">${student.student_name}</h3>
          <div class="results-student-meta">
            <span><i data-lucide="hash"></i> ${student.roll_number}</span>
            <span><i data-lucide="bar-chart-2"></i> Rank #${rank} of ${sem4MathsResults.length}</span>
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

      <div class="results-marks-table-wrapper">
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
    </div>
  `;

  lucide.createIcons();
}


// ========== LEADERBOARD ==========

function renderLeaderboard() {
  const tbody = document.getElementById('leaderboard-table-body');
  if (!tbody || sem4MathsResults.length === 0) return;

  // Sort by grand_total descending
  const sorted = [...sem4MathsResults].sort((a, b) => b.grand_total - a.grand_total);
  const top10 = sorted.slice(0, 10);

  tbody.innerHTML = top10.map((student, index) => {
    const rank = index + 1;
    let medalIcon = '';
    let rankClass = '';
    
    if (rank === 1) { medalIcon = '🥇'; rankClass = 'rank-gold'; }
    else if (rank === 2) { medalIcon = '🥈'; rankClass = 'rank-silver'; }
    else if (rank === 3) { medalIcon = '🥉'; rankClass = 'rank-bronze'; }

    return `
      <tr class="leaderboard-row ${rankClass}" data-roll="${student.roll_number}">
        <td>
          <span class="leaderboard-rank">${medalIcon || rank}</span>
        </td>
        <td>
          <div class="leaderboard-student-cell">
            <div class="leaderboard-avatar">${student.student_name.charAt(0)}</div>
            <span class="leaderboard-name">${student.student_name}</span>
          </div>
        </td>
        <td style="font-family: monospace; font-size: 0.85rem; color: var(--text-secondary);">${student.roll_number}</td>
        <td>
          <span class="leaderboard-total">${student.grand_total}</span>
        </td>
      </tr>
    `;
  }).join('');

  // Make leaderboard rows clickable to search
  tbody.querySelectorAll('.leaderboard-row').forEach(row => {
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => {
      const roll = row.getAttribute('data-roll');
      const searchInput = document.getElementById('result-search-input');
      if (searchInput) {
        searchInput.value = roll;
        performSearch();
        // Scroll to search section
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

  // Enter key on both inputs
  const input1 = container.querySelector('#compare-roll-1');
  const input2 = container.querySelector('#compare-roll-2');

  if (input1) input1.addEventListener('keydown', (e) => { if (e.key === 'Enter') performComparison(); });
  if (input2) input2.addEventListener('keydown', (e) => { if (e.key === 'Enter') performComparison(); });
}

function performComparison() {
  const roll1 = document.getElementById('compare-roll-1')?.value.trim();
  const roll2 = document.getElementById('compare-roll-2')?.value.trim();
  const output = document.getElementById('compare-output');

  if (!output) return;

  if (!roll1 || !roll2) {
    showToast("Please enter both roll numbers to compare.", "warning");
    return;
  }

  if (roll1 === roll2) {
    showToast("Please enter two different roll numbers.", "warning");
    return;
  }

  const student1 = sem4MathsResults.find(s => s.roll_number === roll1);
  const student2 = sem4MathsResults.find(s => s.roll_number === roll2);

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
        <h4>Roll Number Not Found</h4>
        <p>No student found with roll number${errors.length > 1 ? 's' : ''} <strong>"${errors.map(e => escapeHtml(e)).join('" and "')}"</strong>. Please check and try again.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  renderComparison(output, student1, student2);
}

function renderComparison(container, s1, s2) {
  const sorted = [...sem4MathsResults].sort((a, b) => b.grand_total - a.grand_total);
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

    comparisonRows += `
      <tr>
        <td class="mark-cell ${highlightClass1}">${t1}</td>
        <td class="subject-name-cell compare-subject-center">${cleanSubjectName(sub1.subject)}</td>
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

  // Render Radar Chart
  renderRadarChart(s1, s2, subjectKeys);
}

function renderRadarChart(s1, s2, subjectKeys) {
  const canvas = document.getElementById('compare-radar-chart');
  if (!canvas) return;

  // Destroy previous chart if exists
  if (comparisonChart) {
    comparisonChart.destroy();
    comparisonChart = null;
  }

  const labels = subjectKeys.map(key => {
    const sub = s1.subjects[key];
    return sub ? cleanSubjectName(sub.subject) : key;
  });

  const data1 = subjectKeys.map(key => s1.subjects[key]?.total ?? 0);
  const data2 = subjectKeys.map(key => s2.subjects[key]?.total ?? 0);

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const labelColor = isDark ? '#94a3b8' : '#475569';

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
      maintainAspectRatio: true,
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
            font: { size: 10, family: "'Plus Jakarta Sans', sans-serif" }
          },
          pointLabels: {
            color: labelColor,
            font: { size: 11, weight: '600', family: "'Plus Jakarta Sans', sans-serif" },
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: labelColor,
            padding: 20,
            font: { size: 12, weight: '600', family: "'Plus Jakarta Sans', sans-serif" },
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


// ========== UTILITIES ==========

function cleanSubjectName(name) {
  if (!name) return 'Unknown';
  // Remove common verbose prefixes
  return name
    .replace(/^MAJOR-[VIX]+-/i, '')
    .replace(/^Minor-[IIB]+-/i, '')
    .replace(/^Ability Enhancement Courses-[IVX]+ ?- ?/i, 'AEC: ')
    .replace(/^Value Addes Courses-[lIVX]* ?-? ?/i, 'VAC: ')
    .replace(/^Ability Enhancement Courses-[IVX]+-?/i, 'AEC: ')
    .trim();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
