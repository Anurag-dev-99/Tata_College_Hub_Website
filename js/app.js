/* ==========================================
   Tata College Student Hub - Main Coordinator (app.js)
   Global state, SPA routing, Search everywhere,
   theme toggling, PWA installer & views definitions.
   ========================================== */

import { initDashboardView } from './dashboard.js';
import { initPyqView } from './pyq.js';
import { initSyllabusView } from './syllabus.js';
import { initNoticeView, openNoticeModal } from './notices.js';
import { initResultsView } from './results.js';

// Google Apps Script Web App API endpoint (for completely free, serverless form processing)
// Paste your deployed Google Web App URL here (e.g., "https://script.google.com/macros/s/AKfy...exec")
export const SUBMISSION_API_URL = "YOUR_GOOGLE_SCRIPT_WEB_APP_URL";

// Global Application State
const appState = {
  notices: [],
  pyqs: [],
  syllabus: [],
  results: null,
  calendar: [],
  downloadCount: parseInt(localStorage.getItem('tata_global_downloads')) || 24
};

// Expose state and toast to modules
export function getAppState() { return appState; }
export function incrementGlobalDownloadCount() {
  appState.downloadCount++;
  localStorage.setItem('tata_global_downloads', appState.downloadCount);
  const dlBadge = document.getElementById('stat-downloads');
  if (dlBadge) dlBadge.textContent = appState.downloadCount;
}

// Initializer
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  // Register service worker for PWA
  registerServiceWorker();

  // Load state databases (fetch JSON)
  await loadDatabase();

  // Initialize theme (dark/light)
  initTheme();

  // Initialize global search everywhere
  initGlobalSearch();

  // Register routing & hash listeners
  window.addEventListener('hashchange', handleRouting);
  // Initial page load route
  handleRouting();

  // Global elements scroll listeners (back-to-top button)
  initScrollTopHandler();

  // Setup contribution upload handlers
  initUploadFormHandler();

  // Bind custom notice display event (from dashboard clicks)
  window.addEventListener('open-notice', (e) => {
    const noticeId = e.detail;
    const notice = appState.notices.find(n => n.id === noticeId);
    if (notice) openNoticeModal(notice);
  });

  // Highlight active notice badge on notices tab link
  const activeNoticesCount = appState.notices.filter(n => !n.isArchived).length;
  const countBadge = document.getElementById('notices-count-badge');
  if (countBadge) countBadge.textContent = activeNoticesCount;
}

