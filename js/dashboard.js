/* ==========================================
   Tata College Student Hub - Dashboard Module
   Handles bookmarks, recent history, latest notices,
   and dynamic academic calendar events.
   ========================================== */

import { showToast, getAppState } from './app.js';

export function initDashboardView(container) {
  const state = getAppState();

  // Render HTML structure
  container.innerHTML = `
    <div class="animated-slide-up">
      <div class="page-title-section">
        <div>
          <h2 class="page-title">Welcome back, Student</h2>
          <p class="page-subtitle">Your personal dashboard for Tata College resources.</p>
        </div>
        <a href="#pyqs" class="primary-btn">
          <i data-lucide="search"></i> Find Papers
        </a>
      </div>

      <!-- Quick Semester Navigator -->
      <div class="semester-nav-section">
        <div class="section-heading-row">
          <h3 class="section-title"><i data-lucide="compass"></i> Semester Quick Explorer</h3>
          <span class="text-secondary" style="font-size: 0.85rem;">Find everything for your semester</span>
        </div>
        <div class="semester-grid">
          <button class="sem-btn" data-sem="1">Sem 1</button>
          <button class="sem-btn" data-sem="2">Sem 2</button>
          <button class="sem-btn" data-sem="3">Sem 3</button>
          <button class="sem-btn" data-sem="4">Sem 4</button>
          <button class="sem-btn" data-sem="5">Sem 5</button>
          <button class="sem-btn" data-sem="6">Sem 6</button>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Left Column: Top 5 Notices and Saved/Recent Items -->
        <div class="dashboard-left-col" style="display: flex; flex-direction: column; gap: 24px;">
          
          <!-- Latest Notices Section (Top 5) -->
          <div class="card">
            <h3 class="section-title" style="margin-bottom: 16px;">
              <i data-lucide="bell" style="color: var(--primary);"></i> Latest College Notices & Updates
            </h3>
            <div class="notices-list" id="dashboard-latest-notices">
              <!-- Rendered dynamically -->
            </div>
          </div>

          <!-- Bookmarked & Saved PYQs/Syllabus -->
          <div class="card">
            <h3 class="section-title" style="margin-bottom: 16px;">
              <i data-lucide="bookmark" style="color: var(--primary);"></i> Your Saved Resources
            </h3>
            <div id="saved-resources-container">
              <p class="text-secondary" style="font-size: 0.9rem;">You haven't bookmarked any resources yet. Click the bookmark icon on any paper or syllabus to see them here.</p>
            </div>
          </div>

          <!-- Recently Viewed History -->
          <div class="card">
            <h3 class="section-title" style="margin-bottom: 16px;">
              <i data-lucide="history"></i> Recently Viewed
            </h3>
            <div id="recent-resources-container">
              <p class="text-secondary" style="font-size: 0.9rem;">No recently viewed items. Try exploring syllabuses or PYQs to track your history.</p>
            </div>
          </div>

        </div>

        <!-- Right Column: Academic Calendar & Quick Links -->
        <div class="dashboard-right-col" style="display: flex; flex-direction: column; gap: 24px;">
          
          <!-- Dynamic Academic Calendar Widget -->
          <div class="card calendar-card">
            <h3 class="section-title"><i data-lucide="calendar"></i> Upcoming Dates</h3>
            <div class="calendar-timeline" id="dashboard-upcoming-dates">
              <!-- Rendered dynamically from calendar.json -->
            </div>
          </div>

          <!-- Important Links Section -->
          <div class="card">
            <h3 class="section-title" style="margin-bottom: 12px;"><i data-lucide="link"></i> Quick Links</h3>
            <div class="exam-links-list">
              <a href="https://www.kolhanuniversity.ac.in/" target="_blank" rel="noopener" class="exam-link-item">
                <i data-lucide="external-link"></i> Kolhan University Official
              </a>
              <a href="https://www.kuuniv.in/login" target="_blank" rel="noopener" class="exam-link-item">
                <i data-lucide="external-link"></i> KU Results Portal
              </a>
              <a href="https://universities.jharkhand.gov.in/home" target="_blank" rel="noopener" class="exam-link-item">
                <i data-lucide="external-link"></i> Chancellor Portal (Admissions)
              </a>
              <a href="https://ekalyan.cgg.gov.in/" target="_blank" rel="noopener" class="exam-link-item">
                <i data-lucide="external-link"></i> e-Kalyan Scholarship Portal
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  // Register Lucide Icons inside dynamically generated content
  lucide.createIcons();

  // Populate dynamic elements
  renderDashboardNotices(state.notices);
  renderDashboardCalendar(state.calendar);
  renderDashboardSavedList();

  // Setup Event Listeners
  setupDashboardListeners(container);
}

function renderDashboardNotices(notices) {
  const container = document.getElementById('dashboard-latest-notices');
  if (!container) return;

  // Filter out archived ones
  const active = notices.filter(n => !n.isArchived);
  
  if (active.length === 0) {
    container.innerHTML = `<p class="text-secondary" style="font-size: 0.85rem;">No notices at the moment.</p>`;
    return;
  }

  // Sort: pinned notices at top, then by date descending, limit to 5
  const sorted = [...active].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.date) - new Date(a.date);
  }).slice(0, 5);

  container.innerHTML = sorted.map(notice => {
    const hasLinks = notice.links && notice.links.length > 0;
    return `
      <div class="notice-item ${notice.isPinned ? 'pinned' : ''} category-${notice.category.toLowerCase()}" data-notice-id="${notice.id}" style="cursor: pointer; padding: 18px; margin-bottom: 12px; border-radius: var(--radius-md);">
        <div class="notice-header-row" style="margin-bottom: 8px;">
          <span class="notice-tag ${notice.category.toLowerCase()}">${notice.category}</span>
          <div style="display: flex; gap: 8px; align-items: center;">
            ${notice.isPinned ? `<span style="font-size: 0.65rem; color: var(--warning); font-weight: 700; display: flex; align-items: center; gap: 2px;"><i data-lucide="pin" style="width: 10px; height: 10px;"></i> PINNED</span>` : ''}
            <span class="notice-date">${notice.date}</span>
          </div>
        </div>
        <h4 class="notice-title" style="font-size: 1.05rem; font-weight: 700; margin-bottom: 6px; line-height: 1.4;">${notice.title}</h4>
        <p class="text-secondary" style="font-size: 0.85rem; line-height: 1.5; margin-bottom: 10px;">${notice.description}</p>
        
        ${hasLinks ? `
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
            ${notice.links.map(link => `
              <a href="${link.url}" target="_blank" rel="noopener" class="secondary-btn" style="padding: 4px 10px; font-size: 0.75rem; border-radius: var(--radius-sm);" onclick="event.stopPropagation();">
                <i data-lucide="external-link" style="width: 12px; height: 12px;"></i> ${link.label}
              </a>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  lucide.createIcons();

  // Register click events to open notice modals
  container.querySelectorAll('.notice-item').forEach(el => {
    el.addEventListener('click', (e) => {
      // If clicked on an action link, don't open modal
      if (e.target.closest('a')) return;
      
      const noticeId = el.getAttribute('data-notice-id');
      const event = new CustomEvent('open-notice', { detail: noticeId });
      window.dispatchEvent(event);
    });
  });
}

function renderDashboardCalendar(events) {
  const container = document.getElementById('dashboard-upcoming-dates');
  if (!container) return;

  if (!events || events.length === 0) {
    container.innerHTML = `<p class="text-secondary" style="font-size: 0.85rem;">No upcoming academic events scheduled.</p>`;
    return;
  }

  container.innerHTML = events.map(event => `
    <div class="calendar-event">
      <div class="cal-date-badge">
        <span class="day">${event.day}</span>
        <span class="month">${event.month}</span>
      </div>
      <div class="cal-details">
        <span class="cal-title">${event.title}</span>
        <span class="cal-desc">${event.desc}</span>
      </div>
    </div>
  `).join('');
}

export function renderDashboardSavedList() {
  const savedContainer = document.getElementById('saved-resources-container');
  const recentContainer = document.getElementById('recent-resources-container');
  
  const savedPyqs = JSON.parse(localStorage.getItem('tata_saved_pyqs')) || [];
  const savedSyllabus = JSON.parse(localStorage.getItem('tata_saved_syllabus')) || [];
  const recentViewed = JSON.parse(localStorage.getItem('tata_recent_viewed')) || [];

  const totalBookmarks = savedPyqs.length + savedSyllabus.length;

  // Render saved
  if (totalBookmarks === 0) {
    if (savedContainer) {
      savedContainer.innerHTML = `<p class="text-muted" style="font-size: 0.85rem; text-align: center; padding: 12px 0;">No bookmarked items. Explore papers or syllabi and bookmark them.</p>`;
    }
  } else {
    let savedHtml = '<div style="display: flex; flex-direction: column; gap: 10px;">';
    
    savedPyqs.forEach(item => {
      savedHtml += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border-left: 3px solid var(--primary);">
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <a href="#pyqs" style="font-size: 0.85rem; font-weight: 600; hover: underline;">${item.title}</a>
            <span style="font-size: 0.75rem; color: var(--text-secondary);">${item.department} • Sem ${item.semester}</span>
          </div>
          <button class="secondary-btn btn-icon-only remove-saved-btn" data-type="pyq" data-id="${item.id}" title="Remove Bookmark">
            <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--danger);"></i>
          </button>
        </div>
      `;
    });

    savedSyllabus.forEach(item => {
      savedHtml += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border-left: 3px solid var(--info);">
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <a href="#syllabus" style="font-size: 0.85rem; font-weight: 600; hover: underline;">${item.title}</a>
            <span style="font-size: 0.75rem; color: var(--text-secondary);">${item.department}</span>
          </div>
          <button class="secondary-btn btn-icon-only remove-saved-btn" data-type="syllabus" data-id="${item.id}" title="Remove Bookmark">
            <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--danger);"></i>
          </button>
        </div>
      `;
    });

    savedHtml += '</div>';
    if (savedContainer) savedContainer.innerHTML = savedHtml;
  }

  // Render recent history
  if (recentViewed.length === 0) {
    if (recentContainer) {
      recentContainer.innerHTML = `<p class="text-muted" style="font-size: 0.85rem; text-align: center; padding: 12px 0;">No history yet. Downloads and Syllabus clicks are tracked here.</p>`;
    }
  } else {
    let recentHtml = '<div style="display: flex; flex-direction: column; gap: 8px;">';
    recentViewed.forEach(item => {
      const icon = item.type === 'pyq' ? 'file-text' : 'book-open';
      const path = item.type === 'pyq' ? '#pyqs' : '#syllabus';
      recentHtml += `
        <div style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: var(--radius-sm); background: rgba(255,255,255,0.01);">
          <i data-lucide="${icon}" style="width: 16px; height: 16px; color: var(--text-secondary);"></i>
          <div style="display: flex; flex-direction: column; gap: 1px;">
            <a href="${path}" style="font-size: 0.85rem; font-weight: 500;">${item.title}</a>
            <span style="font-size: 0.7rem; color: var(--text-muted);">Viewed ${item.viewedAt}</span>
          </div>
        </div>
      `;
    });
    recentHtml += '</div>';
    if (recentContainer) recentContainer.innerHTML = recentHtml;
  }

  lucide.createIcons();
  setupSavedListRemovers();
}

