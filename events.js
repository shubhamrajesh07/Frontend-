/**
 * events.js — Event Binding Layer
 *
 * Kaam: Saare inline onclick/oninput/onchange handlers ko
 * hata ke proper addEventListener se replace karta hai.
 * app.js ke load hone ke BAAD run karna zaroori hai.
 */

(function bindEvents() {
  'use strict';

  /* ── safe getElementById wrapper ── */
  function el(id) { return document.getElementById(id); }

  /* ── helper: attach multiple event types ── */
  function on(target, events, handler, opts) {
    if (!target) return;
    events.split(' ').forEach(ev => target.addEventListener(ev, handler, opts || false));
  }

  /* ── helper: delegate clicks inside a container ── */
  function delegate(container, selector, handler) {
    if (!container) return;
    container.addEventListener('click', function(e) {
      const t = e.target.closest(selector);
      if (t && container.contains(t)) handler(e, t);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {

    /* ════════════════════════════════════════
       SIDEBAR
    ════════════════════════════════════════ */
    on(el('bkdrop'),       'click',       () => closeSB());
    on(el('sb-close-btn'), 'click',       () => closeSB());
    on(el('hamburger-btn'),'click',       () => openSB());
    on(el('new-list-btn'), 'click',       () => openNewListModal());
    on(el('settings-btn'), 'click',       () => { addRipple_foot(el('settings-btn')); openSettingsModal(); });
    on(el('export-btn'),   'click',       () => { addRipple_foot(el('export-btn'));   openExportModal(); });
    on(el('dark-btn'),     'click',       (e) => { addRipple_foot(el('dark-btn'));    toggleDark(); });

    /* Profile open — sidebar avatar + footer row */
    on(el('sb-head-ava'),  'click',       () => openProfileModal());
    on(el('sb-head-ava'),  'keydown',     (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProfileModal(); } });
    on(el('profile-row'),  'click',       () => openProfileModal());
    on(el('profile-row'),  'keydown',     (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProfileModal(); } });

    /* Nav list items — delegate on the nav */
    delegate(document.querySelector('.sb-nav'), '[data-list]', (e, t) => {
      setList(t.dataset.list);
    });

    /* ════════════════════════════════════════
       MOBILE TOP BAR
    ════════════════════════════════════════ */
    on(el('mob-dark'),     'click',       () => toggleDark());
    on(el('mob-add-btn'),  'click',       () => openModal());

    /* ════════════════════════════════════════
       TABS
    ════════════════════════════════════════ */
    document.querySelectorAll('.tab[data-view]').forEach(tab => {
      on(tab, 'click', () => showView(tab.dataset.view, tab));
      on(tab, 'keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showView(tab.dataset.view, tab); } });
    });

    /* ════════════════════════════════════════
       TOOLBAR
    ════════════════════════════════════════ */
    on(el('search-input'),    'input',    (e) => searchTasks(e.target.value));
    on(el('toolbar-add-btn'), 'click',    () => openModal());

    /* Sort dropdown */
    on(el('sort-toggle-btn'), 'click',    (e) => toggleSortMenu(e));
    delegate(el('sort-menu'), '[data-sort]', (e, t) => {
      setSort(t.dataset.sort);
    });

    /* ════════════════════════════════════════
       QUICK ADD BAR
    ════════════════════════════════════════ */
    const qaInp = el('quick-add');
    on(qaInp, 'input',   (e) => onQAInput(e.target.value));
    on(qaInp, 'keydown', (e) => onQAKeydown(e));

    /* Filter chips */
    delegate(document.querySelector('.fchips'), '[data-filter]', (e, t) => {
      setFilter(t.dataset.filter, t);
    });
    document.querySelectorAll('.fchip[data-filter]').forEach(chip => {
      on(chip, 'keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFilter(chip.dataset.filter, chip); } });
    });

    /* ════════════════════════════════════════
       TASK MODAL
    ════════════════════════════════════════ */
    on(el('modal-cancel-btn'), 'click',   () => closeModal());
    on(el('modal-create-btn'), 'click',   () => addFromModal());
    on(el('task-modal'),       'click',   (e) => { if (e.target === el('task-modal')) closeModal(); });
    /* Enter in task name field submits */
    on(el('m-name'), 'keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addFromModal(); } });

    /* ════════════════════════════════════════
       LIST MODAL
    ════════════════════════════════════════ */
    on(el('list-modal-cancel'), 'click',  () => closeListModal());
    on(el('lm-save'),           'click',  () => saveList());
    on(el('list-modal'),        'click',  (e) => { if (e.target === el('list-modal')) closeListModal(); });
    on(el('lm-name'), 'keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saveList(); } });

    /* ════════════════════════════════════════
       REMINDER SHEET
    ════════════════════════════════════════ */
    on(el('rem-sheet-close-btn'), 'click', () => closeRemSheet());
    on(el('rem-sheet-add-btn'),   'click', () => openRemModal());
    on(el('rem-sheet-modal'),     'click', (e) => { if (e.target === el('rem-sheet-modal')) closeRemSheet(); });

    /* ════════════════════════════════════════
       REMINDER ADD MODAL
    ════════════════════════════════════════ */
    on(el('rem-modal-cancel'), 'click',   () => closeRemModal());
    on(el('rem-modal-save'),   'click',   () => saveReminder());
    on(el('rem-modal'),        'click',   (e) => { if (e.target === el('rem-modal')) closeRemModal(); });
    on(el('rem-add-btn'),      'click',   () => openRemModal());

    /* ════════════════════════════════════════
       PROFILE MODAL
    ════════════════════════════════════════ */
    on(el('profile-cancel-btn'), 'click', () => closeProfileModal());
    on(el('profile-save-btn'),   'click', () => saveProfile());
    on(el('profile-modal'),      'click', (e) => { if (e.target === el('profile-modal')) closeProfileModal(); });
    on(el('ava-upload-btn'),     'click', () => triggerAvaUpload());
    on(el('ava-clear-btn'),      'click', () => clearAvaPhoto());
    on(el('profile-ava-big'),    'click', () => triggerAvaUpload());
    on(el('profile-ava-big'),    'keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerAvaUpload(); } });
    on(el('ava-file-input'),     'change', (e) => handleAvaUpload(e));

    /* ════════════════════════════════════════
       EXPORT MODAL
    ════════════════════════════════════════ */
    on(el('export-modal-close'), 'click', () => closeExportModal());
    on(el('export-cancel-btn'),  'click', () => closeExportModal());
    on(el('export-modal'),       'click', (e) => { if (e.target === el('export-modal')) closeExportModal(); });
    on(el('exp-sel-all-btn'),    'click', () => expSelectAll());
    on(el('exp-sel-none-btn'),   'click', () => expSelectNone());
    on(el('exp-preview-btn'),    'click', () => generateExpPreview());
    on(el('exp-csv-btn'),        'click', () => exportCSV());
    on(el('exp-pdf-btn'),        'click', () => exportPDF());

    /* Export type buttons */
    delegate(el('export-modal'), '[data-exptype]', (e, t) => {
      setExpType(t.dataset.exptype);
    });
    /* Export graph buttons */
    delegate(el('export-modal'), '[data-expgraph]', (e, t) => {
      setExpGraph(t.dataset.expgraph);
    });

    /* ════════════════════════════════════════
       SETTINGS MODAL
    ════════════════════════════════════════ */
    on(el('settings-close-btn'),    'click', () => closeSettingsModal());
    on(el('settings-modal'),        'click', (e) => { if (e.target === el('settings-modal')) closeSettingsModal(); });
    on(el('set-lock'),              'change', () => handleLockToggle());
    on(el('lock-change-btn'),       'click', () => openLockSetup('change'));
    on(el('lock-remove-btn'),       'click', () => removeLock());
    on(el('backup-export-btn'),     'click', () => exportBackup());
    on(el('backup-import-btn'),     'click', () => el('backup-file-input').click());
    on(el('backup-file-input'),     'change', (e) => importBackup(e));
    on(el('settings-rem-add-btn'), 'click', () => openRemModal());

    /* ════════════════════════════════════════
       LOCK SCREEN — PIN & PATTERN
    ════════════════════════════════════════ */
    /* Lock method tabs */
    on(el('ls-tab-pin'),     'click', () => showLockMethod('pin'));
    on(el('ls-tab-pattern'), 'click', () => showLockMethod('pattern'));

    /* PIN keypad — delegate */
    delegate(document.querySelector('#ls-pin-ui .pin-keypad'), '[data-pinkey]', (e, t) => {
      pinPress(t.dataset.pinkey);
    });
    on(el('pin-backspace-btn'), 'click', () => pinBackspace());

    /* Pattern grid — touch & mouse */
    const pg = el('pattern-grid');
    if (pg) {
      on(pg, 'touchstart',  (e) => patternTouchStart(e),  { passive: false });
      on(pg, 'touchmove',   (e) => patternTouchMove(e),   { passive: false });
      on(pg, 'touchend',    ()  => patternTouchEnd());
      on(pg, 'mousedown',   (e) => patternMouseDown(e));
      on(pg, 'mousemove',   (e) => patternMouseMove(e));
      on(pg, 'mouseup',     ()  => patternMouseUp());
    }

    /* ════════════════════════════════════════
       LOCK SETUP MODAL
    ════════════════════════════════════════ */
    on(el('lsm-tab-pin'),       'click', () => setSetupMethod('pin'));
    on(el('lsm-tab-pattern'),   'click', () => setSetupMethod('pattern'));
    on(el('lock-setup-cancel-btn'), 'click', () => closeLockSetupModal());
    on(el('lock-setup-modal'),  'click', (e) => { if (e.target === el('lock-setup-modal')) closeLockSetupModal(); });

    /* Setup PIN keypad */
    delegate(el('lsm-pin-ui'), '[data-setuppinkey]', (e, t) => {
      setupPinPress(t.dataset.setuppinkey);
    });
    on(el('setup-pin-backspace'), 'click', () => setupPinBackspace());

    /* Setup pattern grid */
    const spg = el('setup-pattern-grid');
    if (spg) {
      on(spg, 'touchstart',  (e) => setupPatternTouchStart(e),  { passive: false });
      on(spg, 'touchmove',   (e) => setupPatternTouchMove(e),   { passive: false });
      on(spg, 'touchend',    ()  => setupPatternTouchEnd());
      on(spg, 'mousedown',   (e) => setupPatternMouseDown(e));
      on(spg, 'mousemove',   (e) => setupPatternMouseMove(e));
      on(spg, 'mouseup',     ()  => setupPatternMouseUp());
    }

    /* ════════════════════════════════════════
       RESTORE MODAL
    ════════════════════════════════════════ */
    on(el('restore-skip-btn'),    'click', () => dismissRestore());
    on(el('restore-confirm-btn'), 'click', () => confirmRestore());

    /* ════════════════════════════════════════
       CONTEXT MENU
    ════════════════════════════════════════ */
    on(el('ctx-rename'), 'click',   () => ctxRename());
    on(el('ctx-edit'),   'click',   () => ctxEdit());
    on(el('ctx-delete'), 'click',   () => ctxDelete());

    /* Keyboard accessibility on ctx menu items */
    ['ctx-rename','ctx-edit','ctx-delete'].forEach(id => {
      on(el(id), 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el(id).click(); }
      });
    });

    /* ════════════════════════════════════════
       CALENDAR NAVIGATION
    ════════════════════════════════════════ */
    on(el('cal-prev'),    'click', () => changeMonth(-1));
    on(el('cal-next'),    'click', () => changeMonth(1));
    on(el('cal-add-btn'), 'click', () => openModal());

    /* ════════════════════════════════════════
       HISTORY VIEW TOGGLE
    ════════════════════════════════════════ */
    on(el('hv-week-btn'),  'click', () => setHistView('weekly'));
    on(el('hv-month-btn'), 'click', () => setHistView('monthly'));

    /* ════════════════════════════════════════
       TASK LIST — event delegation
       (tasks are dynamic so we delegate on #task-list)
    ════════════════════════════════════════ */
    const taskList = el('task-list');
    if (taskList) {
      taskList.addEventListener('click', function(e) {
        const ti = e.target.closest('.ti');
        if (!ti) return;
        const idMatch = ti.id && ti.id.match(/ti-(\d+)/);
        const id = idMatch ? parseInt(idMatch[1]) : null;

        /* Checkbox / task row toggle */
        if (e.target.closest('.tck') && id) { toggle(id); return; }

        /* Star */
        if (e.target.closest('.tstar') && id) { toggleStar(id); return; }

        /* Pin */
        if (e.target.closest('.tpin') && id) { togglePin(id); return; }

        /* Delete button */
        if (e.target.closest('.actb[data-act="delete"]') && id) { delTask(id); return; }

        /* Edit button / open detail */
        if (e.target.closest('.actb[data-act="edit"]') && id) {
          if (typeof openTaskDetail === 'function') openTaskDetail(id);
          return;
        }

        /* Right-click context menu trigger on row */
        if (e.target.closest('.actb[data-act="more"]') && id) {
          if (typeof showTaskCtxMenu === 'function') showTaskCtxMenu(e, id);
          return;
        }

        /* Inline reminder */
        if (e.target.closest('.actb[data-act="reminder"]') && id) {
          if (typeof openInlineReminder === 'function') openInlineReminder(id);
          return;
        }

        /* Save inline reminder */
        if (e.target.closest('[data-act="save-reminder"]') && id) {
          if (typeof saveInlineReminder === 'function') saveInlineReminder(id);
          return;
        }

        /* Priority from context menu dot */
        const priEl = e.target.closest('[data-act="set-priority"]');
        if (priEl && id) {
          if (typeof setPriorityCtx === 'function') setPriorityCtx(id, priEl.dataset.pri);
          return;
        }

        /* Generic task row click — open detail if not a control */
        if (!e.target.closest('button, input, select, a, .tck, .tstar, .tpin, .actb, .tacts')) {
          if (id && typeof openTaskDetail === 'function') openTaskDetail(id);
        }
      });

      /* Right-click for context menu on task rows */
      taskList.addEventListener('contextmenu', function(e) {
        const ti = e.target.closest('.ti');
        if (!ti) return;
        e.preventDefault();
        const idMatch = ti.id && ti.id.match(/ti-(\d+)/);
        const id = idMatch ? parseInt(idMatch[1]) : null;
        if (id && typeof showTaskCtxMenu === 'function') showTaskCtxMenu(e, id);
      });
    }

    /* ════════════════════════════════════════
       CUSTOM LISTS sidebar — delegation
    ════════════════════════════════════════ */
    const customListsEl = el('custom-lists');
    if (customListsEl) {
      customListsEl.addEventListener('click', function(e) {
        /* Rename inline save */
        const renameInput = e.target.closest('.lri');
        if (renameInput) return; // let it be handled inline

        /* List action buttons */
        const lab = e.target.closest('.lab');
        if (lab) {
          const listItem = lab.closest('.lni');
          const listId = listItem && listItem.dataset.listid;
          if (lab.dataset.act === 'rename' && listId) { startRename(listId); return; }
          if (lab.dataset.act === 'ctx'    && listId) { openCtxMenu(lab, listId); return; }
          return;
        }

        /* Click on list nav item */
        const ni = e.target.closest('.ni[data-list]');
        if (ni) { setList(ni.dataset.list); return; }
      });
    }

    /* ════════════════════════════════════════
       KEYBOARD SHORTCUTS (global)
    ════════════════════════════════════════ */
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeModal(); closeListModal(); closeRemModal(); closeSettingsModal();
        closeProfileModal(); closeExportModal(); closeRemSheet();
        const cm = el('ctx-menu'); if (cm) cm.classList.remove('show');
        const sm = el('sort-menu'); if (sm) sm.classList.remove('open');
        const tcm = el('task-ctx-menu'); if (tcm) tcm.remove();
        const rp = el('rem-popover'); if (rp) rp.remove();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); openModal(); }
      if ((e.ctrlKey || e.metaKey) && e.key === ',') { e.preventDefault(); openSettingsModal(); }
      /* Keyboard task checkbox */
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement.classList.contains('tck')) {
        e.preventDefault();
        const ti = document.activeElement.closest('.ti');
        if (ti) {
          const idMatch = ti.id && ti.id.match(/ti-(\d+)/);
          if (idMatch) toggle(parseInt(idMatch[1]));
        }
      }
    });

    /* ════════════════════════════════════════
       CLOSE MENUS ON OUTSIDE CLICK
    ════════════════════════════════════════ */
    document.addEventListener('click', function(e) {
      /* Autocomplete */
      const acWrap = el('ac-wrap');
      if (acWrap && !acWrap.contains(e.target)) {
        const dd = el('ac-dropdown');
        if (dd) { dd.classList.remove('open'); }
      }
      /* Sort menu */
      const sw = el('sort-wrap');
      const sm = el('sort-menu');
      if (sm && sw && !sw.contains(e.target)) sm.classList.remove('open');
      /* Context menu */
      const ctx = el('ctx-menu');
      if (ctx && !ctx.contains(e.target) && !e.target.closest('.lab[data-act="ctx"]')) {
        ctx.classList.remove('show');
      }
    });

    /* ════════════════════════════════════════
       RIPPLE for sidebar footer buttons
    ════════════════════════════════════════ */
    function addRipple_foot(btn) {
      if (!btn) return;
      const existing = btn.querySelector('.ripple');
      if (existing) existing.remove();
      const r = document.createElement('span');
      r.className = 'ripple';
      const rect = btn.getBoundingClientRect();
      r.style.left = (rect.width / 2 - 4) + 'px';
      r.style.top  = (rect.height / 2 - 4) + 'px';
      btn.appendChild(r);
      r.addEventListener('animationend', () => r.remove());
    }

    /* Expose so settings/export/dark can also use it */
    window._addRippleFoot = addRipple_foot;

    /* ════════════════════════════════════════
       SETTINGS DYNAMIC SECTIONS
       (built once settings modal opens)
    ════════════════════════════════════════ */
    function buildSettingsSections() {
      /* Notification permission card */
      const pcard = el('set-perm-card');
      if (pcard) {
        if (!('Notification' in window)) {
          pcard.className = 'set-perm-card denied';
          pcard.textContent = '⚠️ Notifications not supported in this browser.';
        } else if (Notification.permission === 'granted') {
          pcard.className = 'set-perm-card granted';
          pcard.textContent = '✅ Notifications are enabled.';
        } else if (Notification.permission === 'denied') {
          pcard.className = 'set-perm-card denied';
          pcard.textContent = '🚫 Notifications blocked. Allow in browser/OS settings.';
        } else {
          pcard.className = 'set-perm-card default';
          const btn = document.createElement('button');
          btn.className = 'btn btnp';
          btn.style.cssText = 'padding:5px 12px;font-size:12px;margin-top:6px;';
          btn.textContent = '🔔 Enable Notifications';
          btn.addEventListener('click', () => {
            Notification.requestPermission().then(p => {
              buildSettingsSections();
              if (p === 'granted' && typeof toast === 'function') toast('🔔 Notifications enabled!');
            });
          });
          pcard.textContent = '🔔 Tap below to enable notifications for reminders.';
          pcard.appendChild(document.createElement('br'));
          pcard.appendChild(btn);
        }
      }

      /* Appearance card */
      const ac = el('settings-appearance-card');
      if (ac) {
        ac.innerHTML = '';
        const row = document.createElement('div');
        row.className = 'set-row';
        const info = document.createElement('div');
        info.className = 'set-info';
        const lbl = document.createElement('div'); lbl.className = 'set-lbl'; lbl.textContent = 'Dark Mode';
        const sub = document.createElement('div'); sub.className = 'set-sub'; sub.textContent = 'Switch between light and dark theme';
        info.appendChild(lbl); info.appendChild(sub);
        const tog = document.createElement('label'); tog.className = 'toggle';
        const inp = document.createElement('input'); inp.type = 'checkbox'; inp.id = 'settings-dark-toggle';
        inp.checked = document.documentElement.getAttribute('data-theme') === 'dark';
        inp.addEventListener('change', () => toggleDark());
        const slider = document.createElement('span'); slider.className = 'toggle-slider';
        tog.appendChild(inp); tog.appendChild(slider);
        row.appendChild(info); row.appendChild(tog);
        ac.appendChild(row);
      }

      /* ── Account card ──────────────────────────────────────────────── */
      const accCard = el('settings-account-card');
      if (accCard) {
        accCard.innerHTML = '';

        const isLoggedIn = typeof Tok !== 'undefined' && Tok.has();

        // Helper: make a settings row with button
        function makeAccRow(icon, label, sub, btnText, btnColor, onClick) {
          const row = document.createElement('div');
          row.className = 'set-row';
          row.style.marginBottom = '10px';
          const info = document.createElement('div'); info.className = 'set-info';
          const lbl = document.createElement('div'); lbl.className = 'set-lbl'; lbl.textContent = icon + ' ' + label;
          const subEl = document.createElement('div'); subEl.className = 'set-sub'; subEl.textContent = sub;
          info.appendChild(lbl); info.appendChild(subEl);
          const btn = document.createElement('button');
          btn.className = 'btn';
          btn.style.cssText = `font-size:12px;padding:5px 12px;background:${btnColor};color:#fff;border:none;flex-shrink:0;border-radius:6px;cursor:pointer;`;
          btn.textContent = btnText;
          btn.addEventListener('click', onClick);
          row.appendChild(info); row.appendChild(btn);
          accCard.appendChild(row);
        }

        if (isLoggedIn) {
          // Logged-in user info row
          const infoRow = document.createElement('div');
          infoRow.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 2px;margin-bottom:10px;border-bottom:1px solid var(--bdr);';
          const ava = document.createElement('div');
          ava.style.cssText = 'width:36px;height:36px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0;';
          const uname = (window.userProfile && window.userProfile.name) || 'User';
          ava.textContent = uname.charAt(0).toUpperCase();
          const uinfo = document.createElement('div');
          const unEl = document.createElement('div'); unEl.style.cssText = 'font-size:13px;font-weight:700;color:var(--t1);'; unEl.textContent = uname;
          const ueEl = document.createElement('div'); ueEl.style.cssText = 'font-size:11px;color:var(--tm);'; ueEl.textContent = (window.userProfile && window.userProfile.email) || '';
          uinfo.appendChild(unEl); uinfo.appendChild(ueEl);
          infoRow.appendChild(ava); infoRow.appendChild(uinfo);
          accCard.appendChild(infoRow);

          // Change Password
          makeAccRow('🔑', 'Change Password', 'Update your account password', 'Change', 'var(--blue)', () => {
            closeSettingsModal();
            setTimeout(() => showAccountModal('change-password'), 300);
          });

          // Change Email
          makeAccRow('📧', 'Change Email', 'Update your login email address', 'Change', 'var(--blue)', () => {
            closeSettingsModal();
            setTimeout(() => showAccountModal('change-email'), 300);
          });

          // Logout
          makeAccRow('🚪', 'Sign Out', 'Log out from this device', 'Sign Out', '#d13438', () => {
            closeSettingsModal();
            setTimeout(() => {
              if (confirm('Sign out? Your tasks remain safely on the server.')) {
                // Call backend logout to revoke token
                if (typeof API !== 'undefined' && typeof Tok !== 'undefined' && Tok.has()) {
                  API.fetch('/auth/logout', { method: 'POST' }).catch(() => {});
                }
                if (typeof Tok !== 'undefined') Tok.clear();
                window.__ofsOfflineMode = false;
                const lb = document.getElementById('ofs-logout-btn'); if (lb) lb.remove();
                if (typeof window.toast === 'function') window.toast('👋 Signed out successfully.');
                setTimeout(() => { if (typeof Auth !== 'undefined') Auth.show(); }, 600);
              }
            }, 100);
          });

        } else {
          // Not logged in
          const offRow = document.createElement('div');
          offRow.className = 'set-row';
          const info = document.createElement('div'); info.className = 'set-info';
          const lbl = document.createElement('div'); lbl.className = 'set-lbl'; lbl.textContent = '🔐 Not signed in';
          const sub = document.createElement('div'); sub.className = 'set-sub'; sub.textContent = 'Sign in to sync tasks across devices';
          info.appendChild(lbl); info.appendChild(sub);
          const btn = document.createElement('button');
          btn.className = 'btn btnp';
          btn.style.cssText = 'font-size:12px;padding:5px 12px;flex-shrink:0;';
          btn.textContent = 'Sign In';
          btn.addEventListener('click', () => { closeSettingsModal(); setTimeout(() => { if (typeof Auth !== 'undefined') Auth.show(); }, 300); });
          offRow.appendChild(info); offRow.appendChild(btn);
          accCard.appendChild(offRow);
        }
      }

      /* Danger zone card */
      const dc = el('settings-danger-card');
      if (dc) {
        dc.innerHTML = '';
        [
          { label: '🗑 Delete All Completed Tasks', sub: 'Clears all done tasks (analytics preserved)', action: () => { closeSettingsModal(); if (typeof deleteAllCompleted === 'function') deleteAllCompleted(); } },
          { label: '⚠️ Clear All Data', sub: 'Permanently resets all tasks and settings', action: () => {
            if (confirm('This will permanently delete ALL tasks, lists, and settings. Are you absolutely sure?')) {
              if (typeof SK === 'object') Object.values(SK).forEach(k => localStorage.removeItem(k));
              ['mytodo_settings_v3','mytodo_profile_v3','mytodo_lock_v3','mytodo_brute_v3','mytodo_hmac_key_v1','__mytodo_jwt_v2'].forEach(k => localStorage.removeItem(k));
              location.reload();
            }
          }},
        ].forEach(item => {
          const row = document.createElement('div');
          row.className = 'set-row';
          row.style.marginBottom = '10px';
          const info = document.createElement('div'); info.className = 'set-info';
          const lbl = document.createElement('div'); lbl.className = 'set-lbl'; lbl.textContent = item.label;
          const sub = document.createElement('div'); sub.className = 'set-sub'; sub.textContent = item.sub;
          info.appendChild(lbl); info.appendChild(sub);
          const btn = document.createElement('button');
          btn.className = 'btn';
          btn.style.cssText = 'font-size:12px;padding:5px 10px;background:#fde7e0;color:#d13438;border:none;flex-shrink:0;';
          btn.textContent = 'Go';
          btn.addEventListener('click', item.action);
          row.appendChild(info); row.appendChild(btn);
          dc.appendChild(row);
        });
      }

      /* Reminder notifications card */
      const nc = el('settings-notif-card');
      if (nc && typeof appSettings !== 'undefined') {
        nc.innerHTML = '';
        const settings = [
          { key: 'remNotifEnabled',   label: 'Reminder Notifications', sub: 'Notify at your set reminder times' },
          { key: 'smartRemind',       label: 'Smart Reminders',        sub: 'AI-powered nudges based on behavior' },
          { key: 'streakNotif',       label: 'Streak Alerts',          sub: 'Celebrate when you hit 80%+ daily' },
          { key: 'motivNotif',        label: 'Motivational Messages',  sub: 'Daily encouragement' },
        ];
        settings.forEach(s => {
          const row = document.createElement('div');
          row.className = 'set-row';
          row.style.marginBottom = '10px';
          const info = document.createElement('div'); info.className = 'set-info';
          const lbl = document.createElement('div'); lbl.className = 'set-lbl'; lbl.textContent = s.label;
          const sub = document.createElement('div'); sub.className = 'set-sub'; sub.textContent = s.sub;
          info.appendChild(lbl); info.appendChild(sub);
          const tog = document.createElement('label'); tog.className = 'toggle';
          const inp = document.createElement('input'); inp.type = 'checkbox';
          inp.checked = !!appSettings[s.key];
          inp.addEventListener('change', () => {
            appSettings[s.key] = inp.checked;
            if (typeof localStorage !== 'undefined') {
              try { localStorage.setItem('mytodo_settings_v3', JSON.stringify(appSettings)); } catch(e) {}
            }
          });
          const slider = document.createElement('span'); slider.className = 'toggle-slider';
          tog.appendChild(inp); tog.appendChild(slider);
          row.appendChild(info); row.appendChild(tog);
          nc.appendChild(row);
        });
      }
    }

    /* Rebuild settings sections each time the panel opens */
    const origOpenSettings = window.openSettingsModal;
    window.openSettingsModal = function() {
      if (typeof origOpenSettings === 'function') origOpenSettings();
      setTimeout(buildSettingsSections, 50);
    };

    /* Sync dark toggle in settings with app state */
    document.addEventListener('themeChanged', () => {
      const t = el('settings-dark-toggle');
      if (t) t.checked = document.documentElement.getAttribute('data-theme') === 'dark';
    });

    /* ════════════════════════════════════════
       REMINDER LIST delegation (dynamic)
    ════════════════════════════════════════ */
    function bindReminderList(containerId) {
      const container = el(containerId);
      if (!container) return;
      container.addEventListener('click', function(e) {
        const btn = e.target.closest('[data-rem-act]');
        if (!btn) return;
        const id = parseInt(btn.dataset.remId, 10);
        const act = btn.dataset.remAct;
        if (!id) return;
        if (act === 'toggle-active' && typeof toggleRemActive === 'function') {
          toggleRemActive(id);
          if (containerId === 'rem-list-sheet' && typeof renderRemindersSheet === 'function') renderRemindersSheet();
          else if (typeof renderReminders === 'function') renderReminders();
        }
        if (act === 'test'   && typeof testReminder   === 'function') testReminder(id);
        if (act === 'delete' && typeof delReminder    === 'function') {
          delReminder(id);
          if (containerId === 'rem-list-sheet' && typeof renderRemindersSheet === 'function') renderRemindersSheet();
          else if (typeof renderReminders === 'function') renderReminders();
        }
        if (act === 'toggle-pin' && typeof toggleRemPin === 'function') {
          toggleRemPin(id);
          if (typeof renderReminders === 'function') renderReminders();
        }
      });
    }

    bindReminderList('rem-list');
    bindReminderList('rem-list-sheet');
    bindReminderList('settings-rem-list');

    /* Req notification perm button (rendered dynamically in reminder sections) */
    document.body.addEventListener('click', function(e) {
      if (e.target.dataset.action === 'req-perm') {
        if (typeof reqPerm === 'function') reqPerm();
      }
      /* pinAndHighlight banner */
      if (e.target.dataset.action === 'pin-highlight') {
        const id = parseInt(e.target.dataset.taskId, 10);
        if (id && typeof pinAndHighlight === 'function') pinAndHighlight(id);
      }
      /* Inline reminder save buttons generated dynamically */
      if (e.target.dataset.action === 'save-inline-reminder') {
        const id = parseInt(e.target.dataset.taskId, 10);
        if (id && typeof saveInlineReminder === 'function') saveInlineReminder(id);
      }
    });

    /* ════════════════════════════════════════
       GLOBAL ACTION DELEGATION
       Handles data-action on any element
    ════════════════════════════════════════ */
    document.body.addEventListener('click', function(e) {
      const actionEl = e.target.closest('[data-action]');
      if (!actionEl) return;
      const act = actionEl.dataset.action;
      switch(act) {
        case 'close-sb':        closeSB();         break;
        case 'open-profile':    openProfileModal(); break;
        case 'trigger-ava-upload': triggerAvaUpload(); break;
        case 'req-perm':        if (typeof reqPerm === 'function') reqPerm(); break;
      }
    });

    /* ════════════════════════════════════════
       SIDEBAR RIPPLE init
    ════════════════════════════════════════ */
    if (typeof initSidebarRipples === 'function') initSidebarRipples();

    console.log('[MyToDo] Event bindings complete ✅');
  }); // end DOMContentLoaded

})(); // end bindEvents IIFE
</script>
<!-- ═══════════════════════════════════════════════════════════
     DYNAMIC RENDERER PATCHES
     Replaces inline onclick handlers in JS-generated HTML
     with data-* attributes for CSP compliance.
     Runs AFTER main scripts, overrides specific functions.