// Service Worker Registration
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('Service Worker registered successfully'))
        .catch(err => console.error('Service Worker registration failed: ', err));
    });
  }

  // PWA Install Prompt Listener
  let deferredPrompt;
  const installBtn = document.getElementById('pwa-install-btn');

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default Chrome prompt
    e.preventDefault();
    deferredPrompt = e;
    // Show premium download button in top bar
    if (installBtn) installBtn.style.display = 'flex';
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install: ${outcome}`);
        deferredPrompt = null;
        installBtn.style.display = 'none';
      }
    });
  }
}



// Fetch JSON data stores asynchronously
async function loadDatabase() {
  try {
    const [noticesRes, pyqsRes, syllabusRes, resultsRes, calendarRes] = await Promise.all([
      fetch('data/notices.json').then(r => r.json()),
      fetch('data/pyqs.json').then(r => r.json()),
      fetch('data/syllabus.json').then(r => r.json()),
      fetch('data/results.json').then(r => r.json()),
      fetch('data/calendar.json').then(r => r.json())
    ]);

    appState.notices = noticesRes;
    appState.pyqs = pyqsRes;
    appState.syllabus = syllabusRes;
    appState.results = resultsRes;
    appState.calendar = calendarRes;
  } catch (err) {
    console.error("Critical error building databases: ", err);
    showToast("Error loading portal datasets. Running in offline/fallback mode.", "warning");
  }
}

// Theme setup
function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle');
  const themeText = document.getElementById('theme-text');
  
  // Set default theme to dark or retrieve from localStorage
  const savedTheme = localStorage.getItem('tata_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeText(savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('tata_theme', newTheme);
      updateThemeText(newTheme);
      showToast(`${newTheme === 'dark' ? 'Dark Mode' : 'Light Mode'} Enabled`, 'info');
      
      // Trigger canvas re-rendering if on results tab
      if (window.location.hash.startsWith('#results')) {
        handleRouting();
      }
    });
  }
}

function updateThemeText(theme) {
  const themeText = document.getElementById('theme-text');
  if (themeText) {
    themeText.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  }
}

// SPA Routing Controller
function handleRouting() {
  const hashString = window.location.hash || '#dashboard';
  const [viewName, queryString] = hashString.split('?');
  
  const cleanViewName = viewName.toLowerCase();
  const pageContainer = document.getElementById('app-view');
  
  if (!pageContainer) return;

  // Clear previous views contents
  pageContainer.innerHTML = '';

  // Extract query parameters
  const queryParams = {};
  if (queryString) {
    queryString.split('&').forEach(param => {
      const [key, val] = param.split('=');
      queryParams[key] = decodeURIComponent(val);
    });
  }

  // Update navigation styles (Sidebar + Mobile tab bar)
  updateNavigationHighlights(cleanViewName);

  // SEO Updates: Document Title & Meta tags dynamically
  updateSeoMetadata(cleanViewName, queryParams);

  // View dispatch
  switch (cleanViewName) {
    case '#dashboard':
      initDashboardView(pageContainer);
      break;
    case '#pyqs':
      initPyqView(pageContainer, queryParams);
      break;
    case '#syllabus':
      initSyllabusView(pageContainer);
      break;
    case '#notices':
      initNoticeView(pageContainer);
      break;
    case '#results':
      initResultsView(pageContainer);
      break;
    case '#calculators':
      initCalculatorsView(pageContainer);
      break;
    case '#departments':
      initDepartmentsView(pageContainer, queryParams);
      break;
    default:
      // Fallback
      initDashboardView(pageContainer);
      break;
  }

  // Hide footer on results page
  const mainFooter = document.querySelector('.main-footer');
  if (mainFooter) {
    if (cleanViewName === '#results') {
      mainFooter.style.display = 'none';
    } else {
      mainFooter.style.display = '';
    }
  }

  // Back to top on route change
  window.scrollTo(0, 0);
}

function updateNavigationHighlights(activeView) {
  const items = document.querySelectorAll('.nav-item, .mobile-nav-item');
  items.forEach(item => {
    const viewAttr = '#' + item.getAttribute('data-view');
    if (viewAttr === activeView) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

function updateSeoMetadata(view, params) {
  let title = "Tata College Student Hub | Previous Papers, Syllabus & Results";
  let description = "Access B.Sc, B.Com, B.A study guides, notices, academic planners and entrance guidelines for Tata College, Chaibasa.";

  switch (view) {
    case '#dashboard':
      title = "Dashboard | Tata College Student Hub";
      break;
    case '#pyqs':
      title = params.sem ? `Sem ${params.sem} Question Papers | Tata College Student Hub` : "Previous Year Question Papers | Tata College Student Hub";
      description = "Search and download official Semester examination question papers of Tata College.";
      break;
    case '#syllabus':
      title = "Syllabus Explorer | Tata College Student Hub";
      description = "Official FYUGP NEP-2020 syllabus structures for Science, Commerce, and Arts subjects.";
      break;
    case '#notices':
      title = "Notice Board | Tata College Student Hub";
      description = "Check the latest holiday notices, registration slip declarations, and exams dates.";
      break;
    case '#results':
      title = "Result & Analysis | Tata College Student Hub";
      description = "Compare pass percentages of Tata College departments. Real-time CGPA calculations.";
      break;
    case '#calculators':
      title = "Student Calculators | Tata College Student Hub";
      description = "Compute target class attendance levels and cumulative semester CGPA scores.";
      break;
    case '#departments':
      title = params.name ? `${params.name} Department | Tata College Student Hub` : "Departments | Tata College Student Hub";
      break;
  }

  document.title = title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', description);
}

// Combined calculators dashboard view
function initCalculatorsView(container) {
  container.innerHTML = `
    <div class="animated-slide-up">
      <div class="page-title-section">
        <div>
          <h2 class="page-title">CGPA Calculator</h2>
          <p class="page-subtitle">Convert your semester SGPA scores into a cumulative CGPA offline.</p>
        </div>
      </div>

      <div style="max-width: 600px; margin: 0 auto;">
        <!-- Render CGPA -->
        <div class="card calc-card" id="calcs-cgpa-wrapper">
          <!-- Dynamically populated -->
        </div>
      </div>
    </div>
  `;

  // Inject CGPA Calculator DOM
  const cgpaWrap = container.querySelector('#calcs-cgpa-wrapper');
  cgpaWrap.innerHTML = `
    <h3><i data-lucide="calculator" style="color: var(--primary);"></i> CGPA Cumulative Calculator</h3>
    <p class="text-secondary" style="font-size: 0.8rem; margin-bottom: 16px;">Enter your SGPA and Credits for each semester to compute your cumulative CGPA.</p>
    
    <div style="display: flex; gap: 12px; padding: 0 12px 6px 12px; border-bottom: 1px solid var(--border-color); margin-bottom: 8px; font-weight: 700; font-size: 0.8rem; color: var(--text-secondary);">
      <span style="min-width: 100px;">Semester</span>
      <span style="width: 90px; text-align: center;">SGPA</span>
      <span style="width: 90px; text-align: center;">Credits</span>
    </div>

    <div class="cgpa-semesters-list" id="tools-cgpa-rows"></div>
    <button class="primary-btn full-btn" id="tools-calculate-cgpa-btn">Compute CGPA</button>
    <div class="calc-result-box" id="tools-cgpa-result-box" style="margin-top: 16px;">
      <span class="calc-result-title">Cumulative CGPA</span>
      <span class="calc-result-value" id="tools-cgpa-result-val">0.00</span>
      <span class="calc-result-helper" id="tools-cgpa-result-helper">Enter semester details to compute.</span>
    </div>
  `;

  lucide.createIcons();

  // Populate rows
  const cgpaRows = container.querySelector('#tools-cgpa-rows');
  const savedSgpa = JSON.parse(localStorage.getItem('tata_sgpas')) || {};
  let html = '';
  for (let sem = 1; sem <= 6; sem++) {
    const val = savedSgpa[`sem_${sem}`] || '';
    const credits = savedSgpa[`credits_${sem}`] || '20'; // Default to 20 credits as per Jharkhand regulation
    html += `
      <div class="cgpa-sem-row">
        <span class="cgpa-sem-label">Semester ${sem}</span>
        <input type="number" step="0.01" min="0" max="10" placeholder="SGPA" class="tools-cgpa-input" data-sem="${sem}" value="${val}">
        <input type="number" step="1" min="1" max="50" placeholder="Credits" class="tools-cgpa-credit" data-sem="${sem}" value="${credits}">
      </div>
    `;
  }
  cgpaRows.innerHTML = html;

  // Bind CGPA button
  container.querySelector('#tools-calculate-cgpa-btn').addEventListener('click', () => {
    const fields = container.querySelectorAll('.tools-cgpa-input');
    let sumWeightedPoints = 0;
    let sumCredits = 0;
    let count = 0;
    const currentSgpas = JSON.parse(localStorage.getItem('tata_sgpas')) || {};

    fields.forEach(field => {
      const sem = field.getAttribute('data-sem');
      const sgpaVal = parseFloat(field.value);
      
      // Get the corresponding credit input
      const creditField = container.querySelector(`.tools-cgpa-credit[data-sem="${sem}"]`);
      const creditVal = creditField ? parseFloat(creditField.value) : 20;

      if (!isNaN(sgpaVal) && sgpaVal > 0) {
        if (sgpaVal > 10) {
          showToast(`SGPA for Semester ${sem} cannot exceed 10.0`, 'warning');
          return;
        }
        if (isNaN(creditVal) || creditVal <= 0) {
          showToast(`Credits for Semester ${sem} must be a positive number`, 'warning');
          return;
        }

        sumWeightedPoints += sgpaVal * creditVal;
        sumCredits += creditVal;
        count++;

        currentSgpas[`sem_${sem}`] = sgpaVal;
        currentSgpas[`credits_${sem}`] = creditVal;
      } else {
        delete currentSgpas[`sem_${sem}`];
        if (creditField && !isNaN(creditVal)) {
          currentSgpas[`credits_${sem}`] = creditVal;
        }
      }
    });

    localStorage.setItem('tata_sgpas', JSON.stringify(currentSgpas));
    const valEl = document.getElementById('tools-cgpa-result-val');
    const helperEl = document.getElementById('tools-cgpa-result-helper');

    if (count === 0) {
      valEl.textContent = "0.00";
      helperEl.textContent = "Please enter SGPA in at least one semester.";
      return;
    }
    const cgpa = sumWeightedPoints / sumCredits;
    valEl.textContent = cgpa.toFixed(2);

    // Map to Grades and Classes as per Table No. 7 Jharkhand FYUGP NEP Regulations
    let gradeLetter = 'F';
    let desc = 'Fail';
    if (cgpa >= 9.0) { gradeLetter = 'O (Outstanding)'; desc = 'First Class with Distinction'; }
    else if (cgpa >= 8.0) { gradeLetter = 'A+ (Excellent)'; desc = 'First Class with Distinction'; }
    else if (cgpa >= 7.0) { gradeLetter = 'A (Very Good)'; desc = 'First Class'; }
    else if (cgpa >= 6.0) { gradeLetter = 'B+ (Good)'; desc = 'First Class / Good'; }
    else if (cgpa >= 5.0) { gradeLetter = 'B (Above Average)'; desc = 'Second Class'; }
    else if (cgpa >= 4.5) { gradeLetter = 'C (Average)'; desc = 'Second Class'; }
    else if (cgpa >= 4.0) { gradeLetter = 'P (Pass)'; desc = 'Second Class / Pass'; }

    helperEl.textContent = `Overall Grade: ${gradeLetter}. ${desc} (${count} Semesters, Total Credits: ${sumCredits}).`;
    showToast(`CGPA computed: ${cgpa.toFixed(2)}`, 'success');
  });
}

// Department details page loader
function initDepartmentsView(container, params) {
  const deptName = params.name || 'Mathematics';
  
  // Custom metadata for department headers
  const deptsInfo = {
    'Mathematics': {
      head: 'Prof. S. K. Mahato',
      office: 'Science Block, Room 102',
      email: 'math.tatacollege@gmail.com',
      desc: 'The Department of Mathematics provides robust education in pure and applied mathematics, preparing students for exams like IIT JAM, NIMCET, and CSIR NET.',
      topper: 'Animesh Mahato (89.4%)'
    },
    'Physics': {
      head: 'Dr. M. C. Singh',
      office: 'Physics Block, Ground Floor',
      email: 'physics.tatacollege@gmail.com',
      desc: 'Focusing on conceptual physics and research fundamentals, with fully equipped laboratories for optics, electronics, and quantum mechanics.',
      topper: 'Rohan Deogam (86.1%)'
    },
    'Chemistry': {
      head: 'Prof. J. N. Pingua',
      office: 'Science Block, West Wing',
      email: 'chem.tatacollege@gmail.com',
      desc: 'Guiding students in laboratory safety, organic synthesis, physical theories and analytic chemistry methodologies.',
      topper: 'Sourav Kar (88.0%)'
    },
    'Commerce': {
      head: 'Prof. R. P. Agrawal',
      office: 'Commerce Building, Room 12',
      email: 'commerce.tatacollege@gmail.com',
      desc: 'Preparing students for industrial roles, charter accounting, and banking exams through dedicated corporate modules.',
      topper: 'Pooja Agrawal (91.2%)'
    },
    'Arts': {
      head: 'Dr. A. Birua (Dean)',
      office: 'Arts Block, Room 05',
      email: 'arts.tatacollege@gmail.com',
      desc: 'Housing the History, Political Science, Geography and English Literature majors, fostering deep cultural understanding.',
      topper: 'Deepak Sinku (82.3%)'
    }
  };

  const info = deptsInfo[deptName] || deptsInfo['Mathematics'];

  container.innerHTML = `
    <div class="animated-slide-up">
      <div class="page-title-section">
        <div>
          <h2 class="page-title">Department of ${deptName}</h2>
          <p class="page-subtitle">Tata College, Chaibasa</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="#pyqs?dept=${deptName}" class="primary-btn">
            <i data-lucide="file-text"></i> Filter PYQs
          </a>
          <a href="#syllabus" class="secondary-btn">
            <i data-lucide="book-open"></i> Get Syllabus
          </a>
        </div>
      </div>

      <div class="pg-section">
        <!-- Left details -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <div class="card">
            <h3 class="section-title" style="margin-bottom: 12px;"><i data-lucide="info"></i> About the Department</h3>
            <p class="text-secondary" style="font-size: 0.95rem; line-height: 1.6;">${info.desc}</p>
          </div>

          <div class="card">
            <h3 class="section-title" style="margin-bottom: 16px;"><i data-lucide="users"></i> Department Faculty</h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 16px; padding: 12px; background: rgba(0,0,0,0.1); border-radius: var(--radius-md);">
                <div class="avatar" style="width: 44px; height: 44px; font-size: 1.1rem;">${info.head.split('.').pop().trim().charAt(0)}</div>
                <div>
                  <h4 style="font-weight: 700; font-size: 0.95rem;">${info.head}</h4>
                  <p class="text-secondary" style="font-size: 0.8rem;">Head of Department (HOD)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right info -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <div class="card">
            <h3 class="section-title" style="margin-bottom: 12px;"><i data-lucide="map-pin"></i> Office Location</h3>
            <p style="font-weight: 600; font-size: 0.9rem;">${info.office}</p>
            <p class="text-secondary" style="font-size: 0.8rem; margin-top: 4px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">Tata College Main Campus</p>
            <p style="font-size: 0.8rem; color: var(--primary); font-weight: 600; margin-top: 12px; display: flex; align-items: center; gap: 6px;">
              <i data-lucide="mail" style="width: 14px; height: 14px;"></i> ${info.email}
            </p>
          </div>

          <div class="card">
            <h3 class="section-title" style="margin-bottom: 12px;"><i data-lucide="award" style="color: var(--warning);"></i> Academic Topper</h3>
            <div style="display: flex; align-items: center; gap: 12px; background: var(--warning-glow); border: 1px dashed var(--warning); padding: 12px; border-radius: var(--radius-md);">
              <i data-lucide="trophy" style="color: var(--warning); width: 24px; height: 24px;"></i>
              <div>
                <p style="font-weight: 700; font-size: 0.9rem;">${info.topper}</p>
                <p style="font-size: 0.75rem; color: var(--text-secondary);">Latest Semester Examinations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();
}

