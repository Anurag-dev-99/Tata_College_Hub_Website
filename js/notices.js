/* ==========================================
   Tata College Student Hub - Notice Board Module
   Handles filtering, categorizing, search,
   and modal views for college notifications.
   ========================================== */

import { showToast, getAppState } from './app.js';

let noticesData = [];

export async function initNoticeView(container) {
  container.innerHTML = `
    <div class="animated-slide-up">
      <div class="page-title-section">
        <div>
          <h2 class="page-title">College Notice Board</h2>
          <p class="page-subtitle">Stay updated with official notifications from Kolhan University and Tata College.</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="secondary-btn" id="toggle-archive-btn">
            <i data-lucide="archive"></i> View Archived
          </button>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="filter-bar" style="align-items: center;">
          <input type="text" id="notice-search-input" class="search-filter-input" placeholder="Search notices by keyword (e.g. exam, result, holiday)...">
          
          <div class="category-tabs" style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="secondary-btn active-category-btn" data-category="All" style="padding: 8px 16px; font-size: 0.8rem; border-radius: var(--radius-full);">All</button>
            <button class="secondary-btn" data-category="Exam" style="padding: 8px 16px; font-size: 0.8rem; border-radius: var(--radius-full);">Exams</button>
            <button class="secondary-btn" data-category="Admission" style="padding: 8px 16px; font-size: 0.8rem; border-radius: var(--radius-full);">Admissions</button>
            <button class="secondary-btn" data-category="Academic" style="padding: 8px 16px; font-size: 0.8rem; border-radius: var(--radius-full);">Academic</button>
            <button class="secondary-btn" data-category="Result" style="padding: 8px 16px; font-size: 0.8rem; border-radius: var(--radius-full);">Results</button>
          </div>
        </div>
      </div>

      <!-- Notice List Container -->
      <div class="card" style="min-height: 200px;">
        <h3 class="section-title" id="notice-board-heading" style="margin-bottom: 20px;">Latest Active Notices</h3>
        <div class="notices-list" id="notice-list-container">
          <div class="text-secondary" style="text-align: center; padding: 40px 0;">
            Loading notices...
          </div>
        </div>
      </div>
    </div>
  `;

  // Fetch notices data
  const state = getAppState();
  noticesData = state.notices;

  // Render initial list
  renderFilteredNotices('All', false);

  // Setup Event Listeners
  setupNoticeListeners(container);
}

let activeCategory = 'All';
let showingArchived = false;

function setupNoticeListeners(container) {
  // Search bar
  const searchInput = container.querySelector('#notice-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderFilteredNotices(activeCategory, showingArchived);
    });
  }

  // Category buttons
  const catButtons = container.querySelectorAll('.category-tabs button');
  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle styles
      catButtons.forEach(b => {
        b.classList.remove('active-category-btn');
        b.style.background = 'var(--bg-card)';
        b.style.borderColor = 'var(--border-color)';
        b.style.color = 'var(--text-primary)';
      });
      btn.classList.add('active-category-btn');
      btn.style.background = 'var(--primary-glow)';
      btn.style.borderColor = 'var(--border-color-focus)';
      btn.style.color = 'var(--primary)';

      activeCategory = btn.getAttribute('data-category');
      renderFilteredNotices(activeCategory, showingArchived);
    });
  });

  // Archive toggle
  const archiveBtn = container.querySelector('#toggle-archive-btn');
  if (archiveBtn) {
    archiveBtn.addEventListener('click', () => {
      showingArchived = !showingArchived;
      if (showingArchived) {
        archiveBtn.innerHTML = `<i data-lucide="bell"></i> View Active`;
        archiveBtn.style.borderColor = 'var(--warning)';
        document.getElementById('notice-board-heading').textContent = "Archived Notices";
      } else {
        archiveBtn.innerHTML = `<i data-lucide="archive"></i> View Archived`;
        archiveBtn.style.borderColor = 'var(--border-color)';
        document.getElementById('notice-board-heading').textContent = "Latest Active Notices";
      }
      lucide.createIcons();
      renderFilteredNotices(activeCategory, showingArchived);
    });
  }
}

