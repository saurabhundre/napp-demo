// ----- Hero slider -----
(function () {
  const track = document.getElementById('heroTrack');
  const dotsContainer = document.getElementById('heroDots');

  if (!track || !dotsContainer) return;

  const slides = track.querySelectorAll('.hero-card');
  const total = slides.length;
  let current = 0;
  let autoPlayTimer = null;
  const AUTO_PLAY_MS = 5000;

  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;

    dotsContainer.querySelectorAll('.hero-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
      dot.setAttribute('aria-current', i === current ? 'true' : 'false');
    });
  }

  function next() {
    goTo(current + 1);
    resetAutoPlay();
  }

  function prev() {
    goTo(current - 1);
    resetAutoPlay();
  }

  function resetAutoPlay() {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    autoPlayTimer = setInterval(next, AUTO_PLAY_MS);
  }

  // Build dots
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.setAttribute('aria-current', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => {
      goTo(i);
      resetAutoPlay();
    });
    dotsContainer.appendChild(dot);
  }

  // Touch swipe
  let touchStartX = 0;
  let touchEndX = 0;
  track.parentElement.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  track.parentElement.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  }, { passive: true });

  // Auto-play
  resetAutoPlay();

  // Pause auto-play when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    } else if (!document.hidden && total > 1) {
      resetAutoPlay();
    }
  });
})();

// ----- Bottom nav: active tab + sliding pill -----
const bottomNav = document.getElementById('bottomNav');
const viewHome = document.getElementById('viewHome');
const viewVideos = document.getElementById('viewVideos');
const mainHeader = document.getElementById('mainHeader');

if (bottomNav) {
  function showView(viewId) {
    [viewHome, viewVideos].forEach((v) => {
      if (!v) return;
      const isActive = v.id === viewId;
      v.classList.toggle('view--active', isActive);
      v.hidden = !isActive;
    });
    if (mainHeader) mainHeader.classList.toggle('header--hidden', viewId !== 'viewHome');
  }

  bottomNav.querySelectorAll('.bottom-nav-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const index = parseInt(item.getAttribute('data-nav-index'), 10);
      bottomNav.querySelectorAll('.bottom-nav-item').forEach((i) => i.classList.remove('active'));
      item.classList.add('active');
      bottomNav.style.setProperty('--active-index', index);

      if (index === 2 && viewVideos) {
        showView('viewVideos');
        var stepSub = document.getElementById('videoStepSubjects');
        var stepVid = document.getElementById('videoStepVideos');
        if (stepSub) stepSub.hidden = false;
        if (stepVid) stepVid.hidden = true;
      } else if (viewHome) {
        showView('viewHome');
      } else {
        showView('viewHome');
      }
    });
  });

  var videoLecturesBackBtn = document.getElementById('videoLecturesBackBtn');
  if (videoLecturesBackBtn) {
    videoLecturesBackBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var homeNavItem = bottomNav && bottomNav.querySelector('.bottom-nav-item[data-nav-index="0"]');
      if (homeNavItem) homeNavItem.click();
    });
  }
}

