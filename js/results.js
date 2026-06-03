/* ==========================================
   Tata College Student Hub - Results Module
   Handles announcements and declared results.
   ========================================== */

import { showToast } from './app.js';

let resultsData = null;

export async function initResultsView(container) {
  container.innerHTML = `
    <div class="animated-slide-up">
      <div class="page-title-section">
        <div>
          <h2 class="page-title">Results & Academic Alerts</h2>
          <p class="page-subtitle">Check recent examination announcements and declared results declarations.</p>
        </div>
      </div>

      <!-- Results Announcements -->
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