export function renderFilteredNotices(category = 'All', showArchived = false) {
  const container = document.getElementById('notice-list-container');
  const searchVal = document.getElementById('notice-search-input')?.value.toLowerCase() || '';

  if (!container) return;

  // Filter notices
  const filtered = noticesData.filter(notice => {
    const matchesArchived = notice.isArchived === showArchived;
    const matchesCategory = category === 'All' || notice.category === category;
    const matchesSearch = searchVal === '' || 
                          notice.title.toLowerCase().includes(searchVal) ||
                          notice.description.toLowerCase().includes(searchVal);
    
    return matchesArchived && matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; border-radius: var(--radius-lg); background: rgba(0,0,0,0.1);">
        <i data-lucide="info" style="width: 42px; height: 42px; color: var(--text-secondary); margin-bottom: 12px;"></i>
        <p class="text-secondary" style="font-weight: 500;">No announcements found matching the criteria.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // Sort: pinned notices at top, then by date descending
  const sorted = [...filtered].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.date) - new Date(a.date);
  });

  container.innerHTML = sorted.map(notice => `
    <div class="notice-item ${notice.isPinned ? 'pinned' : ''} category-${notice.category.toLowerCase()}" data-notice-id="${notice.id}">
      <div class="notice-header-row">
        <span class="notice-tag ${notice.category.toLowerCase()}">${notice.category}</span>
        <div style="display: flex; gap: 8px; align-items: center;">
          ${notice.isPinned ? `<span style="font-size: 0.65rem; color: var(--warning); font-weight: 700; display: flex; align-items: center; gap: 2px;"><i data-lucide="pin" style="width: 10px; height: 10px;"></i> PINNED</span>` : ''}
          <span class="notice-date">${notice.date}</span>
        </div>
      </div>
      <h4 class="notice-title">${notice.title}</h4>
      <p class="notice-snippet">${notice.description}</p>
    </div>
  `).join('');

  lucide.createIcons();

  // Attach modal popup
  container.querySelectorAll('.notice-item').forEach(el => {
    el.addEventListener('click', () => {
      const noticeId = el.getAttribute('data-notice-id');
      const notice = noticesData.find(n => n.id === noticeId);
      if (notice) openNoticeModal(notice);
    });
  });
}

export function openNoticeModal(notice) {
  const modal = document.getElementById('universal-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');

  if (!modal || !title || !body) return;

  title.textContent = notice.category + " Notification";
  body.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
        <span class="notice-tag ${notice.category.toLowerCase()}" style="font-size: 0.8rem; padding: 4px 12px;">${notice.category}</span>
        <span class="text-secondary" style="font-size: 0.85rem;"><i data-lucide="calendar" style="width: 14px; height: 14px; display: inline-block; vertical-align: text-bottom; margin-right: 4px;"></i> Date: ${notice.date}</span>
      </div>

      <h3 style="font-size: 1.25rem; font-weight: 800; line-height: 1.4;">${notice.title}</h3>
      
      <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text-primary); white-space: pre-line;">${notice.description}</p>

      ${notice.links && notice.links.length > 0 ? `
        <div style="background: var(--primary-glow); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color-focus); margin-top: 12px;">
          <h5 style="font-weight: 700; color: var(--primary); margin-bottom: 8px;">Actionable Attachments / Portals:</h5>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${notice.links.map(link => `
              <a href="${link.url}" target="_blank" rel="noopener" class="exam-link-item" style="font-size: 0.9rem;">
                <i data-lucide="external-link" style="width: 16px; height: 16px;"></i> ${link.label}
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
        <button class="primary-btn" id="close-notice-modal-btn">Dismiss Notice</button>
      </div>
    </div>
  `;

  lucide.createIcons();
  modal.classList.remove('hidden');

  document.getElementById('close-notice-modal-btn').addEventListener('click', () => {
    modal.classList.add('hidden');
  });
}
