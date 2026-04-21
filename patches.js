/**
 * patches.js — Dynamic Renderer Patches
 *
 * Kaam: JS se generate hone wale HTML mein jo inline onclick
 * handlers hain unhe data-* attributes se replace karta hai.
 * Yeh SABSE LAST mein run karna chahiye.
 */

(function patchDynamicRenderers() {
  'use strict';

  /* ── Wait for app to be fully initialised ── */
  function whenReady(fn) {
    if (document.readyState === 'complete') { setTimeout(fn, 50); return; }
    window.addEventListener('load', () => setTimeout(fn, 50), { once: true });
  }

  whenReady(function() {

    /* ════════════════════════════════════════════════════════
       renderSB patch removed — original already uses safe DOM
    ════════════════════════════════════════════════════════ */

    /* ════════════════════════════════════════════════════════
       PATCH: tHTML — replace all inline onclick with data-*
       The original function returns an HTML string.
       We wrap it to post-process that string, replacing
       onclick handlers with data attributes, then use
       event delegation (already set up in bindEvents).
    ════════════════════════════════════════════════════════ */
    if (typeof window.tHTML === 'function') {
      const _orig = window.tHTML;
      window.tHTML = function(t) {
        let html = _orig.apply(this, arguments);

        // Replace inline event handlers with data attributes
        // These patterns are safe because `t.id` is always a numeric timestamp
        const id = t.id;

        // toggle on task content click
        html = html.replace(
          /onclick="toggle\(\d+\)"/g,
          `data-act="toggle" data-taskid="${id}"`
        );
        // checkbox .tck
        html = html.replace(
          /onclick="toggle\(\d+\)" class="tck"/g,
          `class="tck" data-act="toggle" data-taskid="${id}"`
        );
        // star
        html = html.replace(/onclick="toggleStar\(\d+\)"/g,  `data-act="star"     data-taskid="${id}"`);
        // pin
        html = html.replace(/onclick="togglePin\(\d+\)"/g,   `data-act="pin"      data-taskid="${id}"`);
        // delete
        html = html.replace(/onclick="delTask\(\d+\)"/g,      `data-act="delete"   data-taskid="${id}"`);
        // reminder
        html = html.replace(/onclick="openSetReminderInline\(event,\d+\)"/g, `data-act="reminder" data-taskid="${id}"`);
        // save inline reminder
        html = html.replace(/onclick="saveInlineReminder\(\d+\)"/g, `data-act="save-reminder" data-taskid="${id}"`);
        // setPriorityCtx
        html = html.replace(/onclick="setPriorityCtx\(\d+,'([^']*)'\)"/g, (_, pri) =>
          `data-act="set-priority" data-taskid="${id}" data-pri="${pri}"`
        );

        return html;
      };
    }

    /* ════════════════════════════════════════════════════════
       PATCH: render — after rendering update delegation
    ════════════════════════════════════════════════════════ */
    if (typeof window.render === 'function') {
      const _origRender = window.render;
      window.render = function() {
        _origRender.apply(this, arguments);
        // Re-bind task list event delegation (already on #task-list container, no extra work needed)
        // Just ensure the task-list has role=list
        const tl = document.getElementById('task-list');
        if (tl && !tl.getAttribute('role')) tl.setAttribute('role', 'list');
      };
    }

    /* ════════════════════════════════════════════════════════
       PATCH: renderReminders / renderRemindersSheet
       Replace onclick in template strings with data-*
    ════════════════════════════════════════════════════════ */
    function patchRemRenderer(fnName) {
      if (typeof window[fnName] !== 'function') return;
      const _orig = window[fnName];
      window[fnName] = function() {
        _orig.apply(this, arguments);
        // Now patch all .rem-act buttons to use data attributes
        document.querySelectorAll('.rem-act[onclick]').forEach(btn => {
          const oc = btn.getAttribute('onclick') || '';
          // Extract id
          const idMatch = oc.match(/\((\d+)\)/);
          if (!idMatch) return;
          const remId = idMatch[1];

          let act = '';
          if (oc.includes('toggleRemActive'))  act = 'toggle-active';
          if (oc.includes('testReminder'))      act = 'test';
          if (oc.includes('delReminder'))       act = 'delete';
          if (oc.includes('toggleRemPin'))      act = 'toggle-pin';

          if (act) {
            btn.dataset.remAct = act;
            btn.dataset.remId  = remId;
            btn.removeAttribute('onclick');
          }
        });

        // Patch "Enable" notification buttons
        document.querySelectorAll('button[onclick="reqPerm()"]').forEach(btn => {
          btn.dataset.action = 'req-perm';
          btn.removeAttribute('onclick');
        });
      };
    }

    patchRemRenderer('renderReminders');
    patchRemRenderer('renderRemindersSheet');
    patchRemRenderer('renderSettingsRemList');

    /* ════════════════════════════════════════════════════════
       PATCH: getMostIgnoredBanner
       Uses onclick="pinAndHighlight(id)" in returned string.
       Replace with data attributes.
    ════════════════════════════════════════════════════════ */
    if (typeof window.getMostIgnoredBanner === 'function') {
      const _orig = window.getMostIgnoredBanner;
      window.getMostIgnoredBanner = function() {
        let html = _orig.apply(this, arguments);
        // Replace onclick="pinAndHighlight(N)" → data attributes
        html = html.replace(/onclick="pinAndHighlight\((\d+)\)"/g,
          (_, id) => `data-action="pin-highlight" data-task-id="${id}"`);
        return html;
      };
    }

    /* ════════════════════════════════════════════════════════
       PATCH: showTamperWarning
       Creates a div with innerHTML including onclick.
       Replace with safe DOM construction.
    ════════════════════════════════════════════════════════ */
    if (typeof window.showTamperWarning === 'function') {
      window.showTamperWarning = function() {
        if (document.getElementById('tamper-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'tamper-overlay';
        overlay.className = 'tamper-overlay';

        const box = document.createElement('div');
        box.className = 'tamper-box';

        const icon = document.createElement('div');
        icon.style.cssText = 'font-size:44px;margin-bottom:12px';
        icon.textContent = '⚠️';

        const title = document.createElement('div');
        title.style.cssText = 'font-size:18px;font-weight:800;color:#d13438;margin-bottom:8px';
        title.textContent = 'Data Tampering Detected!';

        const desc = document.createElement('div');
        desc.style.cssText = 'font-size:13px;color:var(--t2);margin-bottom:20px;line-height:1.6';
        desc.textContent = 'Your app data has been modified outside the app. This could cause data corruption or loss of your tasks and streaks.';

        const descB = document.createElement('b');
        descB.textContent = 'What do you want to do?';
        desc.appendChild(document.createElement('br'));
        desc.appendChild(document.createElement('br'));
        desc.appendChild(descB);

        const btns = document.createElement('div');
        btns.style.cssText = 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;';

        const keepBtn = document.createElement('button');
        keepBtn.className = 'btn btnp';
        keepBtn.textContent = 'Keep Current Data';
        keepBtn.addEventListener('click', () => {
          if (typeof dismissTamper === 'function') dismissTamper();
        });

        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn btno';
        resetBtn.textContent = 'Reset App Data';
        resetBtn.addEventListener('click', () => {
          if (typeof resetTamper === 'function') resetTamper();
        });

        btns.appendChild(keepBtn);
        btns.appendChild(resetBtn);
        box.appendChild(icon);
        box.appendChild(title);
        box.appendChild(desc);
        box.appendChild(btns);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
      };
    }

    /* ════════════════════════════════════════════════════════
       PATCH: export checklist toggleExpSel onclick
    ════════════════════════════════════════════════════════ */
    if (typeof window.buildExpChecklist === 'function') {
      const _orig = window.buildExpChecklist;
      window.buildExpChecklist = function() {
        _orig.apply(this, arguments);
        // Patch onclick on .exp-check-item
        document.querySelectorAll('.exp-check-item[onclick]').forEach(item => {
          const oc = item.getAttribute('onclick') || '';
          const m = oc.match(/toggleExpSel\('([^']+)'\)/);
          if (m) {
            const key = m[1];
            item.dataset.expkey = key;
            item.removeAttribute('onclick');
            item.addEventListener('click', () => {
              if (typeof toggleExpSel === 'function') toggleExpSel(key);
            });
          }
        });
        document.querySelectorAll('.exp-check-item input[onchange]').forEach(cb => {
          const oc = cb.getAttribute('onchange') || '';
          const m = oc.match(/toggleExpSel\('([^']+)'\)/);
          if (m) {
            const key = m[1];
            cb.removeAttribute('onchange');
            cb.removeAttribute('onclick');
            cb.addEventListener('change', () => {
              if (typeof toggleExpSel === 'function') toggleExpSel(key);
            });
          }
        });
      };
    }

    /* ════════════════════════════════════════════════════════
       PATCH: autocomplete dropdown onclicks
    ════════════════════════════════════════════════════════ */
    const dd = document.getElementById('ac-dropdown');
    if (dd) {
      dd.addEventListener('click', function(e) {
        const item = e.target.closest('.ac-item');
        if (!item) return;
        const text = item.dataset.text;
        if (text && typeof acPick === 'function') acPick(text);
      });
    }

    /* ════════════════════════════════════════════════════════
       PATCH: grp-del-btn (delete all completed in task groups)
    ════════════════════════════════════════════════════════ */
    document.getElementById('task-list').addEventListener('click', function(e) {
      if (e.target.closest('.grp-del-btn') && typeof deleteAllCompleted === 'function') {
        deleteAllCompleted();
      }
    });

    /* ════════════════════════════════════════════════════════
       PATCH: task-list full delegation for data-act attributes
    ════════════════════════════════════════════════════════ */
    const taskList = document.getElementById('task-list');
    if (taskList) {
      // Remove any previous listener and re-add with full data-act support
      taskList.addEventListener('click', function(e) {
        const actEl = e.target.closest('[data-act]');
        if (!actEl) return;

        const act    = actEl.dataset.act;
        const taskId = parseInt(actEl.dataset.taskid || actEl.closest('[data-taskid]')?.dataset.taskid, 10);
        if (!taskId) return;

        e.stopPropagation();

        switch (act) {
          case 'toggle':       if (typeof toggle       === 'function') toggle(taskId);               break;
          case 'star':         if (typeof toggleStar   === 'function') toggleStar(taskId);           break;
          case 'pin':          if (typeof togglePin    === 'function') togglePin(taskId);            break;
          case 'delete':       if (typeof delTask      === 'function') delTask(taskId);              break;
          case 'reminder':     if (typeof openSetReminderInline === 'function') openSetReminderInline(e, taskId); break;
          case 'save-reminder':if (typeof saveInlineReminder === 'function') saveInlineReminder(taskId); break;
          case 'set-priority': if (typeof setPriorityCtx === 'function') setPriorityCtx(taskId, actEl.dataset.pri); break;
        }
      });
    }

    /* ════════════════════════════════════════════════════════
       PATCH: history view toggle buttons (in-DOM buttons)
    ════════════════════════════════════════════════════════ */
    ['hv-week-btn', 'hv-month-btn'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn && btn.dataset.histview) {
        // Already bound in bindEvents; just ensure data flow
      }
    });

    console.log('[MyToDo] Dynamic renderer patches applied ✅');
  });

})(); // end patchDynamicRenderers