// ----- Status viewer (stories-style) -----
(function () {
  const viewer = document.getElementById('statusViewer');
  const openBtn = document.getElementById('statusRingBtn');
  const closeBtn = document.getElementById('statusClose');
  const slidesEl = document.getElementById('statusSlides');
  const tapPrev = document.getElementById('statusTapPrev');
  const tapNext = document.getElementById('statusTapNext');

  if (!viewer || !slidesEl) return;

  const slides = slidesEl.querySelectorAll('.status-slide');
  const segments = viewer.querySelectorAll('.status-segment');
  const total = slides.length;
  const DURATION_MS = 5000;

  let currentSlide = 0;
  let progressTimer = null;
  let startTime = 0;
  let rafId = null;

  function openViewer() {
    viewer.removeAttribute('hidden');
    viewer.setAttribute('data-open', 'true');
    document.body.style.overflow = 'hidden';
    currentSlide = 0;
    showSlide(0);
    startProgress();
  }

  function closeViewer() {
    viewer.setAttribute('data-open', 'false');
    viewer.setAttribute('hidden', '');
    document.body.style.overflow = '';
    stopProgress();
  }

  function showSlide(index) {
    currentSlide = index;
    slides.forEach((s, i) => s.classList.toggle('status-slide--active', i === index));
    segments.forEach((seg, i) => {
      seg.classList.toggle('viewed', i < index);
      seg.classList.toggle('active', i === index);
      if (i < index) seg.querySelector('.status-segment-fill').style.width = '100%';
      else if (i === index) seg.querySelector('.status-segment-fill').style.width = '0%';
      else seg.querySelector('.status-segment-fill').style.width = '0%';
    });
  }

  function startProgress() {
    stopProgress();
    startTime = Date.now();
    function tick() {
      const elapsed = Date.now() - startTime;
      const p = Math.min(elapsed / DURATION_MS, 1);
      const seg = segments[currentSlide];
      if (seg) {
        seg.style.setProperty('--progress', p * 100 + '%');
        seg.querySelector('.status-segment-fill').style.width = p * 100 + '%';
      }
      if (p >= 1) {
        if (currentSlide + 1 < total) {
          nextSlide();
        } else {
          closeViewer();
        }
        return;
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  }

  function stopProgress() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function nextSlide() {
    stopProgress();
    if (currentSlide + 1 >= total) {
      closeViewer();
      return;
    }
    showSlide(currentSlide + 1);
    startProgress();
  }

  function prevSlide() {
    stopProgress();
    if (currentSlide - 1 < 0) return;
    showSlide(currentSlide - 1);
    startProgress();
  }

  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openViewer();
  });

  closeBtn.addEventListener('click', closeViewer);

  tapNext.addEventListener('click', (e) => {
    e.preventDefault();
    nextSlide();
  });

  tapPrev.addEventListener('click', (e) => {
    e.preventDefault();
    prevSlide();
  });

  viewer.addEventListener('click', (e) => {
    if (e.target === viewer || e.target.classList.contains('status-viewer-inner')) {
      closeViewer();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (viewer.getAttribute('data-open') !== 'true') return;
    if (e.key === 'Escape') closeViewer();
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
  });

  // Touch swipe for next/prev
  let touchStartX = 0;
  viewer.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
  viewer.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) prevSlide();
      else nextSlide();
    }
  }, { passive: true });
})();

