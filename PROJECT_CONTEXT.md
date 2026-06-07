# Tata College Student Hub — Project Context Document

> **Purpose of this file**: Complete context document for AI assistants, developers, or collaborators who need to understand this project quickly. Last updated: June 2026.

---

## 1. Project Overview

**Name**: Tata College Student Hub  
**Type**: Static Single-Page Application (SPA) — no backend server, no database  
**Purpose**: A student-built academic resource portal for students of **Tata College, Chaibasa**, affiliated with **Kolhan University**, Jharkhand, India  
**Curriculum**: NEP 2020 — Four Year Undergraduate Programme (FYUGP)  
**Live URL**: https://anurag-dev-99.github.io/Tata_College_Hub_Website/  
**GitHub Repo**: https://github.com/Anurag-dev-99/Tata_College_Hub_Website  
**Local Dev Server**: `python -m http.server 8080` run from project root  
**Backup/Working Copy**: `C:\Users\Anurag\Documents\tatacollege\` (not a git repo, kept in sync manually)  

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Structure | Plain HTML5 (`index.html`) |
| Styling | Vanilla CSS (`styles.css`, ~37KB) |
| Logic | Vanilla JavaScript ES Modules (`js/*.js`) |
| Icons | Lucide Icons (CDN: `unpkg.com/lucide@latest`) |
| Charts | Chart.js (CDN: `cdn.jsdelivr.net/npm/chart.js`) |
| Fonts | Plus Jakarta Sans (Google Fonts) |
| PWA | Service Worker (`sw.js`) + Web App Manifest (`manifest.json`) |
| Data | Static JSON files in `data/` folder |
| PDF Files | Stored locally in `pdf/` folder |
| Hosting | GitHub Pages (static hosting) |
| No frameworks | No React, Vue, Angular, Node.js, or any build tool |

---

## 3. Directory Structure

```
Tata_College_Hub_Website/
│
├── index.html              # Single HTML shell — all views render inside #app-view
├── styles.css              # All CSS (dark/light theme, components, responsive)
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker for offline caching (current: tata-hub-v41)
├── offline.html            # Shown when user is offline
├── robots.txt              # SEO: tells crawlers what to index
├── sitemap.xml             # SEO: XML sitemap for Google
├── og-image.png            # OG social preview image (1200x630)
│
├── js/
│   ├── app.js              # Main coordinator: routing, theme, search, PWA, state
│   ├── dashboard.js        # Dashboard view: stats, quick links, recent activity, calendar
│   ├── pyq.js              # Previous Year Papers: 4-column layout, filters, downloads
│   ├── syllabus.js         # Syllabus explorer: department cards, semester tabs, PDF downloads
│   ├── notices.js          # Notice board: category filter, pinned notices, modal detail view
│   └── results.js          # Results & Analysis: Chart.js charts, result links
│
├── data/
│   ├── pyqs.json           # All PYQ paper entries (see schema below)
│   ├── syllabus.json       # All syllabus entries per department (see schema below)
│   ├── notices.json        # College notices/announcements (see schema below)
│   ├── results.json        # Pass percentages, toppers, yearly trends (see schema below)
│   └── calendar.json       # Upcoming academic events (see schema below)
│
└── pdf/
    ├── math_sem[1-8]_syllabus.pdf          # Math Major Sem 1-8 syllabus
    ├── math_minor_sem[1-8]_syllabus.pdf    # Math Minor Sem 1-8 syllabus
    ├── physics_sem[1-8]_syllabus.pdf       # Physics Major Sem 1-8
    └── physics_minor_sem[1-8]_syllabus.pdf # Physics Minor Sem 1-8
```

---

## 4. Application Architecture

### Routing
- **Hash-based SPA routing**: Navigation uses URL fragments (`#dashboard`, `#pyqs`, `#syllabus`, `#notices`, `#results`, `#calculators`)
- `app.js` listens for `hashchange` events and calls the appropriate `init*View()` function
- All view HTML is **dynamically rendered** into `<main id="app-view">` by JavaScript
- A static `<section class="seo-fallback">` is in the HTML for search engine crawlers

### State Management
- Global app state is a plain JS object in `app.js` (`appState`)
- Data is fetched from JSON files via `fetch()` on first load and cached in memory
- User preferences (saved PYQs, theme, download counts) are stored in `localStorage`
- No backend, no database, no authentication

### Theme System
- Dark/Light mode toggle
- CSS custom properties (`--bg-primary`, `--text-primary`, `--primary`, etc.) drive the entire color system
- Theme is stored in `localStorage` and applied via `data-theme="dark|light"` on `<html>`

### PWA
- Service worker uses **Stale-While-Revalidate** strategy for cached assets
- Current cache name: `tata-hub-v41` (increment this every time data/code changes)
- Cached assets include all HTML, CSS, JS, and data JSON files
- `offline.html` is served when a user has no connection

---

## 5. Data Schemas

### `data/pyqs.json` — PYQ Papers
```json
{
  "id": "pyq-mj-math-sem1-mj01-2022",
  "title": "maths_mj_01_sem1_pyq_2022-2026.pdf",
  "year": "2022-2026",
  "semester": 1,
  "category": "Major",
  "subject": "Mathematics",
  "downloadCount": 46,
  "fileSize": "PDF File",
  "downloadUrl": "https://drive.google.com/file/d/FILE_ID/view?usp=sharing"
}
```

> **CRITICAL**: If `downloadUrl` is present → "View PDF" opens Google Drive in new tab.
> If `downloadUrl` is ABSENT → "Download PDF" generates and downloads a mock `.txt` file. Always add `downloadUrl` for real papers.

### `data/syllabus.json` — Syllabuses
```json
{
  "id": "syl-math-ug",
  "title": "B.Sc Mathematics Honours Syllabus (FYUGP NEP-2020)",
  "department": "Mathematics",
  "semester": "All Semesters (1-8)",
  "effectiveFrom": "2022 onwards",
  "fileSize": "2.4 MB",
  "description": "...",
  "modules": [
    "Sem 1: MJ-1 (Calculus & Analytical Geometry)",
    "Sem 2: MJ-2 (Real Analysis - I)"
  ]
}
```

> **CRITICAL**: `modules` array length = number of semesters available for download. If `modules.length` is 6, only Sems 1-6 work; 7 and 8 show "Coming Soon".

### `data/notices.json` — College Notices
```json
{
  "id": "notice-1",
  "title": "Notice headline",
  "date": "2026-06-02",
  "category": "Exam",
  "isPinned": true,
  "isArchived": false,
  "description": "Full notice text...",
  "links": [
    { "label": "Button Text", "url": "https://..." }
  ]
}
```
Categories: `"Exam"` | `"Result"` | `"General"` | `"Academic"` | `"Admission"`

### `data/results.json` — Results Data
```json
{
  "announcements": [
    { "id": "...", "title": "...", "date": "2026-05-28", "status": "Declared", "link": "http://..." }
  ],
  "passPercentageBySemester": [
    { "semester": "Semester 1", "passPercentage": 68.5, "totalStudents": 1420 }
  ],
  "passPercentageByDepartment": [
    { "department": "Mathematics", "passPercentage": 82.5, "toppers": ["Name (xx%)"] }
  ],
  "yearlyTrends": [
    { "year": "2021", "overallPassPercentage": 71.2 }
  ]
}
```

### `data/calendar.json` — Academic Events
```json
[
  { "day": "15", "month": "June", "title": "Event Title", "desc": "Short description." }
]
```

---

## 6. PYQ Module Key Details (`js/pyq.js`)

### Google Drive Folder Links (currently configured)
```js
const pyqFolderLinks = {
  'Major': {
    'Mathematics': {
      1: 'https://drive.google.com/drive/folders/1PuFi0f0u-BRO7Btrx_iovzMYimXkbfDV',  // Sem 1
      3: 'https://drive.google.com/drive/folders/1fTd2QZqbJNqS0y4cMwBafFBZwc_wiNne',  // Sem 3
      4: 'https://drive.google.com/drive/folders/19CrozvOQtzt_QOC164YWAhAnAxSXY13Z'   // Sem 4
    }
  }
};
```

### Real PYQ Papers with Google Drive URLs

| Subject | Sem | Paper ID | Filename |
|---|---|---|---|
| Mathematics Major | 1 | `pyq-mj-math-sem1-mj01-2022` | maths_mj_01_sem1_pyq_2022-2026 |
| Mathematics Major | 1 | `pyq-mj-math-sem1-mj01-2023` | maths_mj_01_sem1_pyq_2023-2027 |
| Mathematics Major | 3 | `pyq-mj-math-sem3-mj04-2022` | maths_mj_04_sem3_pyq_2022-2026 |
| Mathematics Major | 3 | `pyq-mj-math-sem3-mj05-2022` | maths_mj_05_sem3_pyq_2022-2026 |
| Mathematics Major | 3 | `pyq-mj-math-sem3-mj04-2023` | maths_mj-04_sem3_pyq_2023-2027 |
| Mathematics Major | 3 | `pyq-mj-math-sem3-mj05-2023` | maths_mj-05_sem3_pyq_2023-2027 |
| Mathematics Major | 4 | `pyq-mj-math-sem4-mj06` | mj-06 maths 2022-2026 |
| Mathematics Major | 4 | `pyq-mj-math-sem4-mj07` | MJ-07 maths 2022-2026 |
| Mathematics Major | 4 | `pyq-mj-math-sem4-mj08` | mj-08 maths 2022-2026 |
| Physics Minor | 4 | `pyq-mn-phy-sem4-mn1b` | mn-1b phy 2022-2026 |

> All other entries (Math Sem 2, Physics Major, Chemistry, MDC, SEC, VAC, AEC) are **mock placeholders** without `downloadUrl`. They download a `.txt` file. Replace with real Google Drive links when available.

---

## 7. Syllabus Module Key Details (`js/syllabus.js`)

### PDF Naming Convention in `pdf/` folder
- Math Major: `math_sem{N}_syllabus.pdf` (Sems 1-8 all available)
- Math Minor: `math_minor_sem{N}_syllabus.pdf` (Sems 1-8 all available)
- Physics Major: `physics_sem{N}_syllabus.pdf` (Sems 1-8 all available)
- Physics Minor: `physics_minor_sem{N}_syllabus.pdf` (Sems 1-8 all available)
- Chemistry, Commerce, Arts: **No PDFs yet** — downloads show a "Not available" toast

### To Add a New Syllabus PDF
1. Copy PDF to `pdf/` folder with correct naming
2. Update `data/syllabus.json` — add semester to `modules` array
3. Update `js/syllabus.js` — add department/semester to the PDF download condition block
4. Increment `sw.js` cache version

---

## 8. How to Add New Content (Step-by-Step)

### Add a New PYQ Paper (Real Google Drive PDF)
1. Get the Google Drive **shareable link** (set "Anyone with the link can view")
2. Add entry to `data/pyqs.json`:
   ```json
   {
     "id": "pyq-[category]-[subject]-sem[N]-[code]-[year]",
     "title": "filename.pdf",
     "year": "2022-2026",
     "semester": 1,
     "category": "Major",
     "subject": "Mathematics",
     "downloadCount": 0,
     "fileSize": "PDF File",
     "downloadUrl": "https://drive.google.com/file/d/FILE_ID/view?usp=sharing"
   }
   ```
3. If you also have a Drive folder for that semester, add to `pyqFolderLinks` in `js/pyq.js`
4. Increment cache version in `sw.js` (`tata-hub-vN` → `tata-hub-v(N+1)`)
5. Repeat changes in the backup folder `C:\Users\Anurag\Documents\tatacollege\`

### Add a New Notice
1. Open `data/notices.json`, add new object at top (newest first)
2. Set `isPinned: true` for urgent notices, `isArchived: false` for active

---

## 9. Deployment

```bash
# Deploy to GitHub Pages
git add .
git commit -m "describe changes"
git push
# Live at: https://anurag-dev-99.github.io/Tata_College_Hub_Website/

# Local dev server
cd "C:\Users\Anurag\Documents\GitHub\Tata_College_Hub_Website"
python -m http.server 8080
# Open: http://localhost:8080
```

> Must use a local server — NOT `file://` — because ES Modules have CORS restrictions.

---

## 10. SEO Configuration (as of June 2026)

| Item | Value |
|---|---|
| Title | `Tata College Hub – PYQ, Syllabus & Results \| Chaibasa` (55 chars) |
| Meta Description | 140 chars — Tata College, Chaibasa, Kolhan University, PYQ, CGPA |
| Canonical URL | `https://anurag-dev-99.github.io/Tata_College_Hub_Website/` |
| OG Image | `og-image.png` (1200x630, hosted in repo root) |
| Twitter Card | `summary_large_image` |
| robots.txt | Present — blocks `/pdf/` and `/data/` folders |
| sitemap.xml | Present — 6 URL entries (all hash-route sections) |
| JSON-LD Schema | `WebSite`, `EducationalOrganization`, `WebPage`, `BreadcrumbList` |
| meta robots | `index, follow` |

---

## 11. Known Limitations

| Issue | Severity | Notes |
|---|---|---|
| Hash-based SPA routing | High | All sections are technically the same URL to crawlers |
| Mock PYQ entries | Medium | Many papers have no `downloadUrl` — clicking downloads a `.txt` |
| No admin panel | Medium | Content updates require manually editing JSON files |
| Form backend not connected | Medium | `SUBMISSION_API_URL = "YOUR_GOOGLE_SCRIPT_WEB_APP_URL"` in `app.js` |
| www/non-www redirect | Low | GitHub Pages limitation |
| Image Expires headers | Low | GitHub Pages doesn't support custom server headers |

---

## 12. PWA Cache Version History

| Version | Changes |
|---|---|
| `tata-hub-v20` | Initial PWA setup |
| `tata-hub-v21` | Added Physics Minor Sem 4 PYQ |
| `tata-hub-v22` | Fixed Maths Sem 7/8 dynamic tabs |
| `tata-hub-v23` | Removed Preview modal/button from PYQ view |
| `tata-hub-v24` | Added Math Major/Minor Sem 7 & 8 syllabus PDFs |
| `tata-hub-v25` | Added Math Major Sem 3 PYQs + folder link |
| `tata-hub-v26` | Removed legacy mock paper `pyq-mj-math5` |
| `tata-hub-v27` | Added Math Major Sem 1 PYQs + folder link |
| `tata-hub-v28` | SEO improvements: canonical, OG image, Twitter cards, JSON-LD, robots.txt, sitemap |
| `tata-hub-v29` | SEO fix: title 55 chars, description 140 chars, expanded fallback links |
| `tata-hub-v36` | Mobile responsive fixes, autocomplete search, stacked marks card list, merged leaderboard columns, radar mobile fit |
| `tata-hub-v37` | Radar chart centering with shortened labels, popstate modal back gesture intercept, batch leaderboard subject sorting dropdown |
| `tata-hub-v38` | Redesigned dashboard layout (Search moved to top, Leaderboard + Toppers rendered side-by-side on desktop), and added name-based autocomplete search suggestions to Compare Students inputs |
| `tata-hub-v39` | Compact stats cards in 2x2 grid on mobile; redesigned Subject Toppers layout from large cards to a compact list of rows (`.results-topper-compact-row`) to save space and display medal, subject, name, and score badge cleanly |
| `tata-hub-v40` | Removed outer `.card` container class from Subject Toppers card, replacing it with inline style card wrapper to prevent Android Chrome `backdrop-filter` overflow clipping bugs |
| `tata-hub-v41` | Replaced Subject Toppers row flex layout with CSS Grid layout (`26px 1fr auto`) and set strict `width: 100%` with `box-sizing: border-box` to prevent scores/numbers from getting pushed off-screen and disappearing on mobile in "All Majors" filter mode |

---

## 13. File Paths (Local Machine — Windows)

| Purpose | Path |
|---|---|
| Main GitHub repo | `C:\Users\Anurag\Documents\GitHub\Tata_College_Hub_Website\` |
| Backup working copy | `C:\Users\Anurag\Documents\tatacollege\` |
| Math Major syllabus source | `C:\Users\Anurag\Documents\GitHub\Major_math_syllabus\` |
| Math Minor syllabus source | `C:\Users\Anurag\Documents\GitHub\Minor_maths_syllabus\` |

---

## 14. External Services & Links

| Service | URL | Purpose |
|---|---|---|
| Kolhan University | https://kuuniv.ac.in/ | Main university portal |
| KU Result Portal | http://result.kolhanuniversity.ac.in/ | Exam results |
| Chancellor Portal | https://chancellorportal.jharkhanduniversities.nic.in/ | Admission/registration |
| Google Drive | https://drive.google.com/ | Hosts actual PYQ PDF files |
| Google Fonts | https://fonts.googleapis.com/ | Plus Jakarta Sans font |
| Lucide Icons | https://unpkg.com/lucide@latest | Icon library |
| Chart.js | https://cdn.jsdelivr.net/npm/chart.js | Results charts |
