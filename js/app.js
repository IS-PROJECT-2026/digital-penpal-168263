window.DD = (function () {
  'use strict';

  const LETTERS_KEY = 'digital_dove_letters';
  const PROFILE_KEY = 'dove_user_profile';

  // Distance matrix: category determines transit duration in ms
  const DISTANCE_MATRIX = {
    local: 1 * 60 * 1000,
    regional: 5 * 60 * 1000,
    global: 10 * 60 * 1000
  };

  const DISTANCE_LABELS = {
    local: 'Local',
    regional: 'Regional',
    global: 'Global'
  };

  const SEAL_ICONS = {
    'gold-dove': '',
    'ruby-heart': '',
    'bronze-anchor': ''
  };//will use cutomised graphics 

  const FONT_CLASS = {
    cursive: 'font-cursive',
    typewriter: 'font-typewriter',
    modern: 'font-modern'
  };

  const STATIONERY_CLASS = {
    vintage: 'stationery-vintage',
    scroll: 'stationery-scroll',
    minimal: 'stationery-minimal'
  };

  // mock penpals
  const MOCK_PEERS = [
    { handle: 'Aiko_Tokyo', location: 'Japan' },
    { handle: 'Carlos_Madrid', location: 'Spain' },
    { handle: 'Freya_Oslo', location: 'Norway' },
    { handle: 'Kwame_Accra', location: 'Ghana' }
  ];

  const BOTTLE_REPLY_DELAY = 60 * 1000; 

  const AUTO_REPLY_LINES = [
    "Your words arrived like a window opening in a room I forgot had one. Writing back before the ink of my thoughts dries.",
    "I read your letter twice — once quickly, once slowly. The second time was better. Here is my reply, sent the same way it came to me.",
    "Funny how a letter can travel so far and still land exactly where it should. I've been thinking about what you wrote all day.",
    "Where I am, it is raining and quiet, which is the best weather for writing back to a stranger who no longer feels like one."
  ];

//store sessions in local storage in browser
  const storage = {
    getLetters() {
      try {
        const raw = localStorage.getItem(LETTERS_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.error('Digital Dove: failed to parse letters, resetting.', e);
        return [];
      }
    },

    saveLetters(letters) {
      localStorage.setItem(LETTERS_KEY, JSON.stringify(letters));
    },

    addLetter(letter) {
      const letters = storage.getLetters();
      letters.push(letter);
      storage.saveLetters(letters);
      return letter;
    },

    updateLetter(id, patch) {
      const letters = storage.getLetters();
      const idx = letters.findIndex((l) => l.id === id);
      if (idx === -1) return null;
      letters[idx] = Object.assign({}, letters[idx], patch);
      storage.saveLetters(letters);
      return letters[idx];
    },

    getProfile() {
      try {
        const raw = localStorage.getItem(PROFILE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    saveProfile(profile) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    }
  };

  /* =========================================================
   * 3. BUSINESS LOGIC
   * ========================================================= */

  const logic = {
    generateId() {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    },

    /** Returns arrival timestamp given a distance category and a start time. */
    calculateArrival(distanceCategory, fromTimestamp) {
      const duration = DISTANCE_MATRIX[distanceCategory] || DISTANCE_MATRIX.local;
      return fromTimestamp + duration;
    },

    findMockPeer(handle) {
      if (!handle) return null;
      const normalized = handle.trim().toLowerCase();
      return MOCK_PEERS.find((p) => p.handle.toLowerCase() === normalized) || null;
    },

    randomMockPeer() {
      return MOCK_PEERS[Math.floor(Math.random() * MOCK_PEERS.length)];
    },

    randomAutoReplyLine() {
      return AUTO_REPLY_LINES[Math.floor(Math.random() * AUTO_REPLY_LINES.length)];
    },

    createLetterObject({ sender, recipient, content, stationeryStyle, fontStyle, waxSealType, distanceCategory }) {
      const now = Date.now();
      return {
        id: logic.generateId(),
        sender,
        recipient,
        content,
        stationeryStyle,
        fontStyle,
        waxSealType,
        distanceCategory,
        sentTimestamp: now,
        arrivalTimestamp: logic.calculateArrival(distanceCategory, now),
        status: 'in-transit',
        autoReplyTriggered: false
      };
    },

    validateLetterForm({ recipient, content }) {
      const errors = {};
      if (!recipient || !recipient.trim()) errors.recipient = 'A recipient handle is required.';
      if (!content || !content.trim()) errors.content = 'You cannot send an empty letter.';
      return { valid: Object.keys(errors).length === 0, errors };
    },

    generatePeerAutoReply(originalLetter) {
      const now = Date.now();
      return {
        id: logic.generateId(),
        sender: originalLetter.recipient,
        recipient: originalLetter.sender,
        content: logic.randomAutoReplyLine(),
        stationeryStyle: originalLetter.stationeryStyle,
        fontStyle: originalLetter.fontStyle,
        waxSealType: originalLetter.waxSealType,
        distanceCategory: originalLetter.distanceCategory,
        sentTimestamp: now,
        arrivalTimestamp: logic.calculateArrival(originalLetter.distanceCategory, now),
        status: 'in-transit',
        autoReplyTriggered: false
      };
    },

    generateBottleReply(currentUserHandle) {
      const peer = logic.randomMockPeer();
      const now = Date.now();
      return {
        id: logic.generateId(),
        sender: peer.handle,
        recipient: currentUserHandle,
        content: `A bottle washed up with your letter still dry inside. I'm ${peer.handle}, writing from ${peer.location} — hello, stranger. ` + logic.randomAutoReplyLine(),
        stationeryStyle: 'scroll',
        fontStyle: 'typewriter',
        waxSealType: 'bronze-anchor',
        distanceCategory: 'global',
        sentTimestamp: now,
        arrivalTimestamp: now + BOTTLE_REPLY_DELAY,
        status: 'in-transit',
        autoReplyTriggered: false
      };
    },

    formatCountdown(msRemaining) {
      const clamped = Math.max(0, msRemaining);
      const totalSeconds = Math.ceil(clamped / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    },

    formatClock(ts) {
      return new Date(ts).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    }
  };


  const els = {}; 

  function cacheEls() {
    els.identityModal = document.getElementById('identity-modal');
    els.identityForm = document.getElementById('identity-form');
    els.identityInput = document.getElementById('identity-handle');
    els.identityError = document.getElementById('identity-error');

    els.appShell = document.getElementById('app-shell');
    els.userHandleDisplay = document.getElementById('user-handle-display');
    els.userInitial = document.getElementById('user-initial');
    els.penpalDirectory = document.getElementById('penpal-directory');

    els.viewportNav = document.getElementById('viewport-nav');
    els.viewports = document.querySelectorAll('.viewport');

    els.letterForm = document.getElementById('letter-form');
    els.recipientInput = document.getElementById('recipient-input');
    els.distanceSelect = document.getElementById('distance-select');
    els.contentTextarea = document.getElementById('content-textarea');
    els.contentError = document.getElementById('content-error');
    els.paperContainer = document.getElementById('paper-container');
    els.stationeryPicker = document.getElementById('stationery-picker');
    els.fontPicker = document.getElementById('font-picker');
    els.sealPicker = document.getElementById('seal-picker');
    els.sealSendBtn = document.getElementById('seal-send-btn');
    els.sendConfirmation = document.getElementById('send-confirmation');
    els.bottlePanel = document.getElementById('bottle-panel');
    els.bottleBtn = document.getElementById('bottle-btn');

    els.mailroomGrid = document.getElementById('mailroom-grid');
    els.mailroomEmpty = document.getElementById('mailroom-empty');
    els.mailroomCount = document.getElementById('mailroom-count');

    els.archiveGrid = document.getElementById('archive-grid');
    els.archiveEmpty = document.getElementById('archive-empty');
    els.archiveCount = document.getElementById('archive-count');

    els.letterModal = document.getElementById('letter-modal');
    els.letterModalPaper = document.getElementById('letter-modal-paper');
    els.letterModalFrom = document.getElementById('letter-modal-from');
    els.letterModalMeta = document.getElementById('letter-modal-meta');
    els.letterModalContent = document.getElementById('letter-modal-content');
    els.letterModalClose = document.getElementById('letter-modal-close');
  }

  
  const draft = {
    stationeryStyle: 'vintage',
    fontStyle: 'cursive',
    waxSealType: 'gold-dove'
  };

  const ui = {

    showIdentityGate(show) {
      els.identityModal.classList.toggle('hidden', !show);
      els.appShell.classList.toggle('hidden', show);
      els.appShell.classList.toggle('lg:flex', !show);
    },

    renderUserIdentity(profile) {
      els.userHandleDisplay.textContent = profile.handle;
      els.userInitial.textContent = profile.handle.charAt(0).toUpperCase();
    },

    renderPenpalDirectory() {
      els.penpalDirectory.innerHTML = MOCK_PEERS.map((peer) => `
        <button type="button" class="penpal-chip w-full text-left" data-fill-recipient="${peer.handle}">
          <span class="penpal-dot"></span>
          <span class="flex-1 min-w-0">
            <span class="block text-sm text-ink truncate">${peer.handle}</span>
            <span class="block text-[11px] text-muted">${peer.location}</span>
          </span>
        </button>
      `).join('');
    },

    switchViewport(name) {
      els.viewports.forEach((v) => {
        v.classList.toggle('hidden', v.id !== `viewport-${name}`);
      });
      els.viewportNav.querySelectorAll('.nav-btn').forEach((btn) => {
        btn.classList.toggle('nav-btn-active', btn.dataset.viewport === name);
      });
      if (name === 'mailroom') ui.renderMailroom();
      if (name === 'archive') ui.renderArchive();
    },

    setDraftStationery(style) {
      draft.stationeryStyle = style;
      els.stationeryPicker.querySelectorAll('.picker-swatch').forEach((btn) => {
        btn.classList.toggle('picker-active', btn.dataset.stationery === style);
      });
      els.paperContainer.className = `${STATIONERY_CLASS[style]} rounded-lg border border-line p-1 transition-colors`;
    },

    setDraftFont(font) {
      draft.fontStyle = font;
      els.fontPicker.querySelectorAll('.font-option').forEach((btn) => {
        btn.classList.toggle('font-active', btn.dataset.font === font);
      });
      els.contentTextarea.className = `${FONT_CLASS[font]} w-full bg-transparent resize-none px-5 py-4 focus:outline-none placeholder:opacity-50 text-lg leading-relaxed`;
    },

    setDraftSeal(seal) {
      draft.waxSealType = seal;
      els.sealPicker.querySelectorAll('.seal-option').forEach((btn) => {
        btn.classList.toggle('seal-active', btn.dataset.seal === seal);
      });
    },

    resetWritingConsole() {
      els.letterForm.reset();
      ui.setDraftStationery('vintage');
      ui.setDraftFont('cursive');
      ui.setDraftSeal('gold-dove');
      els.contentError.classList.add('hidden');
      els.bottlePanel.classList.add('hidden');
    },

    flashSendConfirmation() {
      els.sendConfirmation.classList.remove('opacity-0');
      setTimeout(() => els.sendConfirmation.classList.add('opacity-0'), 2400);
    },

    playStampAnimation() {
      els.sealSendBtn.classList.add('stamping', 'stamp-flash');
      setTimeout(() => els.sealSendBtn.classList.remove('stamping', 'stamp-flash'), 650);
    },

    updateNavCounts() {
      const letters = storage.getLetters();
      const inTransit = letters.filter((l) => l.status === 'in-transit').length;
      const delivered = letters.filter((l) => l.status === 'delivered' || l.status === 'read').length;
      els.mailroomCount.textContent = inTransit;
      els.archiveCount.textContent = delivered;
    },

    renderMailroom() {
      const letters = storage.getLetters().filter((l) => l.status === 'in-transit');
      ui.updateNavCounts();
      els.mailroomEmpty.classList.toggle('hidden', letters.length > 0);
      els.mailroomGrid.innerHTML = letters.map((letter) => {
        const remaining = letter.arrivalTimestamp - Date.now();
        return `
          <div class="letter-card" data-letter-id="${letter.id}">
            <div class="flex items-start justify-between mb-3">
              <div>
                <p class="text-[11px] uppercase tracking-wider text-muted">To</p>
                <p class="text-ink font-medium">${escapeHtml(letter.recipient)}</p>
              </div>
              <span class="distance-badge distance-${letter.distanceCategory}">${DISTANCE_LABELS[letter.distanceCategory]}</span>
            </div>
            <div class="flex items-center justify-between border-t border-line pt-3">
              <span class="text-xs text-muted">Arrives in</span>
              <span class="countdown-time text-lg text-indigo-accent" data-countdown-for="${letter.id}">
                ${logic.formatCountdown(remaining)}
              </span>
            </div>
          </div>
        `;
      }).join('');
    },

    tickCountdowns() {
      const letters = storage.getLetters();
      document.querySelectorAll('[data-countdown-for]').forEach((span) => {
        const letter = letters.find((l) => l.id === span.dataset.countdownFor);
        if (!letter) return;
        span.textContent = logic.formatCountdown(letter.arrivalTimestamp - Date.now());
      });
    },

    renderArchive() {
      const letters = storage.getLetters()
        .filter((l) => l.status === 'delivered' || l.status === 'read')
        .sort((a, b) => b.arrivalTimestamp - a.arrivalTimestamp);
      ui.updateNavCounts();
      els.archiveEmpty.classList.toggle('hidden', letters.length > 0);
      els.archiveGrid.innerHTML = letters.map((letter) => {
        const isRead = letter.status === 'read';
        return `
          <div class="letter-card archive-card ${isRead ? 'is-read' : ''}" data-letter-id="${letter.id}">
            <div class="flex items-center gap-3 mb-3">
              <div class="relative">
                <div class="seal-medallion seal-${letter.waxSealType}">${SEAL_ICONS[letter.waxSealType]}</div>
              </div>
              <div class="min-w-0">
                <p class="text-[11px] uppercase tracking-wider text-muted">From</p>
                <p class="text-ink font-medium truncate">${escapeHtml(letter.sender)}</p>
              </div>
            </div>
            <div class="flex items-center justify-between text-xs text-muted border-t border-line pt-3">
              <span>${isRead ? 'Read' : 'Tap to break the seal'}</span>
              <span>${logic.formatClock(letter.arrivalTimestamp)}</span>
            </div>
          </div>
        `;
      }).join('');
    },

    openLetterModal(letter) {
      els.letterModalPaper.className = `${STATIONERY_CLASS[letter.stationeryStyle]} rounded-lg shadow-2xl p-8 max-h-[80vh] overflow-y-auto`;
      els.letterModalFrom.textContent = `From ${letter.sender}`;
      els.letterModalMeta.textContent = logic.formatClock(letter.arrivalTimestamp);
      els.letterModalContent.className = `${FONT_CLASS[letter.fontStyle]} text-lg leading-relaxed whitespace-pre-wrap`;
      els.letterModalContent.textContent = letter.content;
      els.letterModal.classList.remove('hidden');
      els.letterModal.classList.add('open');
    },

    closeLetterModal() {
      els.letterModal.classList.add('hidden');
      els.letterModal.classList.remove('open');
    },

    showBottlePanel(show) {
      els.bottlePanel.classList.toggle('hidden', !show);
    }
  };

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }


  function setupEventListeners() {

    els.identityForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const handle = els.identityInput.value.trim();
      if (!handle) {
        els.identityError.classList.remove('hidden');
        return;
      }
      const profile = { handle, joinedAt: Date.now() };
      storage.saveProfile(profile);
      bootstrapSession(profile);
    });

    els.viewportNav.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => ui.switchViewport(btn.dataset.viewport));
    });

    els.penpalDirectory.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-fill-recipient]');
      if (!chip) return;
      els.recipientInput.value = chip.dataset.fillRecipient;
      ui.switchViewport('writing');
      ui.showBottlePanel(false);
      els.recipientInput.focus();
    });

    els.stationeryPicker.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-stationery]');
      if (btn) ui.setDraftStationery(btn.dataset.stationery);
    });
    els.fontPicker.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-font]');
      if (btn) ui.setDraftFont(btn.dataset.font);
    });
    els.sealPicker.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-seal]');
      if (btn) ui.setDraftSeal(btn.dataset.seal);
    });

    els.letterForm.addEventListener('submit', handleLetterSubmit);

    els.bottleBtn.addEventListener('click', () => {
      const profile = storage.getProfile();
      const reply = logic.generateBottleReply(profile.handle);
      storage.addLetter(reply);
      ui.showBottlePanel(false);
      ui.updateNavCounts();
      ui.switchViewport('mailroom');
    });


    els.archiveGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.archive-card');
      if (!card) return;
      const letterId = card.dataset.letterId;
      const letters = storage.getLetters();
      const letter = letters.find((l) => l.id === letterId);
      if (!letter) return;

      if (letter.status === 'delivered') {
        const medallion = card.querySelector('.seal-medallion');
        if (medallion) medallion.classList.add('cracking');
        setTimeout(() => {
          storage.updateLetter(letterId, { status: 'read' });
          ui.openLetterModal(storage.getLetters().find((l) => l.id === letterId));
          ui.renderArchive();
        }, 320);
      } else {
        ui.openLetterModal(letter);
      }
    });

    els.letterModalClose.addEventListener('click', ui.closeLetterModal);
    els.letterModal.addEventListener('click', (e) => {
      if (e.target === els.letterModal) ui.closeLetterModal();
    });

    els.recipientInput.addEventListener('input', () => {
      els.contentError.classList.add('hidden');
    });
  }

  function handleLetterSubmit(e) {
    e.preventDefault();
    const profile = storage.getProfile();
    const recipient = els.recipientInput.value.trim();
    const content = els.contentTextarea.value.trim();
    const distanceCategory = els.distanceSelect.value;

    const { valid, errors } = logic.validateLetterForm({ recipient, content });
    els.contentError.classList.toggle('hidden', !errors.content);
    if (!valid) return;

    const letter = logic.createLetterObject({
      sender: profile.handle,
      recipient,
      content,
      stationeryStyle: draft.stationeryStyle,
      fontStyle: draft.fontStyle,
      waxSealType: draft.waxSealType,
      distanceCategory
    });

    storage.addLetter(letter);
    ui.playStampAnimation();
    ui.flashSendConfirmation();
    ui.updateNavCounts();

    
    const knownPeer = logic.findMockPeer(recipient);
    ui.showBottlePanel(!knownPeer);

    ui.resetWritingConsole();
    els.recipientInput.value = '';
  }


  function bootstrapSession(profile) {
    ui.showIdentityGate(false);
    ui.renderUserIdentity(profile);
    ui.renderPenpalDirectory();
    ui.setDraftStationery('vintage');
    ui.setDraftFont('cursive');
    ui.setDraftSeal('gold-dove');
    ui.updateNavCounts();
    ui.switchViewport('writing');

    if (window.DD && DD.deliveryEngine && typeof DD.deliveryEngine.start === 'function') {
      DD.deliveryEngine.start();
    }
  }

  function init() {
    cacheEls();
    setupEventListeners();

    const profile = storage.getProfile();
    if (!profile) {
      ui.showIdentityGate(true);
      return;
    }
    bootstrapSession(profile);
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    CONSTANTS: { LETTERS_KEY, PROFILE_KEY, DISTANCE_MATRIX, MOCK_PEERS },
    storage,
    logic,
    ui,
    init
  };
})();