// ----- Video page: subject list first, then video listing -----
(function () {
  const subjectListEl = document.getElementById('subjectList');
  const subjectSummaryEl = document.getElementById('subjectSummary');
  const videoStepSubjects = document.getElementById('videoStepSubjects');
  const videoStepVideos = document.getElementById('videoStepVideos');
  const videoBackBtn = document.getElementById('videoBackBtn');
  const videoBackLabel = document.getElementById('videoBackLabel');
  const videoListEl = document.getElementById('videoList');
  const videoSummaryEl = document.getElementById('videoSummary');

  if (!subjectListEl || !videoListEl) return;

  const SUBJECT_DATA = [
    { id: 'anatomy', name: 'Anatomy & Physiology', teacherName: 'Dr. Anjali Verma', teacherImage: 'images/teacher-01.png', videoCount: 12, teacherTagline: 'Expert in Anatomy & Physiology. Master the fundamentals.' },
    { id: 'nursing', name: 'Nursing Fundamentals', teacherName: 'Dr. Priya Sharma', teacherImage: 'images/teacher-02.png', videoCount: 18, teacherTagline: 'Nursing Fundamentals made simple and exam-ready.' },
    { id: 'medical', name: 'Medical-Surgical Nursing', teacherName: 'Dr. Rajesh Kumar', teacherImage: 'images/teacher-03.png', videoCount: 14, teacherTagline: 'Medical-Surgical concepts for NORCET & AIIMS.' },
    { id: 'pediatric', name: 'Pediatric Nursing', teacherName: 'Dr. Sneha Patel', teacherImage: 'images/teacher-04.png', videoCount: 10, teacherTagline: 'Pediatric Nursing from growth to critical care.' },
    { id: 'revision', name: 'Rapid Revision', teacherName: 'Dr. Amit Singh', teacherImage: 'images/teacher-05.png', videoCount: 8, teacherTagline: 'Quick revision strategies for last-minute prep.' },
    { id: 'pharmacology', name: 'Pharmacology', teacherName: 'Dr. Kavita Nair', teacherImage: 'images/teacher-06.png', videoCount: 6, teacherTagline: 'Pharmacology simplified for nursing exams.' },
  ];

  let selectedSubjectId = null;

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function openSubject(id) {
    selectedSubjectId = id;
    var subj = SUBJECT_DATA.find(function (s) { return s.id === id; });
    if (videoBackLabel && subj) videoBackLabel.textContent = subj.name;
    if (videoStepSubjects) videoStepSubjects.hidden = true;
    if (videoStepVideos) videoStepVideos.hidden = false;
    renderVideos();
  }

  function renderSubjects() {
    subjectListEl.innerHTML = SUBJECT_DATA.map(function (s) {
      var countText = s.videoCount + ' video' + (s.videoCount !== 1 ? 's' : '');
      var summaryText = escapeHtml(s.teacherName) + ' · ' + countText;
      return '<a href="#" class="subject-card" data-subject-id="' + s.id + '">' +
        '<img src="' + escapeHtml(s.teacherImage) + '" alt="" class="subject-card-teacher" />' +
        '<div class="subject-card-body">' +
        '<h3 class="subject-card-title">' + escapeHtml(s.name) + '</h3>' +
        '<p class="subject-card-summary">' + summaryText + '</p>' +
        '</div>' +
        '<span class="subject-card-arrow"><span class="material-symbols-outlined">chevron_right</span></span>' +
        '</a>';
    }).join('');

    subjectListEl.querySelectorAll('.subject-card').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var id = el.getAttribute('data-subject-id');
        if (id) openSubject(id);
      });
    });
  }

  var videoFeaturedCard = document.getElementById('videoFeaturedCard');
  if (videoFeaturedCard) {
    videoFeaturedCard.addEventListener('click', function (e) {
      e.preventDefault();
      openSubject('revision');
    });
  }

  function renderVideos() {
    var subj = selectedSubjectId ? SUBJECT_DATA.find(function (s) { return s.id === selectedSubjectId; }) : null;
    var count = subj ? subj.videoCount : 0;

    var headingEl = document.getElementById('videoListingHeading');
    if (headingEl && subj) headingEl.textContent = subj.name;

    if (videoSummaryEl) {
      videoSummaryEl.textContent = count + ' video' + (count !== 1 ? 's' : '') + ' all topics';
    }
    var videoCountNearBack = document.getElementById('videoCountNearBack');
    if (videoCountNearBack) videoCountNearBack.textContent = count + ' video' + (count !== 1 ? 's' : '');

    var teacherCard = document.getElementById('videoTeacherCard');
    var teacherAvatar = document.getElementById('videoTeacherCardAvatar');
    var teacherNameEl = document.getElementById('videoTeacherCardName');
    var teacherTaglineEl = document.getElementById('videoTeacherCardTagline');
    var teacherTagline2El = document.getElementById('videoTeacherCardTagline2');
    if (teacherCard && teacherAvatar && teacherNameEl && teacherTaglineEl && subj) {
      teacherAvatar.src = subj.teacherImage;
      teacherAvatar.alt = subj.teacherName;
      teacherNameEl.textContent = 'Hey, I am ' + subj.teacherName;
      var tagline = subj.teacherTagline || ('Expert in ' + subj.name + '.');
      var parts = tagline.split(/\.\s+/).filter(Boolean);
      var line1 = parts[0] ? parts[0].trim() + '.' : '';
      var line2 = parts[1] ? parts[1].trim() + (parts[1].trim().endsWith('.') ? '' : '.') : '';
      teacherTaglineEl.textContent = line1;
      teacherTaglineEl.style.display = line1 ? '' : 'none';
      if (teacherTagline2El) {
        teacherTagline2El.textContent = line2;
        teacherTagline2El.style.display = line2 ? '' : 'none';
      }
      teacherCard.hidden = false;
    }

    videoListEl.innerHTML = '';
  }

  if (videoBackBtn) {
    videoBackBtn.addEventListener('click', function () {
      selectedSubjectId = null;
      if (videoStepSubjects) videoStepSubjects.hidden = false;
      if (videoStepVideos) videoStepVideos.hidden = true;
    });
  }

  renderSubjects();
})();