function setupSavedListRemovers() {
  document.querySelectorAll('.remove-saved-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const type = btn.getAttribute('data-type');
      const id = btn.getAttribute('data-id');
      
      if (type === 'pyq') {
        let list = JSON.parse(localStorage.getItem('tata_saved_pyqs')) || [];
        list = list.filter(item => item.id !== id);
        localStorage.setItem('tata_saved_pyqs', JSON.stringify(list));
      } else {
        let list = JSON.parse(localStorage.getItem('tata_saved_syllabus')) || [];
        list = list.filter(item => item.id !== id);
        localStorage.setItem('tata_saved_syllabus', JSON.stringify(list));
      }
      showToast('Removed bookmark successfully', 'info');
      renderDashboardSavedList();
    });
  });
}

function setupDashboardListeners(container) {
  // Semester quick navigator buttons click
  container.querySelectorAll('.sem-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const semester = btn.getAttribute('data-sem');
      window.location.hash = `#pyqs?sem=${semester}`;
    });
  });
}

// Log recently viewed items to localStorage helper
export function logRecentlyViewed(id, title, type) {
  let list = JSON.parse(localStorage.getItem('tata_recent_viewed')) || [];
  
  // Remove duplicate
  list = list.filter(item => item.id !== id);

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
  
  list.unshift({
    id,
    title,
    type,
    viewedAt: timestamp
  });

  // Limit to 5 items
  if (list.length > 5) list.pop();

  localStorage.setItem('tata_recent_viewed', JSON.stringify(list));
  
  // Refresh dashboard saved list if active
  const recentContainer = document.getElementById('recent-resources-container');
  if (recentContainer) {
    renderDashboardSavedList();
  }
}
