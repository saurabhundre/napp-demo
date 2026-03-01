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

// ----- First-time reels (full-screen, 10 posts, one-time only) -----
(function () {
  const STORAGE_KEY = 'exam_home_reels_seen';
  const STORAGE_KEY_ICON_DISMISSED = 'exam_home_reels_icon_dismissed';
  try {
    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (nav && typeof nav.transferSize === 'number' && nav.transferSize > 0) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY_ICON_DISMISSED);
    }
  } catch (_) {}
  const overlay = document.getElementById('reelsOverlay');
  const track = document.getElementById('reelsTrack');
  const trackWrap = document.getElementById('reelsTrackWrap');
  const progressSegmentsEl = document.getElementById('reelsProgressSegments');
  const backBtn = document.getElementById('reelsBackBtn');
  const muteBtn = document.getElementById('reelsMuteBtn');
  const reelFab = document.getElementById('reelsReopenFab');
  const viewHomeEl = document.getElementById('viewHome');

  if (!overlay || !track || !trackWrap || !progressSegmentsEl || !backBtn) return;

  var openedFromIcon = false;
  var reelsFabDismissedThisSession = false;

  var REELS_POSTS = [
    { type: 'video', video: 'reel1.mp4', duration: 16, title: 'Anatomy and physiology are key aspects of nursing fundamentals', cta: 'Watch Full Video', likes: 230, comments: 46, shares: 10 },
    { type: 'video', video: 'reel2.mp4', duration: 15, title: 'How to Crack RRB Nursing Superintendent Exam in First Attempt?', sub: 'Railway Nursing Officer Banna Hai?', cta: 'Watch Full Video', likes: 230, comments: 46, shares: 10 },
    { type: 'question', questionImage: 'images/question-img.png', duration: 8, question: 'Identify the condition: Upper back fat accumulation (buffalo hump) is a classic sign of:', options: ['Prednisolone', 'Growth Hormone Deficiency', 'Insulin Deficiency', 'Thyroid Hormone Excess'], chapter: 'Chapter : Cardiac Nursing Basics', cta: 'View Lesson Topic', likes: 230, comments: 46, shares: 10 },
    { type: 'video', video: 'reel4.mp4', duration: 17, title: 'NORCET preparation tips from toppers', cta: 'Watch Full Video', likes: 189, comments: 32, shares: 8 },
    { type: 'video', video: 'reel3.mp4', duration: 15, title: 'What is ABG Analysis?', cta: 'Watch Full Video', likes: 156, comments: 28, shares: 5 },
    { type: 'question', duration: 17, question: 'The primary function of the respiratory system is:', options: ['Gas exchange', 'Blood filtration', 'Hormone production', 'Nutrient absorption'], chapter: 'Chapter : Anatomy & Physiology', cta: 'View Question Bank', likes: 210, comments: 41, shares: 12 },
    { type: 'question', duration: 18, question: 'Which vitamin is essential for blood clotting?', options: ['Vitamin A', 'Vitamin B12', 'Vitamin C', 'Vitamin K'], chapter: 'Chapter : Nutrition', cta: 'View Lesson Topic', likes: 195, comments: 38, shares: 9 },
    { type: 'cta', duration: 6, welcome: 'All set! Welcome 🎉', title: 'Start your nursing career journey with NPep', cta: 'Get Started' },
  ];

  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function renderSlide(post, index) {
    var sidebar = '<div class="reels-slide-sidebar">' +
      '<div class="reels-slide-stat"><span class="material-symbols-outlined">favorite</span><span>' + (post.likes || 0) + '</span></div>' +
      '<div class="reels-slide-stat"><span class="material-symbols-outlined">chat_bubble</span><span>' + (post.comments || 0) + '</span></div>' +
      '<div class="reels-slide-stat"><span class="material-symbols-outlined">share</span><span>' + (post.shares || 0) + '</span></div>' +
      '</div>';

    if (post.type === 'cta') {
      return '<div class="reels-slide reels-slide--cta" data-index="' + index + '">' +
        '<div class="reels-slide-media reels-slide-media--cta"></div>' +
        '<div class="reels-cta-wrap">' +
        (post.welcome ? '<p class="reels-cta-welcome">' + escapeHtml(post.welcome) + '</p>' : '') +
        (post.title ? '<h2 class="reels-cta-title">' + escapeHtml(post.title) + '</h2>' : '') +
        (post.cta ? '<button type="button" class="reels-cta-btn">' + escapeHtml(post.cta) + '</button>' : '') +
        '</div>' +
        '</div>';
    }

    if (post.type === 'question') {
      var opts = (post.options || []).map(function (opt, i) {
        var letter = String.fromCharCode(65 + i);
        return '<button type="button" class="reels-q-option"><span>' + letter + '</span><span>' + escapeHtml(opt) + '</span></button>';
      }).join('');
      var questionImgHtml = post.questionImage
        ? '<div class="reels-q-img-wrap"><img src="' + escapeHtml(post.questionImage) + '" alt="" class="reels-q-img" /></div>'
        : '';
      var qCenter = '<div class="reels-slide-question-center">' +
        '<div class="reels-slide-question">' +
        '<p class="reels-q-text">' + escapeHtml(post.question) + '</p>' +
        questionImgHtml +
        '<div class="reels-q-options">' + opts + '</div>' +
        '</div>' +
        '</div>';
      var qBottomOverlay = '<div class="reels-slide-bottom reels-slide-bottom--question">' +
        (post.chapter ? '<p class="reels-chapter">' + escapeHtml(post.chapter) + '</p>' : '') +
        (post.cta ? '<button type="button" class="reels-slide-cta">' + escapeHtml(post.cta) + ' <span class="material-symbols-outlined">chevron_right</span></button>' : '') +
        '</div>';
      return '<div class="reels-slide reels-slide--question" data-index="' + index + '">' +
        '<div class="reels-slide-media reels-slide-media--bg"></div>' +
        qCenter + qBottomOverlay + sidebar + '</div>';
    }

    if (post.type === 'video') {
      var videoSrc = post.video ? escapeHtml(post.video) : '';
      var videoHtml = videoSrc
        ? '<video class="reels-video" src="' + videoSrc + '" muted playsinline loop preload="metadata" aria-label="Reel video"></video>'
        : '';
      var bottomOverlay = '<div class="reels-slide-bottom">' +
        (post.title ? '<p class="reels-slide-title">' + escapeHtml(post.title) + '</p>' : '') +
        (post.cta ? '<button type="button" class="reels-slide-cta">' + escapeHtml(post.cta) + ' <span class="material-symbols-outlined">chevron_right</span></button>' : '') +
        '</div>';
      return '<div class="reels-slide" data-index="' + index + '">' +
        '<div class="reels-slide-media reels-slide-video">' +
        videoHtml +
        '<button type="button" class="reels-play-btn" aria-label="Play" data-reel-index="' + index + '"><span class="material-symbols-outlined">play_arrow</span></button>' +
        '</div>' + bottomOverlay + sidebar + '</div>';
    }

    var imgBottomOverlay = '<div class="reels-slide-bottom">' +
      (post.title ? '<p class="reels-slide-title">' + escapeHtml(post.title) + '</p>' : '') +
      (post.sub ? '<p class="reels-slide-sub">' + escapeHtml(post.sub) + '</p>' : '') +
      (post.cta ? '<button type="button" class="reels-slide-cta">' + escapeHtml(post.cta) + ' <span class="material-symbols-outlined">chevron_right</span></button>' : '') +
      '</div>';
    return '<div class="reels-slide" data-index="' + index + '">' +
      '<div class="reels-slide-media">' +
      '<img src="images/slide-01.svg" alt="" />' +
      '</div>' + imgBottomOverlay + sidebar + '</div>';
  }

  function buildTrack() {
    track.innerHTML = REELS_POSTS.map(renderSlide).join('');
  }

  function buildProgressSegments() {
    progressSegmentsEl.innerHTML = '<div class="reels-progress-segment reels-progress-segment--single">' +
      '<div class="reels-progress-segment-fill" id="reelsProgressFill"></div>' +
      '</div>';
  }

  function getCurrentIndex() {
    var scrollTop = trackWrap.scrollTop;
    var slideHeight = trackWrap.clientHeight;
    if (!slideHeight) return 0;
    var index = Math.round(scrollTop / slideHeight);
    return Math.min(REELS_POSTS.length - 1, Math.max(0, index));
  }

  function goToSlide(index, instant) {
    var slideHeight = trackWrap.clientHeight;
    trackWrap.scrollTo({ top: index * slideHeight, behavior: instant ? 'auto' : 'smooth' });
    currentIndex = index;
    pauseAllReelVideos();
    setTimeout(function () { playCurrentReelVideo(); }, instant ? 50 : 350);
  }

  var autoPlayTimer = null;
  var segmentStartTime = null;
  var currentIndex = 0;
  var rafId = null;

  function stopAutoPlay() {
    if (autoPlayTimer) {
      clearTimeout(autoPlayTimer);
      autoPlayTimer = null;
    }
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    segmentStartTime = null;
  }

  function setSegmentFill(index, pct) {
    if (index !== currentIndex) return;
    var fill = document.getElementById('reelsProgressFill');
    if (fill) fill.style.width = Math.min(100, Math.max(0, pct)) + '%';
  }

  function tick() {
    if (segmentStartTime == null || !overlay.getAttribute('data-open')) return;
    var post = REELS_POSTS[currentIndex];
    var duration = (post && post.duration) ? post.duration : 5;
    var elapsed = (Date.now() - segmentStartTime) / 1000;
    var pct = (elapsed / duration) * 100;
    setSegmentFill(currentIndex, pct);
    if (elapsed >= duration) {
      stopAutoPlay();
      if (currentIndex < REELS_POSTS.length - 1) {
        currentIndex += 1;
        goToSlide(currentIndex, true);
        startAutoPlay();
      }
      return;
    }
    rafId = requestAnimationFrame(tick);
  }

  function startAutoPlay() {
    stopAutoPlay();
    currentIndex = getCurrentIndex();
    setSegmentFill(currentIndex, 0);
    segmentStartTime = Date.now();
    rafId = requestAnimationFrame(tick);
  }

  function onScroll() {
    var idx = getCurrentIndex();
    if (idx !== currentIndex) {
      currentIndex = idx;
      setSegmentFill(currentIndex, 0);
      segmentStartTime = Date.now();
      rafId = requestAnimationFrame(tick);
      pauseAllReelVideos();
      playCurrentReelVideo();
    }
  }

  function pauseAllReelVideos() {
    if (!track) return;
    track.querySelectorAll('.reels-video').forEach(function (v) {
      v.pause();
      v.currentTime = 0;
    });
    track.querySelectorAll('.reels-play-btn').forEach(function (btn) {
      btn.classList.remove('reels-play-btn--hidden');
      btn.querySelector('.material-symbols-outlined').textContent = 'play_arrow';
    });
  }

  function playCurrentReelVideo() {
    if (!track || !overlay.getAttribute('data-open')) return;
    var slide = track.querySelector('.reels-slide[data-index="' + currentIndex + '"]');
    if (!slide) return;
    var video = slide.querySelector('.reels-video');
    var playBtn = slide.querySelector('.reels-play-btn');
    if (video) {
      video.play().catch(function () {});
      if (playBtn) playBtn.classList.add('reels-play-btn--hidden');
    }
  }

  function updateReelsFabVisibility() {
    if (!reelFab) return;
    try {
      var reelsSeen = localStorage.getItem(STORAGE_KEY) === '1';
      var iconDismissed = localStorage.getItem(STORAGE_KEY_ICON_DISMISSED) === '1';
      var onHome = viewHomeEl && viewHomeEl.classList.contains('view--active');
      var show = reelsSeen && !iconDismissed && !reelsFabDismissedThisSession && onHome;
      reelFab.hidden = !show;
    } catch (_) {
      reelFab.hidden = true;
    }
  }

  function closeReels() {
    stopAutoPlay();
    pauseAllReelVideos();
    try {
      localStorage.setItem(STORAGE_KEY, '1');
      if (openedFromIcon) {
        localStorage.setItem(STORAGE_KEY_ICON_DISMISSED, '1');
        if (reelFab) reelFab.hidden = true;
      } else {
        updateReelsFabVisibility();
      }
    } catch (_) {}
    openedFromIcon = false;
    overlay.removeAttribute('data-open');
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
  }

  function showReels() {
    buildTrack();
    buildProgressSegments();
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('data-open', 'true');
    trackWrap.scrollTop = 0;
    currentIndex = 0;
    setSegmentFill(0, 0);
    startAutoPlay();
    pauseAllReelVideos();
    playCurrentReelVideo();
  }

  backBtn.addEventListener('click', function () {
    closeReels();
  });

  if (reelFab) {
    reelFab.addEventListener('click', function (e) {
      if (e.target.closest('.reels-fab-close')) return;
      openedFromIcon = true;
      showReels();
    });
  }

  var reelFabClose = document.getElementById('reelsFabClose');
  if (reelFabClose && reelFab) {
    reelFabClose.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      reelsFabDismissedThisSession = true;
      reelFab.hidden = true;
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener('click', function () {
      var icon = muteBtn.querySelector('.material-symbols-outlined');
      if (icon) {
        var off = icon.textContent === 'volume_off';
        icon.textContent = off ? 'volume_up' : 'volume_off';
      }
    });
  }

  trackWrap.addEventListener('scroll', function () {
    onScroll();
  }, { passive: true });

  track.addEventListener('click', function (e) {
    if (e.target.closest('.reels-cta-btn')) {
      e.preventDefault();
      closeReels();
      return;
    }
    if (e.target.closest('.reels-slide-cta') || e.target.closest('.reels-q-option')) e.preventDefault();
    var playBtn = e.target.closest('.reels-play-btn');
    if (playBtn) {
      e.preventDefault();
      var slide = playBtn.closest('.reels-slide');
      var video = slide && slide.querySelector('.reels-video');
      if (video) {
        if (video.paused) {
          video.play();
          playBtn.classList.add('reels-play-btn--hidden');
        } else {
          video.pause();
          playBtn.classList.remove('reels-play-btn--hidden');
        }
      }
    }
  });

  try {
    if (!localStorage.getItem(STORAGE_KEY)) {
      showReels();
    } else {
      updateReelsFabVisibility();
    }
  } catch (_) {
    showReels();
  }

  window.updateReelsFabVisibility = updateReelsFabVisibility;
})();

