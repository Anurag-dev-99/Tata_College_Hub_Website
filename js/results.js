/* ==========================================
   Tata College Student Hub - Results Module
   Handles announcements, pass percentage charts
   (Chart.js), and CGPA Calculator.
   ========================================== */

import { showToast } from './app.js';

let resultsData = null;

export async function initResultsView(container) {
  container.innerHTML = `
    <div class="animated-slide-up">
      <div class="page-title-section">
        <div>
          <h2 class="page-title">Results & Academic Analysis</h2>
          <p class="page-subtitle">Check recent announcements, analyze college statistics, and compute your CGPA.</p>
        </div>
      </div>

      <!-- Announcements & CGPA Calculator layout -->
      <div class="tools-grid" style="margin-bottom: 32px;">
        
        <!-- Results Announcements -->
        <div class="card">
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

        <!-- CGPA Calculator -->
        <div class="card calc-card">
          <h3><i data-lucide="calculator" style="color: var(--primary);"></i> CGPA Calculator</h3>
          <p class="text-secondary" style="font-size: 0.8rem; margin-bottom: 12px;">Enter your SGPA (Semester Grade Point Average) for each semester to compute your cumulative CGPA.</p>
          
          <div class="cgpa-semesters-list" id="cgpa-rows-container">
            <!-- Dynamically populated rows Sem 1 to 6 -->
          </div>

          <button class="primary-btn full-btn" id="calculate-cgpa-btn">Compute CGPA</button>

          <div class="calc-result-box" id="cgpa-result-box" style="margin-top: 16px;">
            <span class="calc-result-title">Cumulative CGPA</span>
            <span class="calc-result-value" id="cgpa-result-value">0.00</span>
            <span class="calc-result-helper" id="cgpa-result-helper">Enter semester SGPAs to compute.</span>
          </div>
        </div>

      </div>

    </div>
  `;

  lucide.createIcons();

  // Load results data
  if (!resultsData) {
    try {
      const response = await fetch('data/results.json');
      resultsData = await response.json();
    } catch (err) {
      console.error("Error fetching results: ", err);
      showToast("Failed to load results stats.", "error");
      return;
    }
  }

  // Populate table
  renderAnnouncementsTable();

  // Populate CGPA input rows
  renderCgpaInputs();

  // CGPA event listener
  document.getElementById('calculate-cgpa-btn').addEventListener('click', calculateCumulativeCgpa);
}

function renderAnnouncementsTable() {
  const tbody = document.getElementById('results-table-body');
  if (!tbody || !resultsData) return;

  tbody.innerHTML = resultsData.announcements.map(res => `
    <tr>
      <td style="font-weight: 600;">${res.title}</td>
      <td style="color: var(--text-secondary); font-size: 0.85rem;">${res.date}</td>
      <td>
        <span class="badge-status ${res.status.toLowerCase()}">${res.status}</span>
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

function renderCgpaInputs() {
  const container = document.getElementById('cgpa-rows-container');
  if (!container) return;

  let html = '';
  // Load saved SGPAs from localStorage if any
  const savedSgpa = JSON.parse(localStorage.getItem('tata_sgpas')) || {};

  for (let sem = 1; sem <= 6; sem++) {
    const val = savedSgpa[`sem_${sem}`] || '';
    html += `
      <div class="cgpa-sem-row">
        <span class="cgpa-sem-label">Semester ${sem}</span>
        <input type="number" step="0.01" min="0" max="10" placeholder="SGPA" class="cgpa-input-field" data-sem="${sem}" value="${val}">
      </div>
    `;
  }
  container.innerHTML = html;
}

function calculateCumulativeCgpa() {
  const fields = document.querySelectorAll('.cgpa-input-field');
  let sum = 0;
  let count = 0;
  const savedSgpa = {};

  fields.forEach(field => {
    const sem = field.getAttribute('data-sem');
    const val = parseFloat(field.value);
    
    if (!isNaN(val) && val > 0) {
      if (val > 10) {
        showToast(`SGPA for Semester ${sem} cannot exceed 10.0`, 'warning');
        return;
      }
      sum += val;
      count++;
      savedSgpa[`sem_${sem}`] = val;
    }
  });

  // Save SGPAs to localStorage
  localStorage.setItem('tata_sgpas', JSON.stringify(savedSgpa));

  const valEl = document.getElementById('cgpa-result-value');
  const helperEl = document.getElementById('cgpa-result-helper');

  if (!valEl || !helperEl) return;

  if (count === 0) {
    valEl.textContent = "0.00";
    helperEl.textContent = "Please enter SGPA in at least one semester.";
    return;
  }

  const cgpa = sum / count;
  valEl.textContent = cgpa.toFixed(2);

  // Provide realistic Grade helper
  let gradeLetter = 'F';
  let desc = 'Fail';
  if (cgpa >= 9.0) { gradeLetter = 'O (Outstanding)'; desc = 'Distinction, University Topper Category'; }
  else if (cgpa >= 8.0) { gradeLetter = 'A+ (Excellent)'; desc = 'First Class with Distinction'; }
  else if (cgpa >= 7.0) { gradeLetter = 'A (Very Good)'; desc = 'First Class'; }
  else if (cgpa >= 6.0) { gradeLetter = 'B+ (Good)'; desc = 'First Class'; }
  else if (cgpa >= 5.0) { gradeLetter = 'B (Above Average)'; desc = 'Second Class'; }
  else if (cgpa >= 4.0) { gradeLetter = 'C (Pass)'; desc = 'Pass'; }

  helperEl.textContent = `Overall Class: ${gradeLetter}. ${desc} (${count} Semesters computed).`;
  showToast(`CGPA Computed: ${cgpa.toFixed(2)}`, 'success');
}

