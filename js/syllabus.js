/* ==========================================
   Tata College Student Hub - Syllabus Module
   Redesigned User Flow & Multi-Column Layout
   ========================================== */

import { showToast, getAppState, incrementGlobalDownloadCount, SUBMISSION_API_URL } from './app.js';
import { logRecentlyViewed } from './dashboard.js';

// State variables for routing and filter states
let syllabusData = [];
let activeCategory = 'Major';
let activeSubject = 'Mathematics';
let activeSemester = 1;

// Mobile Navigation State: 'categories', 'subjects', 'semesters', 'details'
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

export async function initSyllabusView(container) {
  // Fetch actual JSON data if not loaded
  if (syllabusData.length === 0) {
    try {
      const response = await fetch('data/syllabus.json');
      syllabusData = await response.json();
    } catch (err) {
      console.error("Error fetching syllabus data: ", err);
      showToast("Failed to load syllabus records.", "error");
      return;
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
          <button class="pyq-mobile-back-btn" id="syl-back-btn" aria-label="Go Back">
            <i data-lucide="arrow-left"></i>
          </button>
          <div>
            <h2 class="page-title" id="syl-main-title">Syllabus Explorer</h2>
            <p class="page-subtitle" id="syl-main-subtitle">Access the official FYUGP NEP-2020 syllabus structures.</p>
          </div>
        </div>
      </div>

      <!-- Main Columns Grid Container -->
      <div class="pyq-redesign-container" id="syl-grid-wrapper">
        
        <!-- Column 1: Course Category Selector -->
        <div class="pyq-panel" id="syl-panel-categories">
          <div class="card" id="syl-card-categories-sec" style="padding: 16px;">
            <h3 class="pyq-subject-section-title" style="margin-top: 4px;">Choose Course Category</h3>
            <div class="pyq-categories-list">
              <button class="pyq-cat-btn ${activeCategory === 'Major' ? 'active' : ''}" data-cat="Major">
                <span>Major Course</span> <i data-lucide="chevron-right"></i>
              </button>
              <button class="pyq-cat-btn ${activeCategory === 'Minor' ? 'active' : ''}" data-cat="Minor">
                <span>Minor Course</span> <i data-lucide="chevron-right"></i>
              </button>
              <button class="pyq-cat-btn ${activeCategory === 'MDC' ? 'active' : ''}" data-cat="MDC">
                <span>MDC Course</span> <i data-lucide="chevron-right"></i>
              </button>
              <button class="pyq-cat-btn ${activeCategory === 'SEC' ? 'active' : ''}" data-cat="SEC">
                <span>SEC Course</span> <i data-lucide="chevron-right"></i>
              </button>
              <button class="pyq-cat-btn ${activeCategory === 'VAC' ? 'active' : ''}" data-cat="VAC">
                <span>VAC Course</span> <i data-lucide="chevron-right"></i>
              </button>
              <button class="pyq-cat-btn ${activeCategory === 'AEC' ? 'active' : ''}" data-cat="AEC">
                <span>AEC Course</span> <i data-lucide="chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Column 2: Subject Selection List -->
        <div class="pyq-panel" id="syl-panel-subjects">
          <div class="card" id="syl-card-subjects-sec" style="padding: 16px;">
            <h3 class="pyq-subject-section-title" id="syl-subject-list-title" style="margin-top: 4px;">Subjects List</h3>
            <div class="pyq-subjects-list" id="syl-subjects-container-list">
              <!-- Rendered via JS -->
            </div>
          </div>
        </div>

        <!-- Column 3: Semester Tabs and Detailed Syllabus View -->
        <div class="pyq-panel" id="syl-panel-details">
          
          <!-- Semester Selector Cards (Mobile Screen 3 - hidden on desktop) -->
          <div class="card" id="syl-card-mobile-semesters-sec" style="padding: 16px;">
            <h3 class="pyq-subject-section-title" id="syl-semesters-list-title" style="margin-top: 4px;">Select Semester</h3>
            <div class="pyq-subjects-list" id="syl-semesters-container-list">
              <!-- Stacked semester cards in mobile -->
            </div>
          </div>

          <!-- Main Syllabus Content Workspace -->
          <div class="pyq-center-panel" id="syl-card-details-sec">
            
            <!-- Category > Subject > Semester header description -->
            <div class="card" style="padding: 20px;">
              <h3 class="pyq-active-header" id="syl-active-header">MATHEMATICS (Major) > SEMESTER 1</h3>
              <p class="text-secondary" style="font-size: 0.82rem;" id="syl-active-subheader">Syllabus outline and curriculum structure.</p>
              
              <!-- Desktop Semester Navigation Tabs -->
              <div class="pyq-sem-tabs" id="syl-desktop-tabs-container" style="margin-top: 16px;">
                <!-- Rendered dynamically -->
              </div>

              <!-- Active Semester Module Box -->
              <div id="syl-active-module-box" style="margin-top: 16px; background: rgba(0,0,0,0.15); padding: 12px 16px; border-radius: var(--radius-md); font-size: 0.88rem; font-weight: 700; color: var(--primary); border-left: 4px solid var(--primary); display: none;"></div>
            </div>

            <!-- Syllabus Document Details -->
            <div id="syl-details-wrapper">
              <!-- Rendered dynamically -->
            </div>

          </div>
        </div>
      </div>

      <!-- Bottom Help Widgets -->
      <div class="pyq-panel pyq-forms-col" id="syl-panel-help-widgets">
        
        <!-- Request Syllabus Widget -->
        <div class="card">
          <h3 class="section-title" style="font-size: 1.05rem; margin-bottom: 8px;"><i data-lucide="help-circle"></i> Can't find your syllabus?</h3>
          <p class="text-secondary" style="font-size: 0.78rem; margin-bottom: 14px;">Submit a request and we'll retrieve it from the university archive.</p>
          
          <form id="syl-request-form">
            <div class="form-group">
              <label style="font-size: 0.75rem;">Course Category</label>
              <select id="syl-req-cat" class="filter-select" style="width: 100%;" required>
                <option value="Major">Major Course</option>
                <option value="Minor">Minor Course</option>
                <option value="MDC">MDC Course</option>
                <option value="SEC">SEC Course</option>
                <option value="VAC">VAC Course</option>
                <option value="AEC">AEC Course</option>
              </select>
            </div>
            <div class="form-group">
              <label style="font-size: 0.75rem;">Subject Name</label>
              <input type="text" id="syl-req-subject" placeholder="e.g. Mathematics" required style="width: 100%; padding: 8px 12px; border-radius: var(--radius-md); background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary);">
            </div>
            <button type="submit" class="primary-btn full-btn" style="margin-top: 4px;">Submit Request</button>
          </form>
        </div>

        <!-- Share Syllabus Widget -->
        <div class="card">
          <h3 class="section-title" style="font-size: 1.05rem; margin-bottom: 8px;"><i data-lucide="upload"></i> Share a Syllabus</h3>
          <p class="text-secondary" style="font-size: 0.78rem; margin-bottom: 14px;">Upload official syllabus files to build the community database.</p>
          
          <div class="upload-box-help" id="syl-submit-widget-trigger">
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
  renderSyllabusDetails();

  // Control mobile panels visibility based on mobileStep
  applyResponsiveStepClasses();

  // Attach event handlers
  setupLayoutListeners(container);
}

function renderSubjectsList() {
  const container = document.getElementById('syl-subjects-container-list');
  const titleEl = document.getElementById('syl-subject-list-title');
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
      renderSyllabusDetails();
      applyResponsiveStepClasses();
    });
  });
}