// ----- Bottom nav: active tab + sliding pill -----
const bottomNav = document.getElementById('bottomNav');
const viewHome = document.getElementById('viewHome');
const viewVideos = document.getElementById('viewVideos');
const viewTests = document.getElementById('viewTests');
const mainHeader = document.getElementById('mainHeader');

if (bottomNav) {
  function showView(viewId) {
    [viewHome, viewVideos, viewTests].forEach((v) => {
      if (!v) return;
      const isActive = v.id === viewId;
      v.classList.toggle('view--active', isActive);
      v.hidden = !isActive;
    });
    if (mainHeader) mainHeader.classList.toggle('header--hidden', viewId !== 'viewHome');
    if (viewId !== 'viewVideos') document.body.classList.remove('hide-bottom-nav');
    if (typeof window.updateReelsFabVisibility === 'function') window.updateReelsFabVisibility();
  }

  var moreSheet = document.getElementById('moreSheet');
  var moreSheetClose = document.getElementById('moreSheetClose');

  function openMoreSheet() {
    if (moreSheet) {
      moreSheet.setAttribute('data-open', 'true');
      moreSheet.setAttribute('aria-hidden', 'false');
    }
  }

  function closeMoreSheet() {
    if (moreSheet) {
      moreSheet.removeAttribute('data-open');
      moreSheet.setAttribute('aria-hidden', 'true');
    }
    bottomNav.querySelectorAll('.bottom-nav-item').forEach((i) => i.classList.remove('active'));
    var homeNavItem = bottomNav.querySelector('.bottom-nav-item[data-nav-index="0"]');
    if (homeNavItem) homeNavItem.classList.add('active');
    bottomNav.style.setProperty('--active-index', '0');
    if (viewHome) showView('viewHome');
  }

  if (moreSheetClose) moreSheetClose.addEventListener('click', closeMoreSheet);

  bottomNav.querySelectorAll('.bottom-nav-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const index = parseInt(item.getAttribute('data-nav-index'), 10);
      bottomNav.querySelectorAll('.bottom-nav-item').forEach((i) => i.classList.remove('active'));
      item.classList.add('active');
      bottomNav.style.setProperty('--active-index', index);

      if (index === 4) {
        openMoreSheet();
        return;
      }
      if (index === 2 && viewVideos) {
        showView('viewVideos');
        var stepSub = document.getElementById('videoStepSubjects');
        var stepVid = document.getElementById('videoStepVideos');
        if (stepSub) stepSub.hidden = false;
        if (stepVid) stepVid.hidden = true;
        document.body.classList.remove('hide-bottom-nav');
      } else if (index === 3 && viewTests) {
        showView('viewTests');
        document.body.classList.remove('hide-bottom-nav');
        if (typeof window.checkTestExamFirstTime === 'function') window.checkTestExamFirstTime();
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

  var testBackBtn = document.getElementById('testBackBtn');
  if (testBackBtn) {
    testBackBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var homeNavItem = bottomNav && bottomNav.querySelector('.bottom-nav-item[data-nav-index="0"]');
      if (homeNavItem) homeNavItem.click();
    });
  }
}

