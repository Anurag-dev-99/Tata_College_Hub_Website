/* ==========================================
   Tata College Student Hub - Syllabus Module
   Handles listing syllabuses, detailed module
   views, and downloading syllabus outlines.
   ========================================== */

import { showToast } from './app.js';
import { logRecentlyViewed } from './dashboard.js';

let syllabusData = [];

export async function initSyllabusView(container) {
  container.innerHTML = `
    <div class="animated-slide-up">
      <div class="page-title-section">
        <div>
          <h2 class="page-title">Syllabus Explorer</h2>
          <p class="page-subtitle">View and download the latest FYUGP curriculum under NEP-2020 for Kolhan University.</p>
        </div>
      </div>

      <div class="syllabus-list" id="syllabus-cards-container">
        <div class="text-secondary" style="text-align: center; padding: 40px 0;">
          <div class="logo-icon" style="margin: 0 auto 16px auto; font-size: 1.5rem;">T</div>
          Loading syllabi...
        </div>
      </div>
    </div>
  `;

  if (syllabusData.length === 0) {
    try {
      const response = await fetch('data/syllabus.json');
      syllabusData = await response.json();
    } catch (err) {
      console.error("Error fetching syllabus data: ", err);
      showToast("Failed to load syllabuses. Check console.", "error");
      return;
    }
  }

  renderSyllabusCards();
}

function renderSyllabusCards() {
  const container = document.getElementById('syllabus-cards-container');
  if (!container) return;

  const savedSyllabus = JSON.parse(localStorage.getItem('tata_saved_syllabus')) || [];

  container.innerHTML = syllabusData.map(syl => {
    const isSaved = savedSyllabus.some(item => item.id === syl.id);
    return `
      <div class="card syllabus-card" data-syl-id="${syl.id}">
        <div class="syllabus-grid-inner">
          <div>
            <div style="display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
              <span class="notice-tag academic">NEP FYUGP</span>
              <span style="font-size: 0.75rem; color: var(--text-secondary); align-self: center;">Effective: ${syl.effectiveFrom}</span>
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 8px;">${syl.title}</h3>
            <p class="text-secondary" style="font-size: 0.85rem; line-height: 1.5; margin-bottom: 16px;">${syl.description}</p>
            
            <div style="display: flex; gap: 12px; align-items: center;">
              <button class="primary-btn view-modules-btn" data-id="${syl.id}">
                <i data-lucide="eye"></i> View Course Content
              </button>
              <button class="secondary-btn btn-icon-only bookmark-syl-btn" data-id="${syl.id}" title="${isSaved ? 'Remove Bookmark' : 'Save Syllabus'}">
                <i data-lucide="bookmark" style="${isSaved ? 'fill: var(--primary); color: var(--primary);' : ''}"></i>
              </button>
            </div>
          </div>
          
          <div class="syllabus-modules">
            <h5>Core Major Syllabus (MJ)</h5>
            <ul>
              ${syl.modules.slice(0, 4).map(mod => `<li>${mod}</li>`).join('')}
              ${syl.modules.length > 4 ? `<li style="list-style: none; font-style: italic; color: var(--text-secondary); margin-top: 4px;">+ ${syl.modules.length - 4} more semesters</li>` : ''}
            </ul>
          </div>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
  setupSyllabusListeners();
}

function setupSyllabusListeners() {
  document.querySelectorAll('.view-modules-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sylId = btn.getAttribute('data-id');
      const syl = syllabusData.find(s => s.id === sylId);
      if (syl) openSyllabusDetailModal(syl);
    });
  });

  document.querySelectorAll('.bookmark-syl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sylId = btn.getAttribute('data-id');
      toggleSyllabusBookmark(sylId);
    });
  });
}

function toggleSyllabusBookmark(sylId) {
  const syl = syllabusData.find(s => s.id === sylId);
  if (!syl) return;

  let savedList = JSON.parse(localStorage.getItem('tata_saved_syllabus')) || [];
  const index = savedList.findIndex(item => item.id === sylId);

  if (index === -1) {
    savedList.push({
      id: syl.id,
      title: syl.title,
      department: syl.department
    });
    localStorage.setItem('tata_saved_syllabus', JSON.stringify(savedList));
    showToast(`Saved "${syl.title}" to Dashboard`, 'success');
  } else {
    savedList.splice(index, 1);
    localStorage.setItem('tata_saved_syllabus', JSON.stringify(savedList));
    showToast(`Removed bookmark for "${syl.title}"`, 'info');
  }

  renderSyllabusCards();
}

function openSyllabusDetailModal(syl) {
  const modal = document.getElementById('universal-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');

  if (!modal || !title || !body) return;

  // Track in recently viewed
  logRecentlyViewed(syl.id, syl.title, 'syllabus');

  title.textContent = syl.title;
  body.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <p class="text-secondary" style="font-size: 0.9rem; line-height: 1.5;">${syl.description}</p>
      
      <div style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--primary); margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">Semester-wise Course Structure</h4>
        <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem;">
          ${syl.modules.map(mod => `
            <li style="display: flex; gap: 10px; align-items: flex-start; padding: 4px 0;">
              <i data-lucide="check-circle-2" style="width: 16px; height: 16px; color: var(--success); flex-shrink: 0; margin-top: 2px;"></i>
              <span>${mod}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px;">
        <button class="secondary-btn" id="close-syl-modal">Close</button>
        <button class="primary-btn" id="download-syl-outline-btn">
          <i data-lucide="download"></i> Download Syllabus PDF
        </button>
      </div>
    </div>
  `;

  lucide.createIcons();
  modal.classList.remove('hidden');

  document.getElementById('close-syl-modal').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  document.getElementById('download-syl-outline-btn').addEventListener('click', () => {
    // Generate dummy file
    const dummySyllabus = `TATA COLLEGE RESOURCE PORTAL\n===========================\nSyllabus for: ${syl.title}\nEffective From: ${syl.effectiveFrom}\n\nSEMESTER PROGRESSIONS:\n` + syl.modules.join('\n') + `\n\n[End of File]`;
    const blob = new Blob([dummySyllabus], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${syl.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Downloading: ${syl.title}`, 'success');
    modal.classList.add('hidden');
  });
}