// ----- Daily Target: state, bottom sheet, add/remove -----
(function () {
  const STORAGE_KEY = 'exam_home_daily_targets';
  const EXAM_STORAGE_KEY = 'exam_home_selected_exam';

  const EXAM_LABELS = {
    'NORCET': 'NORCET',
    'AIIMS-NORCET': 'AIIMS NORCET',
    'PGIMER-Nursing': 'PGIMER Nursing',
    'DSSSB-Nursing': 'DSSSB Nursing',
    'ESIC-Nursing': 'ESIC Nursing',
    'RRB-Nursing': 'RRB Nursing',
    'UPSC-Nursing': 'UPSC Nursing',
    'State-NORCET': 'State NORCET',
    'BSc-Nursing': 'B.Sc Nursing',
    'MSc-Nursing': 'M.Sc Nursing',
    'GNM': 'GNM',
    'ANM': 'ANM',
  };

  const TARGET_POOL = {
    cardiac: {
      id: 'cardiac',
      title: 'Cardiac Nursing Basics',
      subtitle: '20min • 28 lessons',
      icon: 'images/videos.svg',
      iconClass: '',
    },
    'daily-test': {
      id: 'daily-test',
      title: 'Daily Test',
      subtitle: '👩🏼‍⚕️ 228 attempted today',
      icon: 'images/daily-test.svg',
      iconClass: 'target-icon--img',
    },
    'mini-test': {
      id: 'mini-test',
      title: 'Mini Test',
      subtitle: '12 hours left',
      icon: 'images/mini-test.svg',
      iconClass: 'target-icon--img',
    },
    pyqs: {
      id: 'pyqs',
      title: "NORCET PYQ's",
      subtitle: '2015-2021',
      icon: 'images/pyqs.svg',
      iconClass: 'target-icon--img',
    },
    preboard: {
      id: 'preboard',
      title: 'Pedia NORCET Pre-Board',
      subtitle: 'Starts at 21 March',
      icon: 'images/preboard.svg',
      iconClass: 'target-icon--img',
    },
  };

  const DEFAULT_IDS = ['cardiac', 'daily-test', 'mini-test'];

  function getState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [...DEFAULT_IDS];
  }

  function setState(ids) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }

  const listEl = document.getElementById('dailyTargetList');
  const sheet = document.getElementById('dailyTargetSheet');
  const sheetBackdrop = document.getElementById('dailyTargetSheetBackdrop');
  const sheetClose = document.getElementById('dailyTargetSheetClose');
  const editBtn = document.getElementById('dailyTargetEditBtn');
  const sheetListEl = document.getElementById('dailyTargetSheetList');
  const sheetAddListEl = document.getElementById('dailyTargetSheetAddList');
  const examSelectEl = document.getElementById('dailyTargetExamSelect');
  const examLabelEl = document.getElementById('dailyTargetExamLabel');

  if (!listEl || !sheet || !sheetListEl || !sheetAddListEl) return;

  function getSelectedExam() {
    return localStorage.getItem(EXAM_STORAGE_KEY) || '';
  }

  function setSelectedExam(value) {
    localStorage.setItem(EXAM_STORAGE_KEY, value || '');
  }

  function updateExamLabel() {
    if (!examLabelEl) return;
    const value = getSelectedExam();
    examLabelEl.textContent = value ? (EXAM_LABELS[value] || value) : '';
  }

  function renderMainList() {
    const ids = getState();
    listEl.innerHTML = ids
      .map((id) => {
        const t = TARGET_POOL[id];
        if (!t) return '';
        const iconCls = t.iconClass ? `target-icon target-icon--img` : 'target-icon';
        const subtitleHtml = t.id === 'daily-test'
          ? '<p class="target-rotating-subtitle"><span class="target-rotating-text">👩🏼‍⚕️ 228 attempted today</span></p>'
          : `<p>${escapeHtml(t.subtitle)}</p>`;
        return `<a href="#" class="target-card" data-target-id="${t.id}">
          <span class="${iconCls}"><img src="${t.icon}" alt="" /></span>
          <div class="target-body">
            <h3>${escapeHtml(t.title)}</h3>
            ${subtitleHtml}
          </div>
          <img src="images/arrow-right.svg" alt="" />
        </a>`;
      })
      .join('');
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function openSheet() {
    if (examSelectEl) examSelectEl.value = getSelectedExam();
    sheet.setAttribute('aria-hidden', 'false');
    sheet.setAttribute('data-open', 'true');
    document.body.style.overflow = 'hidden';
    renderSheet();
  }

  function closeSheet() {
    sheet.setAttribute('aria-hidden', 'true');
    sheet.setAttribute('data-open', 'false');
    document.body.style.overflow = '';
  }

  function renderSheet() {
    const ids = getState();
    sheetListEl.innerHTML = ids
      .map((id) => {
        const t = TARGET_POOL[id];
        if (!t) return '';
        return `<li class="bottom-sheet-item" data-target-id="${t.id}">
          <span class="bottom-sheet-item-icon"><img src="${t.icon}" alt="" /></span>
          <div class="bottom-sheet-item-body">
            <strong>${escapeHtml(t.title)}</strong>
            <span>${escapeHtml(t.subtitle)}</span>
          </div>
          <button type="button" class="bottom-sheet-btn bottom-sheet-btn--remove" data-action="remove" data-target-id="${t.id}" aria-label="Remove">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </li>`;
      })
      .join('');

    const available = Object.keys(TARGET_POOL).filter((id) => !ids.includes(id));
    sheetAddListEl.innerHTML = available
      .map((id) => {
        const t = TARGET_POOL[id];
        if (!t) return '';
        return `<li class="bottom-sheet-item" data-target-id="${t.id}" data-action="add" role="button" tabindex="0">
          <span class="bottom-sheet-item-icon"><img src="${t.icon}" alt="" /></span>
          <div class="bottom-sheet-item-body">
            <strong>${escapeHtml(t.title)}</strong>
            <span>${escapeHtml(t.subtitle)}</span>
          </div>
          <button type="button" class="bottom-sheet-btn bottom-sheet-btn--add" data-action="add" data-target-id="${t.id}" aria-label="Add">
            <span class="material-symbols-outlined">add</span>
          </button>
        </li>`;
      })
      .join('');

    sheetListEl.querySelectorAll('[data-action="remove"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-target-id');
        const ids = getState().filter((x) => x !== id);
        setState(ids);
        renderMainList();
        renderSheet();
      });
    });

    sheetAddListEl.querySelectorAll('[data-action="add"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-target-id');
        const ids = [...getState(), id];
        setState(ids);
        renderMainList();
        renderSheet();
      });
    });

    sheetAddListEl.querySelectorAll('.bottom-sheet-item[data-action="add"]').forEach((row) => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.bottom-sheet-btn')) return;
        const id = row.getAttribute('data-target-id');
        const ids = [...getState(), id];
        setState(ids);
        renderMainList();
        renderSheet();
      });
    });
  }

  editBtn.addEventListener('click', () => openSheet());
  sheetClose.addEventListener('click', closeSheet);
  sheetBackdrop.addEventListener('click', closeSheet);

  if (examSelectEl) {
    examSelectEl.addEventListener('change', () => {
      setSelectedExam(examSelectEl.value);
      updateExamLabel();
    });
  }

  renderMainList();
  updateExamLabel();

  const ROTATING_TEXTS = ['👩🏼‍⚕️ 228 attempted today', '🕑 2 hours left'];
  const ROTATE_INTERVAL_MS = 3000;
  const SLIDE_DURATION_MS = 350;
  let rotatingIndex = 0;

  setInterval(function () {
    const el = document.querySelector('.target-card[data-target-id="daily-test"] .target-rotating-text');
    if (!el) return;
    el.classList.add('target-rotating-text--exit');
    el.classList.remove('ready');
    setTimeout(function () {
      rotatingIndex = 1 - rotatingIndex;
      el.textContent = ROTATING_TEXTS[rotatingIndex];
      el.classList.remove('target-rotating-text--exit');
      el.classList.add('target-rotating-text--enter-from-bottom');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          el.classList.add('ready');
          setTimeout(function () {
            el.classList.remove('target-rotating-text--enter-from-bottom', 'ready');
          }, SLIDE_DURATION_MS);
        });
      });
    }, SLIDE_DURATION_MS);
  }, ROTATE_INTERVAL_MS);
})();

// ----- Dynamic greeting by time of day -----
function updateGreeting() {
  const hour = new Date().getHours();
  const el = document.querySelector('.greeting-time');
  if (!el) return;
  if (hour < 12) el.textContent = 'Good Morning';
  else if (hour < 17) el.textContent = 'Good Afternoon';
  else el.textContent = 'Good Evening';
}
updateGreeting();
