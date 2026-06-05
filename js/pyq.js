/* ==========================================
   Tata College Student Hub - PYQ Module
   Redesigned User Flow & Multi-Column Layout
   ========================================== */

import { showToast, getAppState, incrementGlobalDownloadCount, SUBMISSION_API_URL } from './app.js';
import { logRecentlyViewed } from './dashboard.js';

// State variables for routing and filter states
let pyqData = [];
let activeCategory = 'Major';
let activeSubject = 'Mathematics';
let activeSemester = 1;

// Mobile Navigation State: 'categories', 'subjects', 'semesters', 'papers'
let mobileStep = 'categories'; 

// Data mapping of subjects available per category (Kolhan University NEP 2020)
const categorySubjects = {
  'Major': ['Mathematics', 'Physics', 'Chemistry', 'Botany', 'Zoology', 'Commerce', 'History', 'Political Science', 'English'],
  'Minor': ['Mathematics', 'Physics', 'Chemistry', 'Botany', 'Zoology', 'Commerce', 'History', 'Political Science', 'English'],
  'MDC': ['Hindi', 'English', 'History', 'Political Science', 'Sociology', 'Philosophy', 'Psychology', 'Physics', 'Chemistry', 'Botany', 'Zoology', 'Mathematics', 'Commerce', 'Cyber Defense', 'Labour & Social Welfare'],
  'SEC': ['Digital Education', 'Cyber Defense', 'Entrepreneurship', 'Python Programming', 'Office Automation'],
  'VAC': ['Environmental Studies', 'Understanding India', 'Digital Education', 'Health & Wellness'],
  'AEC': ['English Communication', 'Hindi Communication', 'Cyber Defense', 'Labour & Social Welfare']
};

const pyqFolderLinks = {
  'Major': {
    'Mathematics': {
      3: 'https://drive.google.com/drive/folders/1fTd2QZqbJNqS0y4cMwBafFBZwc_wiNne?usp=sharing',
      4: 'https://drive.google.com/drive/folders/19CrozvOQtzt_QOC164YWAhAnAxSXY13Z?usp=sharing'
    }
  }
};




export async function initPyqView(container, queryParams = {}) {
  // Fetch actual JSON data
  if (pyqData.length === 0) {
    try {
      const response = await fetch('data/pyqs.json');
      pyqData = await response.json();
    } catch (err) {
      console.error("Error fetching PYQs data: ", err);
      showToast("Failed to load question papers.", "error");
      return;
    }
  }

  // Pre-fill state if query params are present
  if (queryParams.sem) {
    activeSemester = parseInt(queryParams.sem);
    mobileStep = 'papers';
  }
  if (queryParams.dept) {
    activeSubject = queryParams.dept;
    mobileStep = 'semesters';
    
    // Find category of query subject
    for (const [cat, subjs] of Object.entries(categorySubjects)) {
      if (subjs.includes(queryParams.dept)) {
        activeCategory = cat;
        break;
      }
    }
  }

  renderMainLayout(container);
}