// Global search box functionalities
function initGlobalSearch() {
  const searchInput = document.getElementById('global-search-input');
  const dropdown = document.getElementById('search-dropdown');
  const mobileSearchBtn = document.getElementById('mobile-search-btn');
  const searchBackBtn = document.getElementById('search-back-btn');
  const topBar = document.querySelector('.top-bar');

  if (!searchInput || !dropdown) return;

  if (mobileSearchBtn && topBar) {
    mobileSearchBtn.addEventListener('click', () => {
      topBar.classList.add('search-active');
      setTimeout(() => searchInput.focus(), 50);
    });
  }

  if (searchBackBtn && topBar) {
    searchBackBtn.addEventListener('click', () => {
      topBar.classList.remove('search-active');
      searchInput.value = '';
      dropdown.classList.add('hidden');
      dropdown.innerHTML = '';
    });
  }

  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase().trim();
    
    if (val.length < 2) {
      dropdown.classList.add('hidden');
      dropdown.innerHTML = '';
      return;
    }

    // Filter elements
    const matchedPyqs = appState.pyqs.filter(p => p.title.toLowerCase().includes(val) || p.subject.toLowerCase().includes(val)).slice(0, 3);
    const matchedSyllabus = appState.syllabus.filter(s => s.title.toLowerCase().includes(val) || s.department.toLowerCase().includes(val)).slice(0, 2);
    const matchedNotices = appState.notices.filter(n => n.title.toLowerCase().includes(val) || n.description.toLowerCase().includes(val)).slice(0, 2);

    const totalMatches = matchedPyqs.length + matchedSyllabus.length + matchedNotices.length;

    if (totalMatches === 0) {
      dropdown.innerHTML = `<div class="no-search-results">No matches found for "${e.target.value}"</div>`;
      dropdown.classList.remove('hidden');
      return;
    }

    let html = '';

    if (matchedPyqs.length > 0) {
      html += `<div class="search-result-group">
        <div class="search-result-group-title">Exam Papers (PYQs)</div>`;
      matchedPyqs.forEach(p => {
        html += `<div class="search-result-item" data-action="pyq" data-id="${p.id}">
          <i data-lucide="file-text"></i>
          <span>${p.title}</span>
          <span class="meta">Sem ${p.semester}</span>
        </div>`;
      });
      html += `</div>`;
    }

    if (matchedSyllabus.length > 0) {
      html += `<div class="search-result-group">
        <div class="search-result-group-title">Syllabus Explorer</div>`;
      matchedSyllabus.forEach(s => {
        html += `<div class="search-result-item" data-action="syl" data-id="${s.id}">
          <i data-lucide="book-open"></i>
          <span>${s.title}</span>
          <span class="meta">${s.department}</span>
        </div>`;
      });
      html += `</div>`;
    }

    if (matchedNotices.length > 0) {
      html += `<div class="search-result-group">
        <div class="search-result-group-title">Notice Board</div>`;
      matchedNotices.forEach(n => {
        html += `<div class="search-result-item" data-action="notice" data-id="${n.id}">
          <i data-lucide="bell"></i>
          <span>${n.title}</span>
          <span class="meta">${n.date}</span>
        </div>`;
      });
      html += `</div>`;
    }

    dropdown.innerHTML = html;
    lucide.createIcons();
    dropdown.classList.remove('hidden');

    // Attach item clicks
    dropdown.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.getAttribute('data-action');
        const itemId = item.getAttribute('data-id');

        dropdown.classList.add('hidden');
        searchInput.value = '';
        if (topBar) {
          topBar.classList.remove('search-active');
        }

        if (action === 'pyq') {
          window.location.hash = `#pyqs`;
        } else if (action === 'syl') {
          window.location.hash = `#syllabus`;
        } else if (action === 'notice') {
          window.location.hash = `#notices`;
          // Trigger notice modal opening
          setTimeout(() => {
            const notice = appState.notices.find(n => n.id === itemId);
            if (notice) openNoticeModal(notice);
          }, 100);
        }
      });
    });
  });

  // Hide search dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target) && (!mobileSearchBtn || !mobileSearchBtn.contains(e.target))) {
      dropdown.classList.add('hidden');
      if (topBar && window.innerWidth <= 768) {
        topBar.classList.remove('search-active');
      }
    }
  });
}