function renderSemestersList() {
  const container = document.getElementById('syl-semesters-container-list');
  const titleEl = document.getElementById('syl-semesters-list-title');
  if (!container) return;

  const syl = getSyllabusDocument(activeCategory, activeSubject);
  const totalSems = syl.modules ? syl.modules.length : 6;

  titleEl.textContent = `${activeSubject.toUpperCase()} SEMESTERS`;

  const semsArray = Array.from({ length: totalSems }, (_, i) => i + 1);

  container.innerHTML = semsArray.map(sem => `
    <button class="pyq-cat-btn ${activeSemester === sem ? 'active' : ''}" data-sem="${sem}" style="justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <i data-lucide="calendar"></i>
        <span>Semester ${sem}</span>
      </div>
      <span style="font-size: 0.72rem; color: var(--text-secondary); background: rgba(0,0,0,0.15); padding: 2px 8px; border-radius: var(--radius-full);">
        View Syllabus
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

      // Go to details step in mobile
      if (isMobileView()) {
        mobileStep = 'details';
      }

      renderSyllabusDetails();
      applyResponsiveStepClasses();
    });
  });
}

function renderSyllabusDetails() {
  const container = document.getElementById('syl-details-wrapper');
  const headerEl = document.getElementById('syl-active-header');
  const subheaderEl = document.getElementById('syl-active-subheader');
  const activeModuleBox = document.getElementById('syl-active-module-box');

  if (!container) return;

  // Get matching syllabus document (real or dynamic)
  const syl = getSyllabusDocument(activeCategory, activeSubject);

  const totalSems = syl.modules ? syl.modules.length : 6;

  // Make sure active semester doesn't exceed total semesters when switching subjects
  if (activeSemester > totalSems) {
    activeSemester = totalSems;
  }

  // Render desktop semester navigation tabs
  const tabsContainer = document.getElementById('syl-desktop-tabs-container');
  if (tabsContainer) {
    let tabsHtml = '';
    for (let sem = 1; sem <= totalSems; sem++) {
      tabsHtml += `<button class="pyq-sem-tab ${activeSemester === sem ? 'active' : ''}" data-sem="${sem}">Sem ${sem}</button>`;
    }
    tabsContainer.innerHTML = tabsHtml;

    // Re-bind listeners for horizontal tabs since they are replaced
    tabsContainer.querySelectorAll('.pyq-sem-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeSemester = parseInt(tab.getAttribute('data-sem'));
        renderSyllabusDetails();
      });
    });
  }

  // Update header text
  headerEl.textContent = `${activeSubject.toUpperCase()} (${activeCategory}) > SEMESTER ${activeSemester}`;
  subheaderEl.textContent = `NEP curriculum outline and course progression for Semester ${activeSemester}.`;

  const savedSyllabus = JSON.parse(localStorage.getItem('tata_saved_syllabus')) || [];
  const isSaved = savedSyllabus.some(item => item.id === syl.id);

  // Extract the specific module text for activeSemester
  let activeModuleText = "No syllabus modules found for this semester.";
  if (syl.modules && syl.modules.length > 0) {
    // Attempt to match semester directly e.g. "Sem 1:" or fallback to index matching
    const matchingModule = syl.modules.find(m => m.toLowerCase().includes(`sem ${activeSemester}:`));
    if (matchingModule) {
      activeModuleText = matchingModule;
    } else {
      activeModuleText = syl.modules[activeSemester - 1] || syl.modules[0];
    }
  }

  // Update the header card module text element
  if (activeModuleBox) {
    activeModuleBox.textContent = activeModuleText;
    activeModuleBox.style.display = 'block';
  }

  const isMathPdf = (syl.id === 'syl-math-ug' || syl.id === 'syl-math-minor') && activeSemester >= 1 && activeSemester <= 8;
  const isPhyPdf = (syl.id === 'syl-phy-ug' || syl.id === 'syl-phy-minor') && activeSemester >= 1 && activeSemester <= 8;
  const hasRealPdf = isMathPdf || isPhyPdf;
  const btnText = hasRealPdf ? `Download Sem ${activeSemester} PDF` : 'Download Syllabus Outline';

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      
      <!-- Core Info Card -->
      <div class="card" style="padding: 24px;">
        <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
          <span class="notice-tag academic">NEP FYUGP</span>
          <span style="font-size: 0.75rem; color: var(--text-secondary); align-self: center;">Effective: ${syl.effectiveFrom}</span>
          <span style="font-size: 0.75rem; color: var(--text-secondary); align-self: center; margin-left: auto;">File Size: ${syl.fileSize}</span>
        </div>
        <h3 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 8px; color: var(--text-primary);">${syl.title}</h3>
        <p class="text-secondary" style="font-size: 0.88rem; line-height: 1.5; margin-bottom: 20px;">${syl.description}</p>
        
        <div style="display: flex; gap: 12px; align-items: center;">
          <button class="primary-btn syl-download-trigger" data-id="${syl.id}">
            <i data-lucide="download"></i> ${btnText}
          </button>
          <button class="secondary-btn btn-icon-only syl-save-trigger ${isSaved ? 'active' : ''}" data-id="${syl.id}" title="${isSaved ? 'Remove' : 'Save'}">
            <i data-lucide="bookmark" style="${isSaved ? 'fill: var(--primary); color: var(--primary);' : ''}"></i>
          </button>
        </div>
      </div>

    </div>
  `;

  lucide.createIcons();

  // Attach button triggers
  container.querySelector('.syl-download-trigger').addEventListener('click', () => {
    handleSyllabusDownload(syl);
  });

  container.querySelector('.syl-save-trigger').addEventListener('click', () => {
    toggleSyllabusBookmark(syl);
  });
}

function getSyllabusDocument(category, subject) {
  const normalizedSub = subject.toLowerCase();
  const normalizedCat = category.toLowerCase();
  
  // Search in static loaded list
  const match = syllabusData.find(s => {
    const titleL = s.title.toLowerCase();
    const deptL = s.department.toLowerCase();
    if (normalizedCat === 'minor') {
      return (titleL.includes(normalizedSub) || deptL.includes(normalizedSub)) && (titleL.includes('minor') || deptL.includes('minor'));
    }
    return (titleL.includes(normalizedSub) || deptL.includes(normalizedSub)) && !titleL.includes('minor') && !deptL.includes('minor');
  });

  if (match) {
    return match;
  }

  // Fallback: Generate dynamic consistent NEP mock syllabus
  const mockId = `syl-mock-${normalizedSub.replace(/[^a-z0-9]/g, '-')}`;
  return {
    id: mockId,
    title: `B.Sc/B.A ${subject} Syllabus (${category} FYUGP NEP)`,
    department: subject,
    semester: "All Semesters (1-8)",
    effectiveFrom: "2022 onwards",
    fileSize: "2.1 MB",
    description: `Official undergraduate curriculum structure for ${subject} under the NEP-2020 FYUGP guidelines of Kolhan University. Includes syllabus contents, mark breakdown, and credit allocations.`,
    modules: [
      `Sem 1: MJ-1 (Introduction to ${subject} Foundations)`,
      `Sem 2: MJ-2 (Fundamental Core Principles in ${subject})`,
      `Sem 3: MJ-3 (Intermediate Core Theories of ${subject})`,
      `Sem 4: MJ-4 (${subject} Analytical Studies & Methods)`,
      `Sem 5: MJ-5 (Advanced Core Electives in ${subject})`,
      `Sem 6: MJ-6 (Specialized ${subject} Studies & Research Project)`
    ]
  };
}



function toggleSyllabusBookmark(syl) {
  let savedList = JSON.parse(localStorage.getItem('tata_saved_syllabus')) || [];
  const idx = savedList.findIndex(item => item.id === syl.id);

  if (idx === -1) {
    savedList.push({
      id: syl.id,
      title: syl.title,
      department: syl.department
    });
    localStorage.setItem('tata_saved_syllabus', JSON.stringify(savedList));
    showToast(`Saved bookmark for ${syl.title}`, 'success');
  } else {
    savedList.splice(idx, 1);
    localStorage.setItem('tata_saved_syllabus', JSON.stringify(savedList));
    showToast(`Removed bookmark`, 'info');
  }

  renderSyllabusDetails();
}

function handleSyllabusDownload(syl) {
  incrementGlobalDownloadCount();
  logRecentlyViewed(syl.id, syl.title, 'syllabus');

  // Trigger real file download for Mathematics Major
  if (syl.id === 'syl-math-ug' && activeSemester >= 1 && activeSemester <= 8) {
    const filename = `math_sem${activeSemester}_syllabus.pdf`;
    const path = `pdf/${filename}`;
    const a = document.createElement('a');
    a.href = path;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloading: Semester ${activeSemester} Mathematics Syllabus PDF`, 'success');
    return;
  }

  // Trigger real file download for Mathematics Minor
  if (syl.id === 'syl-math-minor' && activeSemester >= 1 && activeSemester <= 8) {
    const filename = `math_minor_sem${activeSemester}_syllabus.pdf`;
    const path = `pdf/${filename}`;
    const a = document.createElement('a');
    a.href = path;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloading: Semester ${activeSemester} Mathematics Minor Syllabus PDF`, 'success');
    return;
  }

  // Trigger real file download for Physics Major
  if (syl.id === 'syl-phy-ug' && activeSemester >= 1 && activeSemester <= 8) {
    const filename = `physics_sem${activeSemester}_syllabus.pdf`;
    const path = `pdf/${filename}`;
    const a = document.createElement('a');
    a.href = path;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloading: Semester ${activeSemester} Physics Syllabus PDF`, 'success');
    return;
  }

  // Trigger real file download for Physics Minor
  if (syl.id === 'syl-phy-minor' && activeSemester >= 1 && activeSemester <= 8) {
    const filename = `physics_minor_sem${activeSemester}_syllabus.pdf`;
    const path = `pdf/${filename}`;
    const a = document.createElement('a');
    a.href = path;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloading: Semester ${activeSemester} Physics Minor Syllabus PDF`, 'success');
    return;
  }

  // Trigger simulated file download
  const dummyContent = `TATA COLLEGE RESOURCE PORTAL\n===========================\nNEP FYUGP SYLLABUS\nSyllabus for: ${syl.title}\nDepartment: ${syl.department}\nEffective From: ${syl.effectiveFrom}\n\nSEMESTER PROGRESSIONS:\n` + syl.modules.join('\n') + `\n\n[End of File]`;
  const blob = new Blob([dummyContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${syl.title.replace(/\s+/g, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Downloading Syllabus: ${syl.title}`, 'success');
}

// Controller to hide/show panels in Mobile view based on active step
function applyResponsiveStepClasses() {
  const panelCategories = document.getElementById('syl-panel-categories');
  const panelSubjects = document.getElementById('syl-panel-subjects');
  const panelDetails = document.getElementById('syl-panel-details');
  const panelHelpWidgets = document.getElementById('syl-panel-help-widgets');

  const cardCategoriesSec = document.getElementById('syl-card-categories-sec');
  const cardSubjectsSec = document.getElementById('syl-card-subjects-sec');
  const cardMobileSemestersSec = document.getElementById('syl-card-mobile-semesters-sec');
  const cardDetailsSec = document.getElementById('syl-card-details-sec');

  const backBtn = document.getElementById('syl-back-btn');
  const mainTitle = document.getElementById('syl-main-title');
  const mainSubtitle = document.getElementById('syl-main-subtitle');

  if (!panelCategories) return;

  // Determine if in desktop or mobile view
  if (!isMobileView()) {
    // Reset all hidden states for desktop view (3-column layout)
    panelCategories.classList.remove('pyq-mobile-hidden');
    panelSubjects.classList.remove('pyq-mobile-hidden');
    panelDetails.classList.remove('pyq-mobile-hidden');
    if (panelHelpWidgets) {
      panelHelpWidgets.classList.remove('pyq-mobile-hidden');
    }

    cardCategoriesSec.classList.remove('pyq-mobile-hidden');
    cardSubjectsSec.classList.remove('pyq-mobile-hidden');
    cardDetailsSec.classList.remove('pyq-mobile-hidden');

    // Hide mobile stacked semesters card on desktop (use horizontal tabs instead)
    cardMobileSemestersSec.classList.add('pyq-desktop-hidden');
    cardMobileSemestersSec.classList.remove('pyq-mobile-hidden');

    backBtn.style.display = 'none';
    mainTitle.textContent = "Syllabus Explorer";
    mainSubtitle.textContent = "Access the official FYUGP NEP-2020 syllabus structures.";
    return;
  }

  // Active steps filters for Mobile
  backBtn.style.display = 'flex';
  cardMobileSemestersSec.classList.remove('pyq-desktop-hidden'); // Make sure desktop hidden utility is removed in mobile
  
  if (mobileStep === 'categories') {
    backBtn.style.display = 'none'; // No back button on home step
    mainTitle.textContent = "SYLLABUS CATEGORIES";
    mainSubtitle.textContent = "Choose course category to explore syllabus.";

    panelCategories.classList.remove('pyq-mobile-hidden');
    panelSubjects.classList.add('pyq-mobile-hidden');
    panelDetails.classList.add('pyq-mobile-hidden');
    if (panelHelpWidgets) {
      panelHelpWidgets.classList.add('pyq-mobile-hidden');
    }
  } 
  
  else if (mobileStep === 'subjects') {
    mainTitle.textContent = `${activeCategory.toUpperCase()} SYLLABUS`;
    mainSubtitle.textContent = "Select subject from the listing below.";

    panelCategories.classList.add('pyq-mobile-hidden');
    panelSubjects.classList.remove('pyq-mobile-hidden');
    panelDetails.classList.add('pyq-mobile-hidden');
    if (panelHelpWidgets) {
      panelHelpWidgets.classList.add('pyq-mobile-hidden');
    }
  } 
  
  else if (mobileStep === 'semesters') {
    mainTitle.textContent = activeSubject.toUpperCase();
    mainSubtitle.textContent = "Choose your semester to see outline.";

    panelCategories.classList.add('pyq-mobile-hidden');
    panelSubjects.classList.add('pyq-mobile-hidden');
    
    panelDetails.classList.remove('pyq-mobile-hidden');
    cardMobileSemestersSec.classList.remove('pyq-mobile-hidden');
    cardDetailsSec.classList.add('pyq-mobile-hidden');
    if (panelHelpWidgets) {
      panelHelpWidgets.classList.add('pyq-mobile-hidden');
    }
  } 
  
  else if (mobileStep === 'details') {
    mainTitle.textContent = `${activeSubject.toUpperCase()} SEM ${activeSemester}`;
    mainSubtitle.textContent = "View details and download course syllabus.";

    panelCategories.classList.add('pyq-mobile-hidden');
    panelSubjects.classList.add('pyq-mobile-hidden');
    
    panelDetails.classList.remove('pyq-mobile-hidden');
    cardMobileSemestersSec.classList.add('pyq-desktop-hidden');
    cardDetailsSec.classList.remove('pyq-mobile-hidden');
    if (panelHelpWidgets) {
      panelHelpWidgets.classList.remove('pyq-mobile-hidden');
    }
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
      renderSyllabusDetails();
      applyResponsiveStepClasses();
    });
  });

  // Horizontal tabs are re-bound dynamically in renderSyllabusDetails

  // 3. Mobile Back Navigation Button Click
  const backBtn = container.querySelector('#syl-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (mobileStep === 'subjects') {
        mobileStep = 'categories';
      } else if (mobileStep === 'semesters') {
        mobileStep = 'subjects';
      } else if (mobileStep === 'details') {
        mobileStep = 'semesters';
      }
      applyResponsiveStepClasses();
    });
  }

  // 4. Request syllabus form submit listener
  const reqForm = container.querySelector('#syl-request-form');
  if (reqForm) {
    reqForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cat = document.getElementById('syl-req-cat').value;
      const subject = document.getElementById('syl-req-subject').value;

      const submitBtn = reqForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

      try {
        const payload = {
          formType: "syllabus_request",
          category: cat,
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
            showToast(`Request for ${subject} syllabus submitted!`, 'success');
          } else {
            console.error("Request failed: ", resData.message);
            showToast(`Request failed: ${resData.message}. Showing simulated status.`, 'warning');
          }
        } else {
          console.log("Simulating request payload: ", payload);
          showToast(`Syllabus request submitted successfully!`, 'success');
          showToast(`Looking for: ${subject} (${cat})`, 'info');
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

  // 5. Submit syllabus widget launch modal
  const uploadTrigger = container.querySelector('#syl-submit-widget-trigger');
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