function renderMainLayout(container) {
  container.innerHTML = `
    <div class="animated-slide-up">
      
      <!-- Top Mobile Navigation Header -->
      <div class="page-title-section" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <button class="pyq-mobile-back-btn" id="pyq-back-btn" aria-label="Go Back">
            <i data-lucide="arrow-left"></i>
          </button>
          <div>
            <h2 class="page-title" id="pyq-main-title">Previous Year Papers</h2>
            <p class="page-subtitle" id="pyq-main-subtitle">Access major, minor, and multidisciplinary papers.</p>
          </div>
        </div>
      </div>

      <!-- Main Columns Grid Container (4 columns on Desktop) -->
      <div class="pyq-redesign-container" id="pyq-grid-wrapper">
        
        <!-- Column 1: Course Category Selector -->
        <div class="pyq-panel" id="panel-categories">
          <div class="card" id="card-categories-sec" style="padding: 16px;">
            <h3 class="pyq-subject-section-title" style="margin-top: 4px;">Choose Course Category</h3>
            <div class="pyq-categories-list">
              <button class="pyq-cat-btn ${activeCategory === 'Major' ? 'active' : ''}" data-cat="Major">
                <span>Major Paper</span> <i data-lucide="chevron-right"></i>
              </button>
              <button class="pyq-cat-btn ${activeCategory === 'Minor' ? 'active' : ''}" data-cat="Minor">
                <span>Minor Paper</span> <i data-lucide="chevron-right"></i>
              </button>
              <button class="pyq-cat-btn ${activeCategory === 'MDC' ? 'active' : ''}" data-cat="MDC">
                <span>MDC Paper</span> <i data-lucide="chevron-right"></i>
              </button>
              <button class="pyq-cat-btn ${activeCategory === 'SEC' ? 'active' : ''}" data-cat="SEC">
                <span>SEC Paper</span> <i data-lucide="chevron-right"></i>
              </button>
              <button class="pyq-cat-btn ${activeCategory === 'VAC' ? 'active' : ''}" data-cat="VAC">
                <span>VAC Paper</span> <i data-lucide="chevron-right"></i>
              </button>
              <button class="pyq-cat-btn ${activeCategory === 'AEC' ? 'active' : ''}" data-cat="AEC">
                <span>AEC Paper</span> <i data-lucide="chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Column 2: Subject Selection List -->
        <div class="pyq-panel" id="panel-subjects">
          <div class="card" id="card-subjects-sec" style="padding: 16px;">
            <h3 class="pyq-subject-section-title" id="subject-list-title" style="margin-top: 4px;">Subjects List</h3>
            <div class="pyq-subjects-list" id="subjects-container-list">
              <!-- Rendered via JS -->
            </div>
          </div>
        </div>

        <!-- Column 3: Semester Selectors and List of Papers -->
        <div class="pyq-panel" id="panel-papers-list">
          
          <!-- Semester Selector Cards (Mobile Screen 3 - hidden on desktop) -->
          <div class="card" id="card-mobile-semesters-sec" style="padding: 16px;">
            <h3 class="pyq-subject-section-title" id="semesters-list-title" style="margin-top: 4px;">Select Semester</h3>
            <div class="pyq-subjects-list" id="semesters-container-list">
              <!-- Stacked semester cards in mobile -->
            </div>
          </div>

          <!-- Main Papers Content Area -->
          <div class="pyq-center-panel" id="card-papers-list-sec">
            
            <!-- Category > Subject > Semester header description -->
            <div class="card" style="padding: 20px;">
              <h3 class="pyq-active-header" id="active-papers-header">MATHEMATICS (Major) > SEMESTER 1</h3>
              <p class="text-secondary" style="font-size: 0.82rem;" id="active-papers-subheader">All available past papers for Mathematics Semester 1.</p>
              
              <!-- Desktop Semester Navigation Tabs -->
              <div class="pyq-sem-tabs" style="margin-top: 16px;">
                <button class="pyq-sem-tab ${activeSemester === 1 ? 'active' : ''}" data-sem="1">Sem 1</button>
                <button class="pyq-sem-tab ${activeSemester === 2 ? 'active' : ''}" data-sem="2">Sem 2</button>
                <button class="pyq-sem-tab ${activeSemester === 3 ? 'active' : ''}" data-sem="3">Sem 3</button>
                <button class="pyq-sem-tab ${activeSemester === 4 ? 'active' : ''}" data-sem="4">Sem 4</button>
                <button class="pyq-sem-tab ${activeSemester === 5 ? 'active' : ''}" data-sem="5">Sem 5</button>
                <button class="pyq-sem-tab ${activeSemester === 6 ? 'active' : ''}" data-sem="6">Sem 6</button>
              </div>
            </div>

            <!-- List of Papers -->
            <div style="display: flex; flex-direction: column; gap: 12px;" id="papers-list-wrapper">
              <!-- Rendered dynamically -->
            </div>



          </div>
        </div>

      </div>

      <!-- Column 4: Help Widgets (moved below the grid) -->
      <div class="pyq-panel pyq-forms-col" id="panel-help-widgets">
        
        <!-- Request Paper Widget -->
        <div class="card">
          <h3 class="section-title" style="font-size: 1.05rem; margin-bottom: 8px;"><i data-lucide="help-circle"></i> Can't find your paper?</h3>
          <p class="text-secondary" style="font-size: 0.78rem; margin-bottom: 14px;">Submit a request and we'll search the library.</p>
          
          <form id="request-paper-form">
            <div class="form-group">
              <label style="font-size: 0.75rem;">Course Category</label>
              <select id="req-cat" class="filter-select" style="width: 100%;" required>
                <option value="Major">Major Paper</option>
                <option value="Minor">Minor Paper</option>
                <option value="MDC">MDC Paper</option>
                <option value="SEC">SEC Paper</option>
                <option value="VAC">VAC Paper</option>
                <option value="AEC">AEC Paper</option>
              </select>
            </div>
            <div class="form-group">
              <label style="font-size: 0.75rem;">Semester</label>
              <select id="req-sem" class="filter-select" style="width: 100%;" required>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
              </select>
            </div>
            <div class="form-group">
              <label style="font-size: 0.75rem;">Subject Name</label>
              <input type="text" id="req-subject" placeholder="e.g. Real Analysis" required style="width: 100%; padding: 8px 12px; border-radius: var(--radius-md); background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary);">
            </div>
            <button type="submit" class="primary-btn full-btn" style="margin-top: 4px;">Submit Request</button>
          </form>
        </div>

        <!-- Submit Paper Widget -->
        <div class="card">
          <h3 class="section-title" style="font-size: 1.05rem; margin-bottom: 8px;"><i data-lucide="upload"></i> Help Your Juniors</h3>
          <p class="text-secondary" style="font-size: 0.78rem; margin-bottom: 14px;">Upload question papers to build the community database.</p>
          
          <div class="upload-box-help" id="submit-pyq-widget-trigger">
            <i data-lucide="file-text" class="drag-icon" style="width: 32px; height: 32px; color: var(--primary);"></i>
            <p style="font-size: 0.8rem; font-weight: 600; margin-top: 8px;">Drag & Drop PDF here</p>
            <p class="text-secondary" style="font-size: 0.7rem; margin-top: 2px;">or tap to select file</p>
          </div>
        </div>

      </div>

    </div>
  `;

  lucide.createIcons();

  // Draw content views based on active steps
  renderSubjectsList();
  renderSemestersList();
  renderPapersList();
  // Control mobile panels visibility based on mobileStep
  applyResponsiveStepClasses();

  // Attach event handlers
  setupLayoutListeners(container);
}