// Upload dynamic form modal logic
function initUploadFormHandler() {
  const modal = document.getElementById('upload-modal');
  const closeBtn = document.getElementById('close-upload-btn');
  const form = document.getElementById('upload-resource-form');
  const dragArea = document.getElementById('file-drag-area');
  const fileInput = document.getElementById('upload-file');
  const selectedFileName = document.getElementById('selected-file-name');

  if (!modal || !closeBtn || !form || !dragArea || !fileInput) return;

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    form.reset();
    selectedFileName.classList.add('hidden');
  });

  // Drag and drop events
  dragArea.addEventListener('click', () => fileInput.click());
  
  dragArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dragArea.classList.add('drag-over');
  });

  dragArea.addEventListener('dragleave', () => {
    dragArea.classList.remove('drag-over');
  });

  dragArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dragArea.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      updateFileNameIndicator(fileInput.files[0].name);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      updateFileNameIndicator(fileInput.files[0].name);
    }
  });

  function updateFileNameIndicator(name) {
    selectedFileName.textContent = `Attached: ${name}`;
    selectedFileName.classList.remove('hidden');
  }

  // Handle submit form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('upload-title').value;
    const dept = document.getElementById('upload-dept').value;
    const sem = document.getElementById('upload-sem').value;
    const type = document.getElementById('upload-type').value;
    const contributor = document.getElementById('upload-contributor').value || 'Anonymous';
    const file = fileInput.files[0];

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading...";

    try {
      let fileData = null;
      let fileName = null;
      let fileType = null;

      if (file) {
        fileName = file.name;
        fileType = file.type;
        fileData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      }

      const payload = {
        formType: "upload",
        title,
        department: dept,
        semester: sem,
        resourceType: type,
        contributor,
        fileName,
        fileType,
        fileData
      };

      if (SUBMISSION_API_URL && SUBMISSION_API_URL !== "YOUR_GOOGLE_SCRIPT_WEB_APP_URL") {
        const response = await fetch(SUBMISSION_API_URL, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });

        const resData = await response.json();
        if (resData.status === "success") {
          showToast(`Successfully uploaded "${title}" for moderator review!`, 'success');
          showToast(`Thank you, ${contributor}, for contributing to Tata College!`, 'info');
        } else {
          console.error("Submission failed: ", resData.message);
          showToast(`Upload failed: ${resData.message}. Saving locally for now.`, 'warning');
        }
      } else {
        // Fallback simulated submission for developer mode
        console.log("Simulating submission payload: ", payload);
        showToast(`Successfully uploaded "${title}" for review! (Simulated)`, 'success');
        showToast(`Thank you, ${contributor}, for contributing to Tata College!`, 'info');
      }

      modal.classList.add('hidden');
      form.reset();
      selectedFileName.classList.add('hidden');

    } catch (err) {
      console.error("Upload error: ", err);
      showToast("Error processing file upload. Please try again.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
}

// Scroll Top Button logic
function initScrollTopHandler() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.remove('hidden');
    } else {
      btn.classList.add('hidden');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Toast notification helper
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'info';
  if (type === 'success') icon = 'check-circle';
  else if (type === 'warning') icon = 'alert-triangle';
  else if (type === 'error') icon = 'x-circle';

  toast.innerHTML = `
    <i data-lucide="${icon}" style="width: 18px; height: 18px; flex-shrink: 0;"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  // Auto remove toast after 4s
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}