// ----- Test page: tab switching (PYQ, Daily, Mini, Subject, Pre Board) -----
(function () {
  var testTabs = document.getElementById('testTabs');
  var contentDaily = document.getElementById('testContentDaily');
  var contentPyq = document.getElementById('testContentPyq');
  var contentMini = document.getElementById('testContentMini');
  var contentSubject = document.getElementById('testContentSubject');
  var contentPreboard = document.getElementById('testContentPreboard');
  var examHead = document.getElementById('testExamHead');
  if (!testTabs) return;

  var panels = {
    pyq: contentPyq,
    daily: contentDaily,
    mini: contentMini,
    subject: contentSubject,
    preboard: contentPreboard,
  };

  function showPanel(tabId) {
    Object.keys(panels).forEach(function (id) {
      var el = panels[id];
      if (el) el.classList.toggle('test-content-panel--hidden', id !== tabId);
    });
    var hideExamHead = tabId === 'mini' || tabId === 'subject' || tabId === 'preboard';
    if (examHead) examHead.classList.toggle('test-exam-head--hidden', hideExamHead);
  }

  testTabs.querySelectorAll('.test-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tabId = btn.getAttribute('data-test-tab');
      testTabs.querySelectorAll('.test-tab').forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      showPanel(tabId);
    });
  });

  showPanel('pyq');

  var pyqFilters = document.querySelectorAll('.test-pyq-filter');
  pyqFilters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      pyqFilters.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });
})();

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
  const videoListEl = document.getElementById('videoList');

  if (!subjectListEl || !videoListEl) return;

  const SUBJECT_DATA = [
    { id: 'anatomy', name: 'Anatomy & Physiology', teacherName: 'Dr. Anjali Verma', teacherImage: 'images/teacher-01.png', videoCount: 12, teacherTagline: 'Expert in Anatomy & Physiology. Master the fundamentals.' },
    { id: 'nursing', name: 'Nursing Fundamentals', teacherName: 'Dr. Priya Sharma', teacherImage: 'images/teacher-02.png', videoCount: 18, teacherTagline: 'Nursing Fundamentals made simple and exam-ready.' },
    { id: 'medical', name: 'Medical-Surgical Nursing', teacherName: 'Dr. Rajesh Kumar', teacherImage: 'images/teacher-03.png', videoCount: 14, teacherTagline: 'Medical-Surgical concepts for NORCET & AIIMS.' },
    { id: 'pediatric', name: 'Pediatric Nursing', teacherName: 'Dr. Sneha Patel', teacherImage: 'images/teacher-04.png', videoCount: 10, teacherTagline: 'Pediatric Nursing from growth to critical care.' },
    { id: 'revision', name: 'Rapid Revision', teacherName: 'Dr. Amit Singh', teacherImage: 'images/teacher-05.png', videoCount: 8, teacherTagline: 'Quick revision strategies for last-minute prep.' },
    { id: 'pharmacology', name: 'Pharmacology', teacherName: 'Dr. Kavita Nair', teacherImage: 'images/teacher-06.png', videoCount: 6, teacherTagline: 'Pharmacology simplified for nursing exams.' },
  ];

  var LECTURE_SECTIONS_BY_SUBJECT = {
    anatomy: [
      {
        sectionTitle: 'Anatomy - Respiratory System',
        lectures: [
          { title: 'Overview of Respiratory Tract', duration: '22:45', progress: 100, showPlayIcon: false },
          { title: 'Lungs and Pleura - Structure & Function', duration: '28:10', progress: 60, showPlayIcon: true },
          { title: 'Mechanics of Breathing', duration: '19:30', progress: 0, showPlayIcon: false },
        ],
      },
      {
        sectionTitle: 'Cardiovascular Anatomy',
        lectures: [
          { title: 'Anatomy of Human Heart', duration: '35:20', progress: 0, showPlayIcon: false },
          { title: 'Physiology - Cardiovascular System', duration: '42:15', progress: 0, showPlayIcon: false },
          { title: 'Blood Vessels and Circulation', duration: '25:40', progress: 0, showPlayIcon: false },
        ],
      },
      {
        sectionTitle: 'Musculoskeletal System',
        lectures: [
          { title: 'Bones and Joints - Upper Limb', duration: '31:00', progress: 0, showPlayIcon: false },
          { title: 'Bones and Joints - Lower Limb', duration: '28:50', progress: 0, showPlayIcon: false },
        ],
      },
    ],
    nursing: [
      {
        sectionTitle: 'Nursing Fundamentals',
        lectures: [
          { title: 'Introduction to Nursing Process', duration: '45:00', progress: 100, showPlayIcon: false },
          { title: 'Nursing Fundamentals - Vital Signs', duration: '38:20', progress: 100, showPlayIcon: false },
          { title: 'Patient Safety and Hygiene', duration: '52:10', progress: 40, showPlayIcon: true },
          { title: 'Documentation and Reporting', duration: '28:45', progress: 0, showPlayIcon: false },
        ],
      },
      {
        sectionTitle: 'Clinical Skills',
        lectures: [
          { title: 'Cardiac Nursing Basics - Introduction', duration: '18:24', progress: 0, showPlayIcon: false },
          { title: 'Nursing Ethics & Legal Aspects', duration: '41:15', progress: 0, showPlayIcon: false },
          { title: 'Infection Control in Healthcare', duration: '35:30', progress: 0, showPlayIcon: false },
        ],
      },
    ],
    medical: [
      {
        sectionTitle: 'Medical-Surgical Nursing',
        lectures: [
          { title: 'Fluid and Electrolyte Balance', duration: '55:20', progress: 80, showPlayIcon: true },
          { title: 'Medical-Surgical Nursing - Fluid Balance', duration: '28:40', progress: 0, showPlayIcon: false },
          { title: 'Medical-Surgical - Wound Care', duration: '44:10', progress: 0, showPlayIcon: false },
        ],
      },
      {
        sectionTitle: 'Critical Care Basics',
        lectures: [
          { title: 'Acute Respiratory Conditions', duration: '38:00', progress: 0, showPlayIcon: false },
          { title: 'Shock and Hemorrhage Management', duration: '42:30', progress: 0, showPlayIcon: false },
        ],
      },
    ],
    pediatric: [
      {
        sectionTitle: 'Pediatric Growth & Development',
        lectures: [
          { title: 'Pediatric Nursing - Growth & Development', duration: '48:25', progress: 100, showPlayIcon: false },
          { title: 'Milestones and Developmental Assessment', duration: '32:10', progress: 25, showPlayIcon: true },
          { title: 'Common Childhood Disorders', duration: '39:40', progress: 0, showPlayIcon: false },
        ],
      },
      {
        sectionTitle: 'Child Health',
        lectures: [
          { title: 'Pediatric Nursing - Immunization', duration: '36:15', progress: 0, showPlayIcon: false },
          { title: 'Nutrition in Pediatrics', duration: '28:50', progress: 0, showPlayIcon: false },
        ],
      },
    ],
    revision: [
      {
        sectionTitle: 'Rapid Revision - Core Topics',
        lectures: [
          { title: 'NORCET Rapid Revision - Day 1', duration: '1 hr 15min', progress: 90, showPlayIcon: true },
          { title: 'Rapid Revision - Pharmacology', duration: '58:20', progress: 0, showPlayIcon: false },
          { title: 'Quick Recap - Anatomy & Physiology', duration: '1 hr 05min', progress: 0, showPlayIcon: false },
        ],
      },
      {
        sectionTitle: 'Practice & PYQs',
        lectures: [
          { title: 'NORCET PYQ Discussion - 2023', duration: '1 hr 30min', progress: 0, showPlayIcon: false },
          { title: 'Topic-wise MCQs - Nursing', duration: '45:00', progress: 0, showPlayIcon: false },
        ],
      },
    ],
    pharmacology: [
      {
        sectionTitle: 'Introduction to Pharmacology',
        lectures: [
          { title: 'Introduction to Pharmacology', duration: '50:00', progress: 70, showPlayIcon: true },
          { title: 'Pharmacokinetics and Pharmacodynamics', duration: '44:30', progress: 0, showPlayIcon: false },
          { title: 'Drug Classification and Uses', duration: '38:20', progress: 0, showPlayIcon: false },
        ],
      },
      {
        sectionTitle: 'Clinical Pharmacology',
        lectures: [
          { title: 'Antibiotics and Antimicrobials', duration: '52:10', progress: 0, showPlayIcon: false },
          { title: 'Cardiovascular and CNS Drugs', duration: '41:45', progress: 0, showPlayIcon: false },
        ],
      },
    ],
  };

  var LECTURE_SECTIONS_DUMMY_FALLBACK = [
    {
      sectionTitle: 'Introduction',
      lectures: [
        { title: 'Introduction - Part 1', duration: '2 hr 30min', progress: 75, showPlayIcon: true },
        { title: 'Introduction - Part 2', duration: '1 hr 30min', progress: 0, showPlayIcon: false },
      ],
    },
  ];

  let selectedSubjectId = null;
  let videoTabFilter = 'all';

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function openSubject(id) {
    selectedSubjectId = id;
    var subj = SUBJECT_DATA.find(function (s) { return s.id === id; });
    if (videoStepSubjects) videoStepSubjects.hidden = true;
    if (videoStepVideos) videoStepVideos.hidden = false;
    document.body.classList.add('hide-bottom-nav');
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

    var headingEl = document.getElementById('videoListingHeading');
    if (headingEl && subj) headingEl.textContent = subj.name;

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

    var sections = (selectedSubjectId && LECTURE_SECTIONS_BY_SUBJECT[selectedSubjectId])
      ? LECTURE_SECTIONS_BY_SUBJECT[selectedSubjectId]
      : LECTURE_SECTIONS_DUMMY_FALLBACK;
    var globalIndex = 0;
    videoListEl.innerHTML = sections.map(function (section) {
      var sectionHtml = '<h2 class="video-lecture-section-title">' + escapeHtml(section.sectionTitle) + '</h2>';
      var itemsHtml = section.lectures.map(function (lec) {
        globalIndex += 1;
        var num = globalIndex;
        var progress = lec.progress || 0;
        var icon = lec.showPlayIcon ? 'play_arrow' : 'chevron_right';
        var itemClass = 'video-lecture-item' + (lec.showPlayIcon ? ' has-play' : '');
        var progressHtml = '<div class="video-lecture-progress">' +
          '<div class="video-lecture-progress-bar" style="width:' + progress + '%"></div></div>';
        return '<a href="#" class="' + itemClass + '" data-lecture-index="' + num + '">' +
          '<div class="video-lecture-left">' +
          '<span class="video-lecture-num">' + num + '</span>' +
          '<span class="video-lecture-connector" aria-hidden="true"></span>' +
          '</div>' +
          '<div class="video-lecture-card">' +
          '<div class="video-lecture-card-body">' +
          '<h3 class="video-lecture-card-title">' + escapeHtml(lec.title) + '</h3>' +
          '<p class="video-lecture-card-meta">' +
          '<span class="material-symbols-outlined">schedule</span>' +
          '<span>' + escapeHtml(lec.duration) + '</span>' +
          '</p>' +
          progressHtml +
          '</div>' +
          '<span class="video-lecture-card-action"><span class="material-symbols-outlined">' + icon + '</span></span>' +
          '</div>' +
          '</a>';
      }).join('');
      return sectionHtml + itemsHtml;
    }).join('');

    videoListEl.querySelectorAll('.video-lecture-item').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); });
    });
  }

  if (videoBackBtn) {
    videoBackBtn.addEventListener('click', function () {
      selectedSubjectId = null;
      if (videoStepSubjects) videoStepSubjects.hidden = false;
      if (videoStepVideos) videoStepVideos.hidden = true;
      document.body.classList.remove('hide-bottom-nav');
    });
  }

  var filterTabsEl = document.querySelector('.video-filter-tabs');
  if (filterTabsEl) {
    filterTabsEl.addEventListener('click', function (e) {
      var tab = e.target.closest('.video-filter-tab');
      if (!tab) return;
      var filter = tab.getAttribute('data-video-filter');
      if (!filter) return;
      videoTabFilter = filter;
      filterTabsEl.querySelectorAll('.video-filter-tab').forEach(function (t) {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
      renderVideos();
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
        const titleHtml = t.id === 'mini-test'
          ? `<h3>${escapeHtml(t.title)} <span class="target-tag target-tag--live">Live</span></h3>`
          : `<h3>${escapeHtml(t.title)}</h3>`;
        return `<a href="#" class="target-card" data-target-id="${t.id}">
          <span class="${iconCls}"><img src="${t.icon}" alt="" /></span>
          <div class="target-body">
            ${titleHtml}
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

// ----- Test page: Select exam bottom sheet (first-time + edit icon) -----
(function () {
  const EXAM_STORAGE_KEY = 'exam_home_selected_exam';
  const FIRST_VISIT_STORAGE_KEY = 'exam_home_test_exam_picker_seen';

  const EXAM_OPTIONS = [
    { value: 'NORCET', label: 'NORCET (Nursing Officer Recruitment Common Eligibility Test)' },
    { value: 'AIIMS-NORCET', label: 'AIIMS NORCET' },
    { value: 'PGIMER-Nursing', label: 'PGIMER Nursing Officer' },
    { value: 'DSSSB-Nursing', label: 'DSSSB Nursing' },
    { value: 'ESIC-Nursing', label: 'ESIC Nursing Officer' },
    { value: 'RRB-Nursing', label: 'RRB Nursing (Railway)' },
    { value: 'UPSC-Nursing', label: 'UPSC Nursing Officer' },
    { value: 'State-NORCET', label: 'State NORCET / State Nursing' },
    { value: 'BSc-Nursing', label: 'B.Sc Nursing Entrance' },
    { value: 'MSc-Nursing', label: 'M.Sc Nursing Entrance' },
    { value: 'GNM', label: 'GNM (General Nursing & Midwifery)' },
    { value: 'ANM', label: 'ANM (Auxiliary Nursing Midwifery)' },
  ];

  const MAJOR_EXAMS = EXAM_OPTIONS.slice(0, 5);
  const ALL_EXAMS = EXAM_OPTIONS;

  const EXAM_LABELS = {};
  EXAM_OPTIONS.forEach(function (o) {
    EXAM_LABELS[o.value] = o.label.split(' (')[0].trim();
  });
  EXAM_LABELS['AIIMS-NORCET'] = 'AIIMS NORCET';
  EXAM_LABELS['NORCET'] = 'NORCET';

  const sheet = document.getElementById('testExamSheet');
  const sheetBackdrop = document.getElementById('testExamSheetBackdrop');
  const sheetClose = document.getElementById('testExamSheetClose');
  const sheetListEl = document.getElementById('testExamSheetList');
  const examLabelEl = document.getElementById('testExamLabel');
  const editBtn = document.getElementById('testExamEditBtn');

  if (!sheet || !sheetListEl) return;

  function getSelectedExam() {
    return localStorage.getItem(EXAM_STORAGE_KEY) || 'AIIMS-NORCET';
  }

  function setSelectedExam(value) {
    localStorage.setItem(EXAM_STORAGE_KEY, value || '');
  }

  function updateTestExamLabel() {
    if (!examLabelEl) return;
    const value = getSelectedExam();
    examLabelEl.textContent = value ? (EXAM_LABELS[value] || value) : 'Select exam';
  }

  function renderItem(o, selected) {
    var selectedClass = o.value === selected ? ' test-exam-item--selected' : '';
    return '<li class="bottom-sheet-item test-exam-item' + selectedClass + '" data-exam-value="' + o.value + '" role="button" tabindex="0">' +
      '<div class="bottom-sheet-item-body">' +
      '<strong>' + (o.label || o.value) + '</strong>' +
      '</div>' +
      (o.value === selected ? '<span class="material-symbols-outlined test-exam-check">check</span>' : '') +
      '</li>';
  }

  function renderList() {
    var selected = getSelectedExam();
    sheetListEl.innerHTML =
      '<div class="test-exam-group">' +
        '<h4 class="test-exam-group-title">Major Exams</h4>' +
        '<ul class="bottom-sheet-list">' +
          MAJOR_EXAMS.map(function (o) { return renderItem(o, selected); }).join('') +
        '</ul>' +
      '</div>' +
      '<div class="test-exam-group">' +
        '<h4 class="test-exam-group-title">All Exams</h4>' +
        '<ul class="bottom-sheet-list">' +
          ALL_EXAMS.map(function (o) { return renderItem(o, selected); }).join('') +
        '</ul>' +
      '</div>';
  }

  var openedForFirstTime = false;

  function openSheet(isFirstTime) {
    openedForFirstTime = !!isFirstTime;
    renderList();
    sheet.setAttribute('aria-hidden', 'false');
    sheet.setAttribute('data-open', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeSheet() {
    sheet.setAttribute('aria-hidden', 'true');
    sheet.setAttribute('data-open', 'false');
    document.body.style.overflow = '';
    if (openedForFirstTime) {
      localStorage.setItem(FIRST_VISIT_STORAGE_KEY, 'true');
      openedForFirstTime = false;
    }
  }

  sheetListEl.addEventListener('click', function (e) {
    var item = e.target.closest('.test-exam-item');
    if (!item) return;
    var value = item.getAttribute('data-exam-value');
    if (!value) return;
    setSelectedExam(value);
    updateTestExamLabel();
    closeSheet();
  });

  if (sheetClose) sheetClose.addEventListener('click', closeSheet);
  if (sheetBackdrop) sheetBackdrop.addEventListener('click', closeSheet);

  if (editBtn) editBtn.addEventListener('click', function () { openSheet(false); });

  updateTestExamLabel();

  window.checkTestExamFirstTime = function () {
    if (localStorage.getItem(FIRST_VISIT_STORAGE_KEY)) return;
    openSheet(true);
  };
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