function renderSubjectsList() {
  const container = document.getElementById('subjects-container-list');
  const titleEl = document.getElementById('subject-list-title');
  if (!container) return;

  const subjects = categorySubjects[activeCategory] || [];
  titleEl.textContent = `${activeCategory.toUpperCase()} SUBJECTS`;

  container.innerHTML = subjects.map(sub => `
    <button class="pyq-sub-btn ${activeSubject === sub ? 'active' : ''}" data-sub="${sub}">
      <i data-lucide="book-open"></i> <span>${sub}</span>
    </button>
  `).join('');

  lucide.createIcons();

  // Bind subject select
  container.querySelectorAll('.pyq-sub-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeSubject = btn.getAttribute('data-sub');
      
      // Update highlights
      container.querySelectorAll('.pyq-sub-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Go to semester list step in mobile, or update content in desktop
      if (isMobileView()) {
        mobileStep = 'semesters';
      }
      
      // Re-draw lists
      renderSemestersList();
      renderPapersList();
      applyResponsiveStepClasses();
    });
  });
}

function renderSemestersList() {
  const container = document.getElementById('semesters-container-list');
  const titleEl = document.getElementById('semesters-list-title');
  if (!container) return;

  titleEl.textContent = `${activeSubject.toUpperCase()} SEMESTERS`;

  // Count available papers per semester for the selected subject
  const semesterCount = {};
  for (let sem = 1; sem <= 6; sem++) {
    const count = pyqData.filter(p => p.category === activeCategory && p.subject === activeSubject && p.semester === sem).length;
    semesterCount[sem] = count;
  }

  container.innerHTML = [1, 2, 3, 4, 5, 6].map(sem => `
    <button class="pyq-cat-btn ${activeSemester === sem ? 'active' : ''}" data-sem="${sem}" style="justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <i data-lucide="calendar"></i>
        <span>Semester ${sem}</span>
      </div>
      <span style="font-size: 0.72rem; color: var(--text-secondary); background: rgba(0,0,0,0.15); padding: 2px 8px; border-radius: var(--radius-full);">
        ${semesterCount[sem]} Papers
      </span>
    </button>
  `).join('');

  lucide.createIcons();

  // Bind click
  container.querySelectorAll('.pyq-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeSemester = parseInt(btn.getAttribute('data-sem'));
      
      // Sync desktop semester navigation tabs
      document.querySelectorAll('.pyq-sem-tab').forEach(tab => {
        if (parseInt(tab.getAttribute('data-sem')) === activeSemester) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });

      // Go to papers step in mobile
      if (isMobileView()) {
        mobileStep = 'papers';
      }

      renderPapersList();
      applyResponsiveStepClasses();
    });
  });
}

function renderPapersList() {
  const container = document.getElementById('papers-list-wrapper');
  const headerEl = document.getElementById('active-papers-header');
  const subheaderEl = document.getElementById('active-papers-subheader');

  if (!container) return;

  // Update header text
  headerEl.textContent = `${activeSubject.toUpperCase()} (${activeCategory}) > SEMESTER ${activeSemester}`;
  subheaderEl.textContent = `All available papers for ${activeSubject} Semester ${activeSemester}.`;

  // Fetch papers matching filters
  const papers = pyqData.filter(p => 
    p.category === activeCategory && 
    p.subject === activeSubject && 
    p.semester === activeSemester
  );

  const folderLink = pyqFolderLinks[activeCategory]?.[activeSubject]?.[activeSemester];
  let folderCardHtml = '';
  if (folderLink) {
    folderCardHtml = `
      <div class="card pyq-folder-card" style="padding: 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; background: linear-gradient(135deg, rgba(67, 97, 238, 0.12) 0%, rgba(76, 201, 240, 0.12) 100%); border: 1px solid rgba(67, 97, 238, 0.25); border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
        <div style="display: flex; align-items: center; gap: 12px; text-align: left;">
          <div style="background: var(--primary); color: white; width: 36px; height: 36px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i data-lucide="folder-open" style="width: 18px; height: 18px;"></i>
          </div>
          <div>
            <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 2px;">Google Drive Folder</h4>
            <p class="text-secondary" style="font-size: 0.75rem;">Access all Semester ${activeSemester} ${activeSubject} ${activeCategory} files directly.</p>
          </div>
        </div>
        <a href="${folderLink}" target="_blank" class="primary-btn" style="padding: 6px 12px; font-size: 0.78rem; text-decoration: none; display: flex; align-items: center; gap: 6px; border-radius: var(--radius-sm); line-height: 1;">
          Open Folder <i data-lucide="external-link" style="width: 12px; height: 12px;"></i>
        </a>
      </div>
    `;
  }

  if (papers.length === 0) {
    if (folderLink) {
      container.innerHTML = folderCardHtml + `
        <div style="text-align: center; padding: 32px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
          <i data-lucide="alert-circle" style="width: 32px; height: 32px; color: var(--text-secondary); margin-bottom: 8px;"></i>
          <p class="text-secondary" style="font-size: 0.85rem; font-weight: 600;">No individual papers linked here yet</p>
          <p class="text-muted" style="font-size: 0.72rem; margin-top: 2px;">Use the Google Drive folder link above to browse files.</p>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 32px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
          <i data-lucide="alert-circle" style="width: 32px; height: 32px; color: var(--text-secondary); margin-bottom: 8px;"></i>
          <p class="text-secondary" style="font-size: 0.85rem; font-weight: 600;">No papers found for Sem ${activeSemester}</p>
          <p class="text-muted" style="font-size: 0.72rem; margin-top: 2px;">Be the first to upload one for your department!</p>
        </div>
      `;
    }
    lucide.createIcons();
    return;
  }

  const savedPyqs = JSON.parse(localStorage.getItem('tata_saved_pyqs')) || [];

  let listHtml = folderCardHtml + papers.map(paper => {
    const isSaved = savedPyqs.some(item => item.id === paper.id);
    const downloads = localStorage.getItem(`tata_dl_count_${paper.id}`) || paper.downloadCount;
    
    return `
      <div class="pyq-paper-list-item" data-id="${paper.id}">
        <div class="pyq-paper-left">
          <div class="pyq-paper-icon-box">
            <i data-lucide="file-text"></i>
          </div>
          <div class="pyq-paper-info">
            <h4 class="pyq-paper-title">${paper.title}</h4>
            <div class="pyq-paper-meta-row">
              <span><i data-lucide="download"></i> ${downloads} Downloads</span>
              <span><i data-lucide="file-box"></i> ${paper.fileSize}</span>
            </div>
          </div>
        </div>
        
        <div class="pyq-paper-actions">
          <button class="pyq-bookmark-btn save-paper-trigger ${isSaved ? 'active' : ''}" data-id="${paper.id}" title="${isSaved ? 'Remove' : 'Save'}">
            <i data-lucide="bookmark" style="${isSaved ? 'fill: var(--primary); color: var(--primary);' : ''}"></i>
          </button>
          <button class="primary-btn dl-paper-trigger" data-id="${paper.id}" style="padding: 6px 14px; font-size: 0.8rem; border-radius: var(--radius-sm);">
            ${paper.downloadUrl ? 'View PDF' : 'Download PDF'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = listHtml;
  lucide.createIcons();

  container.querySelectorAll('.save-paper-trigger').forEach(el => {
    el.addEventListener('click', () => {
      const paperId = el.getAttribute('data-id');
      togglePaperBookmark(paperId);
    });
  });

  container.querySelectorAll('.dl-paper-trigger').forEach(el => {
    el.addEventListener('click', () => {
      const paperId = el.getAttribute('data-id');
      handlePaperDownload(paperId);
    });
  });
}



function togglePaperBookmark(paperId) {
  const paper = pyqData.find(p => p.id === paperId);
  if (!paper) return;

  let savedList = JSON.parse(localStorage.getItem('tata_saved_pyqs')) || [];
  const idx = savedList.findIndex(p => p.id === paperId);

  if (idx === -1) {
    savedList.push({
      id: paper.id,
      title: paper.title,
      department: paper.subject,
      semester: paper.semester
    });
    localStorage.setItem('tata_saved_pyqs', JSON.stringify(savedList));
    showToast(`Saved bookmark for ${paper.title}`, 'success');
  } else {
    savedList.splice(idx, 1);
    localStorage.setItem('tata_saved_pyqs', JSON.stringify(savedList));
    showToast(`Removed bookmark`, 'info');
  }

  renderPapersList();
}

function handlePaperDownload(paperId) {
  const paper = pyqData.find(p => p.id === paperId);
  if (!paper) return;

  let downloads = parseInt(localStorage.getItem(`tata_dl_count_${paperId}`)) || paper.downloadCount;
  downloads++;
  localStorage.setItem(`tata_dl_count_${paperId}`, downloads);

  incrementGlobalDownloadCount();
  logRecentlyViewed(paper.id, `${paper.subject} Sem ${paper.semester} (${paper.year})`, 'pyq');
  
  // Rerender list to show update counts
  renderPapersList();

  if (paper.downloadUrl) {
    window.open(paper.downloadUrl, '_blank');
    showToast(`Opening: ${paper.title}`, 'success');
    return;
  }

  // Trigger simulated file download
  const dummyContent = `TATA COLLEGE PORTAL\nSubject: ${paper.subject}\nCategory: ${paper.category}\nSemester: ${paper.semester}\nYear: ${paper.year}\n\n[MOCK EXAMINATION FILE DOCUMENT]`;
  const blob = new Blob([dummyContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${paper.subject.replace(/\s+/g, '_')}_Sem${paper.semester}_${paper.year}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Downloading: ${paper.subject} Exam Paper`, 'success');
}

// Details modal removed because users download directly

// Controller to hide/show panels in Mobile view based on active step
function applyResponsiveStepClasses() {
  const panelCategories = document.getElementById('panel-categories');
  const panelSubjects = document.getElementById('panel-subjects');
  const panelPapersList = document.getElementById('panel-papers-list');
  const panelHelpWidgets = document.getElementById('panel-help-widgets');

  const cardCategoriesSec = document.getElementById('card-categories-sec');
  const cardSubjectsSec = document.getElementById('card-subjects-sec');
  const cardMobileSemestersSec = document.getElementById('card-mobile-semesters-sec');
  const cardPapersListSec = document.getElementById('card-papers-list-sec');

  const backBtn = document.getElementById('pyq-back-btn');
  const mainTitle = document.getElementById('pyq-main-title');
  const mainSubtitle = document.getElementById('pyq-main-subtitle');

  if (!panelCategories) return;

  // Determine if in desktop or mobile view
  if (!isMobileView()) {
    // Reset all hidden states for desktop view (3-column layout)
    panelCategories.classList.remove('pyq-mobile-hidden');
    panelSubjects.classList.remove('pyq-mobile-hidden');
    panelPapersList.classList.remove('pyq-mobile-hidden');
    panelHelpWidgets.classList.remove('pyq-mobile-hidden');

    cardCategoriesSec.classList.remove('pyq-mobile-hidden');
    cardSubjectsSec.classList.remove('pyq-mobile-hidden');
    cardPapersListSec.classList.remove('pyq-mobile-hidden');

    // Hide mobile stacked semesters card on desktop (use horizontal tabs instead)
    cardMobileSemestersSec.classList.add('pyq-desktop-hidden');
    cardMobileSemestersSec.classList.remove('pyq-mobile-hidden');

    backBtn.style.display = 'none';
    mainTitle.textContent = "Previous Year Papers";
    mainSubtitle.textContent = "Access major, minor, and multidisciplinary papers.";
    return;
  }

  // Active steps filters for Mobile
  backBtn.style.display = 'flex';
  cardMobileSemestersSec.classList.remove('pyq-desktop-hidden'); // Make sure desktop hidden utility is removed in mobile
  
  if (mobileStep === 'categories') {
    backBtn.style.display = 'none'; // No back button on home step
    mainTitle.textContent = "PYQ HOME";
    mainSubtitle.textContent = "Choose your course to find exam papers.";

    panelCategories.classList.remove('pyq-mobile-hidden');
    panelSubjects.classList.add('pyq-mobile-hidden');
    panelPapersList.classList.add('pyq-mobile-hidden');
    panelHelpWidgets.classList.add('pyq-mobile-hidden');
  } 
  
  else if (mobileStep === 'subjects') {
    mainTitle.textContent = `${activeCategory.toUpperCase()} PAPERS`;
    mainSubtitle.textContent = "Select subject from the listing below.";

    panelCategories.classList.add('pyq-mobile-hidden');
    panelSubjects.classList.remove('pyq-mobile-hidden');
    panelPapersList.classList.add('pyq-mobile-hidden');
    panelHelpWidgets.classList.add('pyq-mobile-hidden');
  } 
  
  else if (mobileStep === 'semesters') {
    mainTitle.textContent = activeSubject.toUpperCase();
    mainSubtitle.textContent = "Choose your semester to see papers.";

    panelCategories.classList.add('pyq-mobile-hidden');
    panelSubjects.classList.add('pyq-mobile-hidden');
    
    panelPapersList.classList.remove('pyq-mobile-hidden');
    cardMobileSemestersSec.classList.remove('pyq-mobile-hidden');
    cardPapersListSec.classList.add('pyq-mobile-hidden');

    panelHelpWidgets.classList.add('pyq-mobile-hidden');
  } 
  
  else if (mobileStep === 'papers') {
    mainTitle.textContent = `${activeSubject.toUpperCase()} SEM ${activeSemester}`;
    mainSubtitle.textContent = "View papers, request changes, or help juniors.";

    panelCategories.classList.add('pyq-mobile-hidden');
    panelSubjects.classList.add('pyq-mobile-hidden');
    
    panelPapersList.classList.remove('pyq-mobile-hidden');
    cardMobileSemestersSec.classList.add('pyq-desktop-hidden');
    cardPapersListSec.classList.remove('pyq-mobile-hidden');

    panelHelpWidgets.classList.remove('pyq-mobile-hidden');
  }
}

function setupLayoutListeners(container) {
  // 1. Category Switch Buttons
  container.querySelectorAll('.pyq-cat-btn[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.getAttribute('data-cat');
      
      // Select first subject from new category as default
      const subjects = categorySubjects[activeCategory] || [];
      activeSubject = subjects[0] || '';
      activeSemester = 1;

      // Highlight active category
      container.querySelectorAll('.pyq-cat-btn[data-cat]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (isMobileView()) {
        mobileStep = 'subjects';
      }

      renderSubjectsList();
      renderSemestersList();
      renderPapersList();
      applyResponsiveStepClasses();
    });
  });

  // 2. Desktop Semester Navigation Tabs
  container.querySelectorAll('.pyq-sem-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeSemester = parseInt(tab.getAttribute('data-sem'));

      // Highlight active tab
      container.querySelectorAll('.pyq-sem-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      renderPapersList();
    });
  });

  // 3. Mobile Back Navigation Button Click
  const backBtn = container.querySelector('#pyq-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (mobileStep === 'subjects') {
        mobileStep = 'categories';
      } else if (mobileStep === 'semesters') {
        mobileStep = 'subjects';
      } else if (mobileStep === 'papers') {
        mobileStep = 'semesters';
      }
      applyResponsiveStepClasses();
    });
  }

  // 4. Request paper form submit listener
  const reqForm = container.querySelector('#request-paper-form');
  if (reqForm) {
    reqForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cat = document.getElementById('req-cat').value;
      const sem = document.getElementById('req-sem').value;
      const subject = document.getElementById('req-subject').value;

      const submitBtn = reqForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

      try {
        const payload = {
          formType: "request",
          category: cat,
          semester: sem,
          subject: subject
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
            showToast(`Request for ${subject} submitted successfully!`, 'success');
          } else {
            console.error("Request failed: ", resData.message);
            showToast(`Request failed: ${resData.message}. Showing simulated status.`, 'warning');
          }
        } else {
          console.log("Simulating request payload: ", payload);
          showToast(`Request submitted successfully!`, 'success');
          showToast(`Looking for: ${subject} (${cat} Sem ${sem})`, 'info');
        }

        reqForm.reset();

      } catch (err) {
        console.error("Submission error: ", err);
        showToast("Error sending request. Please try again.", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // 5. Submit paper widget launch modal
  const uploadTrigger = container.querySelector('#submit-pyq-widget-trigger');
  if (uploadTrigger) {
    uploadTrigger.addEventListener('click', () => {
      document.getElementById('upload-modal').classList.remove('hidden');
    });
  }

  // Handle window resizing to sync layout rules instantly
  window.addEventListener('resize', applyResponsiveStepClasses);
}

function isMobileView() {
  return window.innerWidth < 768;
}
