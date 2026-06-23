let expenses = [
  { label: 'Housing', sublabel: 'Rent, sublet, or intern housing', key: 'housing', val: 500, color: '#534AB7' },
  { label: 'Food & groceries', sublabel: 'Cook most meals, eat out ~3x/week', key: 'food', val: 500, color: '#1D9E75' },
  { label: 'Transit', sublabel: 'Monthly pass or commute costs', key: 'transit', val: 134, color: '#378ADD' },
  { label: 'Phone bill', sublabel: '', key: 'phone', val: 50, color: '#D4537E' },
  { label: 'Entertainment & going out', sublabel: 'Shows, dining out, activities', key: 'fun', val: 250, color: '#BA7517' },
  { label: 'Clothing & personal', sublabel: 'Work outfits, toiletries', key: 'personal', val: 100, color: '#D85A30' },
  { label: 'Subscriptions & misc', sublabel: 'Streaming, apps, etc.', key: 'misc', val: 50, color: '#888780' },
];

let goals = [
  { id: 'goal-abroad',  label: 'Study abroad (spring, ~5 months)', icon: 'ti-plane',  target: 12000, color: '#1D9E75' },
  { id: 'goal-tuition', label: 'Tuition',                           icon: 'ti-school', target: 6500,  color: '#378ADD' },
  { id: 'goal-emerg',   label: 'Emergency fund',                    icon: 'ti-shield', target: 3000,  color: '#BA7517' },
];

function fmt(n) { return '$' + Math.round(n).toLocaleString(); }

function getNet() {
  const rate    = +document.getElementById('rate').value;
  const hours   = +document.getElementById('hours').value;
  const weeks   = +document.getElementById('weeks').value;
  const tax     = +document.getElementById('tax').value / 100;
  const stipend = +(document.getElementById('stipend')?.value || 0);
  return (rate * hours * weeks + stipend) * (1 - tax);
}

function setFromSlider(id) {
  const s = document.getElementById(id);
  const n = document.getElementById(id + '-num');
  if (s && n) n.value = s.value;
}

function setFromNum(id) {
  const s = document.getElementById(id);
  const n = document.getElementById(id + '-num');
  if (!s || !n) return;
  // Sync slider while typing — clamp only within slider range, not min
  const raw = parseFloat(n.value);
  if (!isNaN(raw)) s.value = Math.min(+s.max, Math.max(0, raw));
}

function clampNumInput(id) {
  const s = document.getElementById(id);
  const n = document.getElementById(id + '-num');
  if (!s || !n) return;
  const raw = parseFloat(n.value);
  const clamped = isNaN(raw) ? +s.min : Math.min(+s.max, Math.max(+s.min, raw));
  n.value = clamped;
  s.value = clamped;
  calc();
}

function setInternshipDates() {
  const s = document.getElementById('intern-start')?.value;
  const e = document.getElementById('intern-end')?.value;
  if (!s || !e) return;
  INTERNSHIP_START = new Date(s + 'T00:00:00');
  INTERNSHIP_END   = new Date(e + 'T00:00:00');
  TOTAL_DAYS = Math.max(1, Math.round((INTERNSHIP_END - INTERNSHIP_START) / 86400000) + 1);
  const wks = Math.round(TOTAL_DAYS / 7 * 10) / 10;
  const slider = document.getElementById('weeks');
  const num    = document.getElementById('weeks-num');
  if (slider) slider.value = Math.min(+slider.max, Math.max(+slider.min, wks));
  if (num)    num.value    = Math.min(+slider.max, Math.max(+slider.min, wks));
  document.querySelector('header p').textContent = s + ' – ' + e;
  calc();
  renderTracker();
}

function calc() {
  const rate  = +document.getElementById('rate').value;
  const hours = +document.getElementById('hours').value;
  const weeks = +document.getElementById('weeks').value;
  const taxPct = +document.getElementById('tax').value;
  const tax = taxPct / 100;
  // sync number inputs — only if not focused (let user type freely)
  const rn = document.getElementById('rate-num');  if (rn  && document.activeElement !== rn)  rn.value  = rate;
  const hn = document.getElementById('hours-num'); if (hn  && document.activeElement !== hn)  hn.value  = hours;
  const wn = document.getElementById('weeks-num'); if (wn  && document.activeElement !== wn)  wn.value  = weeks;
  const tn = document.getElementById('tax-num');   if (tn  && document.activeElement !== tn)  tn.value  = taxPct;
  // tax breakdown
  const ficaPct   = 7.65;
  const incomePct = Math.max(0, taxPct - ficaPct);
  const bdIncome  = document.getElementById('tax-income-pct');
  const bdTotal   = document.getElementById('tax-total-pct');
  if (bdIncome) bdIncome.textContent = incomePct.toFixed(2) + '%';
  if (bdTotal)  bdTotal.textContent  = taxPct + '%';
  const stipend = +(document.getElementById('stipend')?.value || 0);
  const gross  = rate * hours * weeks + stipend;
  const taxAmt = gross * tax;
  const net    = gross - taxAmt;
  document.getElementById('c-gross').textContent  = fmt(gross);
  document.getElementById('c-tax').textContent    = '-' + fmt(taxAmt);
  document.getElementById('c-net').textContent    = fmt(net);
  document.getElementById('c-weekly').textContent = fmt(net / weeks);
  updateGoals();
  updateAdvice();
  saveSettings();
}

function buildExpenses() {
  const list = document.getElementById('expense-list');
  list.innerHTML = '';
  expenses.forEach((e, i) => {
    const row = document.createElement('div');
    row.className = 'expense-row';
    row.id = 'exp-row-' + e.key;
    row.innerHTML = `
      <div class="expense-label" style="flex:1;min-width:0;">
        <input class="exp-label-input" type="text" value="${e.label}" oninput="expenses[${i}].label=this.value;updateExpenses();">
        ${e.sublabel !== undefined ? `<br><input class="exp-sublabel-input" type="text" value="${e.sublabel}" placeholder="note (optional)" oninput="expenses[${i}].sublabel=this.value;">` : ''}
      </div>
      <input class="expense-input" type="number" min="0" step="10" value="${e.val}" id="exp-${e.key}" oninput="updateExpenses()">
      <div class="expense-total" id="exp-mo-${e.key}">${fmt(e.val)}/mo</div>
      <button class="delete-btn" onclick="deleteExpense('${e.key}')" title="Remove"><i class="ti ti-trash"></i></button>
    `;
    list.appendChild(row);
  });
  updateExpenses();
}

function deleteExpense(key) {
  expenses = expenses.filter(e => e.key !== key);
  buildExpenses();
  saveSettings();
}

const EXP_COLORS = ['#534AB7','#1D9E75','#378ADD','#D4537E','#BA7517','#D85A30','#888780','#5AADA4','#C0684A'];

function addExpense() {
  const key = 'custom_' + Date.now();
  expenses.push({ label: 'New expense', sublabel: '', key, val: 0, color: EXP_COLORS[expenses.length % EXP_COLORS.length] });
  buildExpenses();
  saveSettings();
  setTimeout(() => {
    const el = document.querySelector('#exp-row-' + key + ' .exp-label-input');
    if (el) { el.focus(); el.select(); }
  }, 30);
}

const GOAL_ICON_OPTIONS = [
  'ti-plane','ti-beach','ti-school','ti-book','ti-shield','ti-heart-handshake',
  'ti-piggy-bank','ti-coin','ti-cash','ti-wallet','ti-trophy','ti-star',
  'ti-home','ti-building','ti-car','ti-device-laptop','ti-camera','ti-music',
  'ti-rocket','ti-bike','ti-barbell','ti-briefcase','ti-chart-bar','ti-gift',
];

let _iconPickerGoalId = null;

function openIconPicker(goalId, btn) {
  _iconPickerGoalId = goalId;
  const picker = document.getElementById('icon-picker');
  const grid = document.getElementById('icon-picker-grid');
  const g = goals.find(g => g.id === goalId);
  grid.innerHTML = GOAL_ICON_OPTIONS.map(ic =>
    `<button class="icon-picker-opt${g && g.icon === ic ? ' selected' : ''}" onclick="setGoalIcon('${goalId}','${ic}')"><i class="ti ${ic}"></i></button>`
  ).join('');
  const rect = btn.getBoundingClientRect();
  picker.style.display = 'block';
  picker.style.top  = (rect.bottom + 6) + 'px';
  picker.style.left = Math.min(rect.left, window.innerWidth - 230) + 'px';
}

function setGoalIcon(goalId, icon) {
  const g = goals.find(g => g.id === goalId);
  if (g) { g.icon = icon; saveSettings(); }
  const btn = document.querySelector(`#card-${goalId} .goal-icon-btn i`);
  if (btn) { btn.className = 'ti ' + icon; }
  document.getElementById('icon-picker').style.display = 'none';
}

document.addEventListener('click', e => {
  const picker = document.getElementById('icon-picker');
  if (picker && picker.style.display !== 'none' && !picker.contains(e.target) && !e.target.closest('.goal-icon-btn')) {
    picker.style.display = 'none';
  }
});

let _dragSrcId = null;

function onGoalDragStart(e, id) {
  _dragSrcId = id;
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function onGoalDragOver(e, id) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('drag-over'));
  if (id !== _dragSrcId) e.currentTarget.classList.add('drag-over');
}

function onGoalDrop(e, id) {
  e.preventDefault();
  if (id === _dragSrcId) return;
  // Persist current target values before reordering
  goals.forEach(g => { const el = document.getElementById('target-' + g.id); if (el) g.target = +el.value; });
  const srcIdx = goals.findIndex(g => g.id === _dragSrcId);
  const dstIdx = goals.findIndex(g => g.id === id);
  if (srcIdx < 0 || dstIdx < 0) return;
  const [moved] = goals.splice(srcIdx, 1);
  goals.splice(dstIdx, 0, moved);
  buildGoals();
  updateGoals();
  saveSettings();
}

function onGoalDragEnd() {
  document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('dragging','drag-over'));
}

function buildGoals() {
  const container = document.getElementById('goals-list');
  if (!container) return;
  container.innerHTML = '';
  const GOAL_ICONS = ['ti-plane','ti-school','ti-shield','ti-star','ti-piggy-bank','ti-coin','ti-trophy','ti-home','ti-heart'];
  const GOAL_COLORS = ['#1D9E75','#378ADD','#BA7517','#534AB7','#D4537E','#D85A30','#888780'];
  goals.forEach((g, i) => {
    const icon = g.icon || GOAL_ICONS[i % GOAL_ICONS.length];
    const color = g.color || GOAL_COLORS[i % GOAL_COLORS.length];
    const card = document.createElement('div');
    card.className = 'goal-card';
    card.id = 'card-' + g.id;
    card.draggable = true;
    card.addEventListener('dragstart', e => onGoalDragStart(e, g.id));
    card.addEventListener('dragover',  e => onGoalDragOver(e, g.id));
    card.addEventListener('drop',      e => onGoalDrop(e, g.id));
    card.addEventListener('dragend',   onGoalDragEnd);
    card.innerHTML = `
      <div class="goal-header">
        <span class="goal-drag-handle" title="Drag to reorder"><i class="ti ti-grip-vertical"></i></span>
        <button class="goal-icon-btn" onclick="openIconPicker('${g.id}', this)" title="Change icon"><i class="ti ${icon}"></i></button>
        <div class="goal-title" style="flex:1;min-width:0;">
          <input class="goal-label-input" type="text" value="${g.label}" oninput="goals[${i}].label=this.value;saveSettings();">
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
          <span class="goal-pct" id="pct-${g.id}">0%</span>
          <button class="delete-btn" onclick="deleteGoal('${g.id}')" title="Remove"><i class="ti ti-trash"></i></button>
        </div>
      </div>
      <div class="goal-target-row">
        Target: <input type="number" id="target-${g.id}" value="${g.target}" min="0" step="500" oninput="updateGoals()">
      </div>
      <div class="goal-bar-wrap">
        <div class="goal-proj-bar" id="proj-bar-${g.id}" style="background:${color};width:0%;"></div>
        <div class="goal-bar"      id="bar-${g.id}"      style="background:${color};width:0%;"></div>
      </div>
      <div class="goal-meta" id="meta-${g.id}"></div>

      <div class="goal-contrib-section">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:11px;color:var(--text-secondary);letter-spacing:.04em;">CONTRIBUTIONS</span>
          <button class="link-btn" onclick="toggleContribForm('${g.id}')"><i class="ti ti-plus" style="font-size:12px;"></i> Log contribution</button>
        </div>
        <div id="contrib-form-${g.id}" style="display:none;">
          <div class="contrib-form">
            <input type="date" id="cdate-${g.id}">
            <input type="number" id="camt-${g.id}" placeholder="Amount ($)" min="1" step="1">
            <input type="text"   id="cnote-${g.id}" placeholder="Note (optional)">
            <div style="display:flex;gap:6px;">
              <button class="btn-primary" style="flex:1;" onclick="addContribution('${g.id}')">Save</button>
              <button class="btn-secondary" onclick="toggleContribForm('${g.id}')">Cancel</button>
            </div>
          </div>
        </div>
        <div id="contrib-list-${g.id}"></div>
      </div>
    `;
    container.appendChild(card);
  });
}

function toggleContribForm(goalId) {
  const form = document.getElementById('contrib-form-' + goalId);
  if (!form) return;
  const opening = form.style.display === 'none';
  form.style.display = opening ? 'block' : 'none';
  if (opening) {
    // default date to today
    const d = new Date(), y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
    document.getElementById('cdate-' + goalId).value = `${y}-${m}-${day}`;
    setTimeout(() => document.getElementById('camt-' + goalId)?.focus(), 30);
  }
}

function addContribution(goalId) {
  const g = goals.find(g => g.id === goalId);
  if (!g) return;
  const amt  = +(document.getElementById('camt-'  + goalId)?.value || 0);
  const date =   document.getElementById('cdate-' + goalId)?.value || '';
  const note =   document.getElementById('cnote-' + goalId)?.value.trim() || '';
  if (!amt || amt <= 0) { alert('Enter an amount greater than $0.'); return; }
  if (!g.contributions) g.contributions = [];
  g.contributions.push({ id: 'c' + Date.now(), date, amount: amt, note });
  // clear form
  document.getElementById('camt-'  + goalId).value = '';
  document.getElementById('cnote-' + goalId).value = '';
  toggleContribForm(goalId);
  renderContributions(goalId);
  updateGoals();
  saveSettings();
}

function deleteContribution(goalId, contribId) {
  const g = goals.find(g => g.id === goalId);
  if (!g) return;
  g.contributions = (g.contributions || []).filter(c => c.id !== contribId);
  renderContributions(goalId);
  updateGoals();
  saveSettings();
}

function renderContributions(goalId) {
  const g   = goals.find(g => g.id === goalId);
  const el  = document.getElementById('contrib-list-' + goalId);
  if (!el || !g) return;
  const contribs = (g.contributions || []).slice().sort((a,b) => b.date.localeCompare(a.date));
  if (contribs.length === 0) { el.innerHTML = '<div style="font-size:12px;color:var(--text-secondary);padding:4px 0;">No contributions yet — log one to track real savings.</div>'; return; }
  el.innerHTML = contribs.map(c => `
    <div class="contrib-entry">
      <span class="contrib-date">${c.date}</span>
      <span class="contrib-amt">+${fmt(c.amount)}</span>
      ${c.note ? `<span class="contrib-note">${c.note}</span>` : '<span class="contrib-note" style="opacity:0;">—</span>'}
      <button class="contrib-del" onclick="deleteContribution('${goalId}','${c.id}')" title="Remove"><i class="ti ti-x"></i></button>
    </div>
  `).join('');
}

function deleteGoal(id) {
  goals = goals.filter(g => g.id !== id);
  buildGoals();
  updateGoals();
  saveSettings();
}

function addGoal() {
  const GOAL_ICONS  = ['ti-star','ti-piggy-bank','ti-coin','ti-trophy','ti-home','ti-heart','ti-plane','ti-school','ti-shield'];
  const GOAL_COLORS = ['#1D9E75','#378ADD','#BA7517','#534AB7','#D4537E','#D85A30','#888780'];
  const id = 'goal-' + Date.now();
  goals.push({ id, label: 'New goal', icon: GOAL_ICONS[goals.length % GOAL_ICONS.length], target: 1000, color: GOAL_COLORS[goals.length % GOAL_COLORS.length] });
  buildGoals();
  updateGoals();
  saveSettings();
  setTimeout(() => {
    const el = document.querySelector('#card-' + id + ' .goal-label-input');
    if (el) { el.focus(); el.select(); }
  }, 30);
}

function getExpenseTotal() {
  return expenses.reduce((sum, e) => {
    const v = +(document.getElementById('exp-' + e.key)?.value || e.val);
    return sum + v;
  }, 0);
}

function updateExpenses() {
  let total = 0;
  expenses.forEach(e => {
    const v = +(document.getElementById('exp-' + e.key)?.value || e.val);
    const el = document.getElementById('exp-mo-' + e.key);
    if (el) el.textContent = fmt(v) + '/mo';
    total += v;
  });
  document.getElementById('exp-total').textContent = fmt(total);
  document.getElementById('exp-total-3mo').textContent = fmt(total * 3);

  const wrap = document.getElementById('bar-chart-wrap');
  const legend = document.getElementById('bar-legend');
  let bars = '<div style="display:flex;height:20px;border-radius:10px;overflow:hidden;width:100%;">';
  let legs = '';
  expenses.forEach(e => {
    const v = +(document.getElementById('exp-' + e.key)?.value || e.val);
    const pct = total > 0 ? (v / total * 100).toFixed(1) : 0;
    if (pct > 0) {
      bars += `<div style="width:${pct}%;background:${e.color};transition:width 0.4s;"></div>`;
      legs += `<span><span class="legend-dot" style="background:${e.color};"></span>${e.label} ${pct}%</span>`;
    }
  });
  bars += '</div>';
  wrap.innerHTML = bars;
  legend.innerHTML = legs;
  updateGoals();
  updateAdvice();
  saveSettings();
}

function updateGoals() {
  const net      = getNet();
  const weeks    = +document.getElementById('weeks').value;
  const months   = weeks / (52 / 12);
  const expTotal = getExpenseTotal() * months;

  // Projected daily savings rate
  const dailyNet = (net - expTotal) / TOTAL_DAYS;

  // Days elapsed since internship start
  const today        = new Date();
  const elapsedDays  = Math.max(0, Math.min(TOTAL_DAYS, (today - INTERNSHIP_START) / 86400000));
  const remainDays   = Math.max(0, TOTAL_DAYS - elapsedDays);

  let totalGoals = 0, totalSaved = 0;
  goals.forEach(g => {
    const target  = +(document.getElementById('target-' + g.id)?.value ?? g.target);
    totalGoals   += target;
    const saved   = (g.contributions || []).reduce((s, c) => s + c.amount, 0);
    totalSaved   += saved;

    // Projected final = what you'll have by internship end at current pace
    const projected = Math.max(saved, saved + dailyNet * remainDays);
    const projPct   = target > 0 ? Math.min(100, projected / target * 100) : 0;
    const savedPct  = target > 0 ? Math.min(100, saved / target * 100) : 0;
    const onTrack   = projected >= target;

    const bar     = document.getElementById('bar-'      + g.id);
    const projBar = document.getElementById('proj-bar-' + g.id);
    const pctEl   = document.getElementById('pct-'      + g.id);
    const meta    = document.getElementById('meta-'     + g.id);

    if (bar)     bar.style.width     = savedPct + '%';
    if (projBar) projBar.style.width = projPct  + '%';

    if (pctEl) {
      const wasNotFunded = !pctEl.querySelector('.funded-badge');
      if (saved >= target && target > 0) {
        if (wasNotFunded) launchConfetti(pctEl);
        pctEl.innerHTML = '<span class="funded-badge"><i class="ti ti-circle-check" style="font-size:12px;"></i> Funded</span>';
      } else {
        pctEl.textContent = Math.round(savedPct) + '%';
      }
    }

    if (meta) {
      const trackBadge = saved >= target && target > 0
        ? `<span class="track-badge done"><i class="ti ti-circle-check" style="font-size:11px;"></i> Goal reached!</span>`
        : onTrack
          ? `<span class="track-badge on-track"><i class="ti ti-trending-up" style="font-size:11px;"></i> On track</span>`
          : `<span class="track-badge behind"><i class="ti ti-alert-triangle" style="font-size:11px;"></i> Behind pace</span>`;
      meta.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:4px;">
          <span><strong>${fmt(saved)}</strong> saved of ${fmt(target)}</span>
          ${trackBadge}
        </div>
        <div style="margin-top:3px;color:var(--text-secondary);">Projected by ${INTERNSHIP_END.toLocaleDateString('en-US',{month:'short',day:'numeric'})}: <strong>${fmt(Math.round(projected))}</strong>${onTrack && saved < target ? ` · needs ${fmt(target - Math.round(projected) < 0 ? 0 : target - saved)} more` : ''}</div>
      `;
    }

    renderContributions(g.id);
  });

  const surplus   = totalSaved - totalGoals;
  const surplusEl = document.getElementById('g-surplus');
  if (document.getElementById('g-remaining')) document.getElementById('g-remaining').textContent = fmt(Math.max(0, net - expTotal));
  if (document.getElementById('g-goals'))     document.getElementById('g-goals').textContent     = fmt(totalGoals);
  if (surplusEl) {
    surplusEl.textContent = (surplus >= 0 ? '+' : '') + fmt(surplus);
    surplusEl.className   = 'card-value ' + (surplus >= 0 ? 'green' : 'red');
  }
  saveSettings();
}

let _adviceEdited = false;

function regenerateAdvice() {
  _adviceEdited = false;
  updateAdvice();
}

function updateAdvice() {
  if (_adviceEdited) return;
  const el = document.getElementById('advice-content');
  if (!el) return;

  const rate    = +document.getElementById('rate').value;
  const hours   = +document.getElementById('hours').value;
  const weeks   = +document.getElementById('weeks').value;
  const taxPct  = +document.getElementById('tax').value;
  const stipend = +(document.getElementById('stipend')?.value || 0);
  const months  = weeks / (52 / 12);
  const gross   = rate * hours * weeks + stipend;
  const net     = gross * (1 - taxPct / 100);
  const expTotal = getExpenseTotal() * months;
  const remaining = net - expTotal;

  const cityEl = document.getElementById('city-select');
  const cityName = cityEl?.options[cityEl.selectedIndex]?.textContent || '';

  const goalList = goals.map(g => ({
    label:  g.label,
    target: +(document.getElementById('target-' + g.id)?.value ?? g.target),
    color:  g.color,
  }));
  const totalGoals = goalList.reduce((s, g) => s + g.target, 0);
  const surplus = remaining - totalGoals;

  // Sort expenses highest to lowest
  const expItems = expenses.map(e => ({
    label: e.label,
    val: +(document.getElementById('exp-' + e.key)?.value ?? e.val),
  })).sort((a, b) => b.val - a.val);
  const topExpense = expItems[0];

  // Snapshot bar
  let html = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:1.25rem;">`;
  html += `<div style="background:var(--bg-secondary);border-radius:8px;padding:10px 12px;"><div style="font-size:11px;color:var(--text-secondary);margin-bottom:3px;">NET TAKE-HOME</div><div style="font-size:17px;font-weight:500;color:var(--green);">${fmt(net)}</div></div>`;
  html += `<div style="background:var(--bg-secondary);border-radius:8px;padding:10px 12px;"><div style="font-size:11px;color:var(--text-secondary);margin-bottom:3px;">TOTAL EXPENSES</div><div style="font-size:17px;font-weight:500;">${fmt(expTotal)}</div></div>`;
  html += `<div style="background:var(--bg-secondary);border-radius:8px;padding:10px 12px;"><div style="font-size:11px;color:var(--text-secondary);margin-bottom:3px;">GOALS TOTAL</div><div style="font-size:17px;font-weight:500;">${fmt(totalGoals)}</div></div>`;
  html += `<div style="background:var(--bg-secondary);border-radius:8px;padding:10px 12px;"><div style="font-size:11px;color:var(--text-secondary);margin-bottom:3px;">${surplus >= 0 ? 'SURPLUS' : 'SHORTFALL'}</div><div style="font-size:17px;font-weight:500;color:${surplus >= 0 ? 'var(--green)' : 'var(--red)'};">${surplus >= 0 ? '+' : ''}${fmt(surplus)}</div></div>`;
  html += `</div>`;

  html += `<ol class="advice-list">`;

  // 1. Biggest expense
  if (topExpense && topExpense.val > 0) {
    html += `<li><strong>${topExpense.label} is your biggest cost at ${fmt(topExpense.val)}/month</strong> (${fmt(topExpense.val * months)} over the internship). `;
    if (topExpense.label.toLowerCase().includes('housing')) {
      html += `If your employer offers housing or a stipend, take it. Sharing with 2–3 others in a less central area typically cuts this by 30–50%.`;
    } else {
      html += `Look for ways to trim this category — even a 20% reduction saves ${fmt(topExpense.val * months * 0.2)} over the internship.`;
    }
    html += `</li>`;
  }

  // 2. Goals breakdown
  if (goalList.length > 0) {
    const funded = Math.max(0, remaining);
    html += `<li><strong>Goal coverage with your ${fmt(remaining)} after expenses:</strong><ul style="margin-top:6px;padding-left:1.2rem;display:flex;flex-direction:column;gap:4px;">`;
    let runningFunded = funded;
    goalList.forEach(g => {
      const cover = Math.min(runningFunded, g.target);
      const pct = g.target > 0 ? Math.round(cover / g.target * 100) : 0;
      runningFunded = Math.max(0, runningFunded - g.target);
      html += `<li style="font-size:13px;"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${g.color};margin-right:6px;vertical-align:middle;"></span><strong>${g.label}</strong> — ${fmt(g.target)} target, ${pct}% funded (${fmt(cover)})</li>`;
    });
    html += `</ul></li>`;
  }

  // 3. Surplus or shortfall action
  if (surplus >= 0) {
    html += `<li><strong>You have a ${fmt(surplus)} surplus after all goals.</strong> Consider putting ${fmt(Math.min(surplus, 7000))} into a Roth IRA (2026 limit: $7,000) and investing in a low-cost S&P 500 index fund like FXAIX or VTI. Tax-free growth for life — the earlier the better.</li>`;
  } else {
    const shortfall = Math.abs(surplus);
    const monthlyGap = shortfall / months;
    html += `<li><strong>You're ${fmt(shortfall)} short of your goals.</strong> You'd need to find an extra ${fmt(monthlyGap)}/month or cut expenses to close the gap. Options: reduce your lowest-priority goal target, cut discretionary spending (${expItems.slice(0,2).map(e => e.label).join(', ')}), or pick up extra hours if possible.</li>`;
  }

  // 4. Tax note
  if (cityName && cityName !== '— select city —') {
    html += `<li><strong>Tax situation in ${cityName}:</strong> At ${taxPct}% effective rate you're keeping ${(100 - taxPct)}% of every dollar earned. ${taxPct >= 30 ? `High-tax location — make sure withholding is accurate on your first pay stub so you don't get a surprise bill.` : `Relatively low tax burden — FICA (7.65%) is fixed, so your state/local portion is modest.`}</li>`;
  }

  // 5. Savings vehicle
  html += `<li><strong>Keep goal money out of your checking account.</strong> Open a high-yield savings account (Marcus, SoFi, or Ally — ~4.5–5% APY) for your ${goalList.map(g => g.label).join(', ')} funds. Automate a transfer on payday so it never feels available to spend.</li>`;

  html += `</ol>`;
  el.innerHTML = html;
}

function showTab(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  btn.classList.add('active');
}

const CITIES = [
  { group: 'No state income tax (~25%)', cities: [
    { name: 'Anchorage, AK',            rate: 25, note: 'No AK state income tax. Federal ~17% + FICA 7.65%.' },
    { name: 'Austin, TX',               rate: 25, note: 'No TX state income tax. Federal ~17% + FICA 7.65%.' },
    { name: 'Dallas, TX',               rate: 25, note: 'No TX state income tax. Federal ~17% + FICA 7.65%.' },
    { name: 'Houston, TX',              rate: 25, note: 'No TX state income tax. Federal ~17% + FICA 7.65%.' },
    { name: 'Jacksonville, FL',         rate: 25, note: 'No FL state income tax. Federal ~17% + FICA 7.65%.' },
    { name: 'Las Vegas, NV',            rate: 25, note: 'No NV state income tax. Federal ~17% + FICA 7.65%.' },
    { name: 'Miami, FL',                rate: 25, note: 'No FL state income tax. Federal ~17% + FICA 7.65%.' },
    { name: 'Nashville, TN',            rate: 25, note: 'No TN wage income tax. Federal ~17% + FICA 7.65%.' },
    { name: 'Orlando, FL',              rate: 25, note: 'No FL state income tax. Federal ~17% + FICA 7.65%.' },
    { name: 'San Antonio, TX',          rate: 25, note: 'No TX state income tax. Federal ~17% + FICA 7.65%.' },
    { name: 'Seattle / Bellevue, WA',   rate: 25, note: 'No WA state income tax. Federal ~17% + FICA 7.65%.' },
    { name: 'Tampa, FL',                rate: 25, note: 'No FL state income tax. Federal ~17% + FICA 7.65%.' },
  ]},
  { group: 'Low-tax states (~26–27%)', cities: [
    { name: 'Albuquerque, NM',          rate: 27, note: 'Federal ~17% + FICA 7.65% + NM state ~4.9%.' },
    { name: 'Boise, ID',                rate: 27, note: 'Federal ~17% + FICA 7.65% + ID state ~5.8%.' },
    { name: 'Denver / Boulder, CO',     rate: 27, note: 'Federal ~17% + FICA 7.65% + CO flat 4.4%.' },
    { name: 'Indianapolis, IN',         rate: 26, note: 'Federal ~17% + FICA 7.65% + IN flat 3.15% + county ~1%.' },
    { name: 'New Orleans, LA',          rate: 27, note: 'Federal ~17% + FICA 7.65% + LA state ~4.25%.' },
    { name: 'Phoenix, AZ',              rate: 27, note: 'Federal ~17% + FICA 7.65% + AZ flat 2.5%.' },
    { name: 'Raleigh / Durham, NC',     rate: 27, note: 'Federal ~17% + FICA 7.65% + NC flat 4.5%.' },
    { name: 'Salt Lake City, UT',       rate: 27, note: 'Federal ~17% + FICA 7.65% + UT flat 4.65%.' },
    { name: 'Tucson, AZ',               rate: 27, note: 'Federal ~17% + FICA 7.65% + AZ flat 2.5%.' },
  ]},
  { group: 'Mid-tax states (~28%)', cities: [
    { name: 'Ann Arbor, MI',            rate: 28, note: 'Federal ~17% + FICA 7.65% + MI flat 4.25% + local ~1%.' },
    { name: 'Atlanta, GA',              rate: 28, note: 'Federal ~17% + FICA 7.65% + GA flat 5.49%.' },
    { name: 'Boston / Cambridge, MA',   rate: 28, note: 'Federal ~17% + FICA 7.65% + MA flat 5%.' },
    { name: 'Charlotte, NC',            rate: 27, note: 'Federal ~17% + FICA 7.65% + NC flat 4.5%.' },
    { name: 'Chicago, IL',              rate: 28, note: 'Federal ~17% + FICA 7.65% + IL flat 4.95%.' },
    { name: 'Cincinnati, OH',           rate: 28, note: 'Federal ~17% + FICA 7.65% + OH ~4% + local 2.1%.' },
    { name: 'Cleveland, OH',            rate: 28, note: 'Federal ~17% + FICA 7.65% + OH ~4% + Cleveland 2.5%.' },
    { name: 'Columbus, OH',             rate: 28, note: 'Federal ~17% + FICA 7.65% + OH ~4% + Columbus 2.5%.' },
    { name: 'Detroit, MI',              rate: 28, note: 'Federal ~17% + FICA 7.65% + MI flat 4.25% + Detroit 2.4%.' },
    { name: 'Hartford, CT',             rate: 28, note: 'Federal ~17% + FICA 7.65% + CT progressive ~5%.' },
    { name: 'Kansas City, MO',          rate: 29, note: 'Federal ~17% + FICA 7.65% + MO ~4.9% + KC earnings tax 1%.' },
    { name: 'Louisville, KY',           rate: 29, note: 'Federal ~17% + FICA 7.65% + KY flat 4% + Louisville 2.2%.' },
    { name: 'Madison, WI',              rate: 28, note: 'Federal ~17% + FICA 7.65% + WI progressive ~5.3%.' },
    { name: 'Milwaukee, WI',            rate: 28, note: 'Federal ~17% + FICA 7.65% + WI progressive ~5.3%.' },
    { name: 'Minneapolis / St. Paul, MN', rate: 30, note: 'Federal ~17% + FICA 7.65% + MN progressive ~6.5%.' },
    { name: 'Newark / Jersey City, NJ', rate: 28, note: 'Federal ~17% + FICA 7.65% + NJ progressive ~5%.' },
    { name: 'Omaha, NE',                rate: 28, note: 'Federal ~17% + FICA 7.65% + NE progressive ~5.2%.' },
    { name: 'Pittsburgh, PA',           rate: 28, note: 'Federal ~17% + FICA 7.65% + PA flat 3.07% + Pittsburgh 3%.' },
    { name: 'Providence, RI',           rate: 28, note: 'Federal ~17% + FICA 7.65% + RI progressive ~4.75%.' },
    { name: 'Richmond, VA',             rate: 28, note: 'Federal ~17% + FICA 7.65% + VA progressive ~5.75%.' },
    { name: 'St. Louis, MO',            rate: 29, note: 'Federal ~17% + FICA 7.65% + MO ~4.9% + St. Louis earnings tax 1%.' },
    { name: 'Stamford, CT',             rate: 28, note: 'Federal ~17% + FICA 7.65% + CT progressive ~5%.' },
  ]},
  { group: 'Higher-tax states (~29–30%)', cities: [
    { name: 'Baltimore, MD',            rate: 30, note: 'Federal ~17% + FICA 7.65% + MD ~4.75% + Baltimore city 3.2%.' },
    { name: 'Buffalo / Albany, NY',     rate: 29, note: 'Federal ~17% + FICA 7.65% + NY state ~6% (no NYC local tax).' },
    { name: 'Burlington, VT',           rate: 29, note: 'Federal ~17% + FICA 7.65% + VT progressive ~6.6%.' },
    { name: 'Los Angeles, CA',          rate: 30, note: 'Federal ~17% + FICA 7.65% + CA progressive ~9.3% + SDI 1.1%.' },
    { name: 'Philadelphia, PA',         rate: 30, note: 'Federal ~17% + FICA 7.65% + PA flat 3.07% + Philly wage tax 3.79%.' },
    { name: 'Portland, ME',             rate: 29, note: 'Federal ~17% + FICA 7.65% + ME progressive ~6.5%.' },
    { name: 'Sacramento, CA',           rate: 30, note: 'Federal ~17% + FICA 7.65% + CA progressive ~9.3% + SDI 1.1%.' },
    { name: 'San Diego, CA',            rate: 30, note: 'Federal ~17% + FICA 7.65% + CA progressive ~9.3% + SDI 1.1%.' },
    { name: 'San Francisco / Bay Area, CA', rate: 30, note: 'Federal ~17% + FICA 7.65% + CA progressive ~9.3% + SDI 1.1%.' },
    { name: 'San Jose, CA',             rate: 30, note: 'Federal ~17% + FICA 7.65% + CA progressive ~9.3% + SDI 1.1%.' },
    { name: 'Washington, DC',           rate: 30, note: 'Federal ~17% + FICA 7.65% + DC progressive ~8.5%.' },
    { name: 'Wilmington, DE',           rate: 29, note: 'Federal ~17% + FICA 7.65% + DE ~5.5% + Wilmington city 1.25%.' },
  ]},
  { group: 'Highest-tax cities (~31–32%)', cities: [
    { name: 'Honolulu, HI',             rate: 31, note: 'Federal ~17% + FICA 7.65% + HI progressive ~8%. Hawaii has some of the highest state income tax in the US.' },
    { name: 'New York City, NY',        rate: 32, note: 'Federal ~17% + FICA 7.65% + NY state ~6% + NYC city tax ~3.5%. Highest combined burden of major US cities.' },
    { name: 'Portland, OR',             rate: 31, note: 'Federal ~17% + FICA 7.65% + OR progressive ~8.75% + Metro/Multnomah taxes.' },
  ]},
];

function buildCitySelect() {
  const sel = document.getElementById('city-select');
  CITIES.forEach(group => {
    const og = document.createElement('optgroup');
    og.label = group.group;
    group.cities.forEach(c => {
      const opt = document.createElement('option');
      opt.value = JSON.stringify({ rate: c.rate, note: c.note });
      opt.textContent = c.name;
      og.appendChild(opt);
    });
    sel.appendChild(og);
  });
  const custom = document.createElement('option');
  custom.value = 'custom';
  custom.textContent = 'Custom';
  sel.appendChild(custom);
  // Default to NYC
  const nycOpt = [...sel.options].find(o => o.textContent === 'New York City, NY');
  if (nycOpt) { sel.value = nycOpt.value; applyCity(nycOpt.value); }
}

function applyCity(val) {
  if (!val || val === 'custom') return;
  try {
    const { rate, note } = JSON.parse(val);
    const slider = document.getElementById('tax');
    if (slider) { slider.value = rate; calc(); }
    const tip = document.getElementById('tax-tip');
    if (tip) tip.textContent = note;
  } catch(e) {}
}

let _ready = false;

// ── URL state sharing ────────────────────────────────────────────────────────

function getShareableState() {
  const sel = document.getElementById('city-select');
  return {
    v: 1,
    cityName: sel?.options[sel.selectedIndex]?.textContent || '',
    rate:  document.getElementById('rate')?.value,
    hours: document.getElementById('hours')?.value,
    weeks: document.getElementById('weeks')?.value,
    tax:   document.getElementById('tax')?.value,
    stipend: document.getElementById('stipend')?.value || '0',
    internStart: document.getElementById('intern-start')?.value,
    internEnd:   document.getElementById('intern-end')?.value,
    expensesData: expenses.map(e => ({ key: e.key, label: e.label, val: +(document.getElementById('exp-' + e.key)?.value ?? e.val), color: e.color })),
    goalsData: goals.map(g => ({ id: g.id, label: g.label, icon: g.icon, color: g.color, target: +(document.getElementById('target-' + g.id)?.value ?? g.target) })),
  };
}

let _shareDebounce = null;
function updateShareHash() {
  if (!_ready) return;
  clearTimeout(_shareDebounce);
  _shareDebounce = setTimeout(() => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(getShareableState()))));
      history.replaceState(null, '', '#' + encoded);
    } catch(e) {}
  }, 800);
}

// ── Dark mode toggle ─────────────────────────────────────────────────────────

function toggleTheme() {
  const root = document.documentElement;
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const current = root.getAttribute('data-theme');
  // Cycle: auto → forced-opposite → auto
  let next;
  if (!current) {
    next = sysDark ? 'light' : 'dark';
  } else {
    next = null; // back to system
  }
  if (next) root.setAttribute('data-theme', next);
  else root.removeAttribute('data-theme');
  document.getElementById('theme-btn').textContent = (next === 'dark' || (!next && sysDark)) ? '☀️' : '🌙';
  try { localStorage.setItem('nyc-budget-theme', next || 'auto'); } catch(e) {}
}

// Apply saved theme on load
(() => {
  try {
    const saved = localStorage.getItem('nyc-budget-theme');
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved && saved !== 'auto') document.documentElement.setAttribute('data-theme', saved);
    document.addEventListener('DOMContentLoaded', () => {
      const btn = document.getElementById('theme-btn');
      if (btn) {
        const theme = document.documentElement.getAttribute('data-theme');
        btn.textContent = (theme === 'dark' || (!theme && sysDark)) ? '☀️' : '🌙';
      }
    });
  } catch(e) {}
})();

// ── Confetti ──────────────────────────────────────────────────────────────────

function launchConfetti(originEl) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const rect   = originEl?.getBoundingClientRect();
  const ox     = rect ? rect.left + rect.width  / 2 : canvas.width  / 2;
  const oy     = rect ? rect.top  + rect.height / 2 : canvas.height / 2;
  const colors = ['#1D9E75','#378ADD','#BA7517','#534AB7','#D4537E','#f0efea','#5DCAA5'];
  const pieces = Array.from({ length: 80 }, () => ({
    x: ox, y: oy,
    vx: (Math.random() - 0.5) * 14,
    vy: (Math.random() - 0.8) * 14,
    r: Math.random() * 5 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI * 2,
    rSpeed: (Math.random() - 0.5) * 0.3,
    alpha: 1,
  }));

  let frame;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    pieces.forEach(p => {
      p.x  += p.vx; p.y += p.vy; p.vy += 0.35;
      p.vx *= 0.98; p.rot += p.rSpeed; p.alpha -= 0.013;
      if (p.alpha <= 0) return;
      alive = true;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      ctx.restore();
    });
    if (alive) frame = requestAnimationFrame(draw);
    else canvas.remove();
  }
  frame = requestAnimationFrame(draw);
}

function copyShareLink() {
  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(getShareableState()))));
    const url = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? 'https://karma0324.github.io/internship-budget/#' + encoded
      : location.origin + location.pathname + '#' + encoded;
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.getElementById('share-btn');
      if (btn) { btn.textContent = '✓ Copied!'; setTimeout(() => btn.textContent = '⤴ Share link', 1800); }
    });
  } catch(e) {}
}

function loadFromHash() {
  try {
    const hash = location.hash.slice(1);
    if (!hash) return null;
    return JSON.parse(decodeURIComponent(escape(atob(hash))));
  } catch(e) { return null; }
}

function applyState(s) {
  if (!s) return;
  if (s.internStart) { const el = document.getElementById('intern-start'); if (el) el.value = s.internStart; }
  if (s.internEnd)   { const el = document.getElementById('intern-end');   if (el) el.value = s.internEnd; }
  if (s.internStart && s.internEnd) {
    INTERNSHIP_START = new Date(s.internStart + 'T00:00:00');
    INTERNSHIP_END   = new Date(s.internEnd   + 'T00:00:00');
    TOTAL_DAYS = Math.max(1, Math.round((INTERNSHIP_END - INTERNSHIP_START) / 86400000) + 1);
    document.querySelector('header p').textContent = s.internStart + ' – ' + s.internEnd;
  }
  if (s.cityName) {
    const cs = document.getElementById('city-select');
    const opt = cs && Array.from(cs.options).find(o => o.textContent === s.cityName);
    if (opt) { cs.value = opt.value; try { const tip = document.getElementById('tax-tip'); if (tip) tip.textContent = JSON.parse(opt.value).note; } catch(e) {} }
  }
  ['rate','hours','weeks','tax'].forEach(id => {
    if (s[id] != null) {
      const sl = document.getElementById(id); if (sl) sl.value = s[id];
      const nm = document.getElementById(id + '-num'); if (nm) nm.value = s[id];
    }
  });
  if (s.stipend != null) { const el = document.getElementById('stipend'); if (el) el.value = s.stipend; }
  if (s.expensesData?.length) { expenses = s.expensesData.map(e => ({ note: '', ...e })); buildExpenses(); }
  if (s.goalsData?.length)    { goals = s.goalsData.map(g => ({ contributions: [], ...g })); buildGoals(); }
  goals.forEach(g => { const el = document.getElementById('target-' + g.id); if (el) el.value = g.target; renderContributions(g.id); });
}

// ─────────────────────────────────────────────────────────────────────────────

function saveSettings() {
  if (!_ready) return;
  updateShareHash();
  try {
    const sel = document.getElementById('city-select');
    const goalTargets = {};
    goals.forEach(g => {
      goalTargets[g.id] = document.getElementById('target-' + g.id)?.value;
    });
    const s = {
      cityName: sel.options[sel.selectedIndex]?.textContent || '',
      rate:  document.getElementById('rate').value,
      hours: document.getElementById('hours').value,
      weeks: document.getElementById('weeks').value,
      tax:     document.getElementById('tax').value,
      stipend: document.getElementById('stipend')?.value || '0',
      internStart: document.getElementById('intern-start')?.value,
      internEnd:   document.getElementById('intern-end')?.value,
      expensesData: expenses.map(e => ({ ...e, val: +(document.getElementById('exp-' + e.key)?.value ?? e.val) })),
      goalsData: goals.map(g => ({ ...g, target: +(document.getElementById('target-' + g.id)?.value ?? g.target) })),
      strategyNotes: document.getElementById('strategy-notes')?.value || '',
      adviceContent: document.getElementById('advice-content')?.innerHTML || '',
      adviceEdited: _adviceEdited,
    };
    localStorage.setItem('nyc-budget-settings', JSON.stringify(s));
  } catch(e) {}
}

function loadSettings() {
  try {
    const fromHash = loadFromHash();
    const s = fromHash || JSON.parse(localStorage.getItem('nyc-budget-settings') || 'null');
    if (!s) return;
    if (fromHash) { history.replaceState(null, '', location.pathname + location.hash); }
    // Restore internship dates
    if (s.internStart) { const el = document.getElementById('intern-start'); if (el) el.value = s.internStart; }
    if (s.internEnd)   { const el = document.getElementById('intern-end');   if (el) el.value = s.internEnd; }
    if (s.internStart && s.internEnd) {
      INTERNSHIP_START = new Date(s.internStart + 'T00:00:00');
      INTERNSHIP_END   = new Date(s.internEnd   + 'T00:00:00');
      TOTAL_DAYS = Math.max(1, Math.round((INTERNSHIP_END - INTERNSHIP_START) / 86400000) + 1);
      document.querySelector('header p').textContent = s.internStart + ' – ' + s.internEnd;
    }
    // Restore city
    if (s.cityName) {
      const cs = document.getElementById('city-select');
      if (cs) {
        const opt = Array.from(cs.options).find(o => o.textContent === s.cityName);
        if (opt) {
          cs.value = opt.value;
          try { const tip = document.getElementById('tax-tip'); if (tip) tip.textContent = JSON.parse(opt.value).note; } catch(e) {}
        }
      }
    }
    // Restore sliders
    ['rate','hours','weeks','tax'].forEach(id => {
      if (s[id] != null) {
        const sl = document.getElementById(id); if (sl) sl.value = s[id];
        const nm = document.getElementById(id + '-num'); if (nm) nm.value = s[id];
      }
    });
    if (s.stipend != null) { const el = document.getElementById('stipend'); if (el) el.value = s.stipend; }
    // Restore expenses
    if (s.expensesData?.length) {
      expenses = s.expensesData;
      buildExpenses();
    } else {
      expenses.forEach(e => {
        const el = document.getElementById('exp-' + e.key);
        if (el) el.value = e.val;
      });
    }
    // Restore goals
    if (s.goalsData?.length) {
      goals = s.goalsData.map(g => ({ contributions: [], ...g }));
      buildGoals();
    }
    // Restore goal targets (after buildGoals creates the inputs)
    goals.forEach(g => {
      const el = document.getElementById('target-' + g.id);
      if (el) el.value = g.target;
      renderContributions(g.id);
    });
    // Restore strategy notes
    if (s.strategyNotes != null) {
      const ta = document.getElementById('strategy-notes');
      if (ta) ta.value = s.strategyNotes;
    }
    // Restore edited advice
    if (s.adviceEdited && s.adviceContent) {
      _adviceEdited = true;
      const ac = document.getElementById('advice-content');
      if (ac) ac.innerHTML = s.adviceContent;
    }
  } catch(e) {}
}

buildCitySelect();
// ── Daily Tracker ────────────────────────────────────────────────────────────

let INTERNSHIP_START = new Date('2026-06-02');
let INTERNSHIP_END   = new Date('2026-08-28');
let TOTAL_DAYS = Math.round((INTERNSHIP_END - INTERNSHIP_START) / 86400000) + 1;

buildExpenses();
buildGoals();
loadSettings();
_ready = true;
calc();

const CAT_LABELS = {
  housing: 'Housing', food: 'Food & groceries', transit: 'Transit',
  phone: 'Phone', fun: 'Entertainment', personal: 'Clothing & personal', misc: 'Subscriptions & misc'
};

const CAT_COLORS = {
  housing: '#534AB7', food: '#1D9E75', transit: '#378ADD',
  phone: '#D4537E', fun: '#BA7517', personal: '#D85A30', misc: '#888780'
};

let trEntries = [];
try { trEntries = JSON.parse(localStorage.getItem('nyc-budget-entries') || '[]'); } catch(e) {}

function saveTrEntries() {
  try { localStorage.setItem('nyc-budget-entries', JSON.stringify(trEntries)); } catch(e) {}
}

function addEntry() {
  const date   = document.getElementById('tr-date').value;
  const cat    = document.getElementById('tr-cat').value;
  const amount = parseFloat(document.getElementById('tr-amount').value);
  const note   = document.getElementById('tr-note').value.trim();
  if (!date || isNaN(amount) || amount <= 0) return;
  trEntries.unshift({ id: Date.now(), date, cat, amount, note });
  saveTrEntries();
  document.getElementById('tr-amount').value = '';
  document.getElementById('tr-note').value = '';
  renderTracker();
}

function deleteEntry(id) {
  trEntries = trEntries.filter(e => e.id !== id);
  saveTrEntries();
  renderTracker();
}

function renderTracker() {
  const today = new Date();
  today.setHours(0,0,0,0);
  const start = new Date(INTERNSHIP_START);
  start.setHours(0,0,0,0);
  const daysElapsed = Math.max(1, Math.min(TOTAL_DAYS, Math.round((today - start) / 86400000) + 1));

  const monthlyBudget = getExpenseTotal();
  const internMonths  = TOTAL_DAYS / 30.4375;
  const totalBudget   = monthlyBudget * internMonths;
  const dailyBudget   = totalBudget / TOTAL_DAYS;
  const expectedByNow = dailyBudget * daysElapsed;
  const totalSpent    = trEntries.reduce((s, e) => s + e.amount, 0);
  const remaining     = totalBudget - totalSpent;
  const diff          = expectedByNow - totalSpent;
  const onTrack       = totalSpent <= expectedByNow;

  // Summary cards
  const cards = document.getElementById('tr-summary-cards');
  cards.innerHTML = `
    <div class="card"><div class="card-label">Spent so far</div><div class="card-value">${fmt(totalSpent)}</div></div>
    <div class="card"><div class="card-label">Expected by today</div><div class="card-value">${fmt(expectedByNow)}</div></div>
    <div class="card"><div class="card-label">${onTrack ? 'Under budget' : 'Over pace'}</div><div class="card-value ${onTrack ? 'green' : 'red'}">${onTrack ? '-' : '+'}${fmt(Math.abs(diff))}</div></div>
    <div class="card"><div class="card-label">Remaining budget</div><div class="card-value ${remaining < 0 ? 'red' : ''}">${fmt(Math.max(0, remaining))}</div></div>
  `;

  // Pace bar
  const paceWrap = document.getElementById('tr-pace-bar-wrap');
  paceWrap.style.display = 'block';
  const pct = Math.min(120, totalSpent / totalBudget * 100);
  const expectedPct = Math.min(100, expectedByNow / totalBudget * 100);
  const bar = document.getElementById('tr-pace-bar');
  bar.style.width = pct + '%';
  bar.style.background = onTrack ? 'var(--green)' : 'var(--red)';
  document.getElementById('tr-pace-label').textContent = onTrack
    ? `On track — day ${daysElapsed} of ${TOTAL_DAYS}`
    : `Over pace — day ${daysElapsed} of ${TOTAL_DAYS}`;
  document.getElementById('tr-pace-mid').textContent = `Target today: ${fmt(expectedByNow)}`;
  document.getElementById('tr-pace-max').textContent = `Total budget: ${fmt(totalBudget)}`;

  // Entries list
  const list = document.getElementById('tr-entries');
  const empty = document.getElementById('tr-empty');
  if (trEntries.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  list.innerHTML = trEntries.map(e => `
    <div class="expense-row" style="padding:10px 0;">
      <div style="width:10px;height:10px;border-radius:2px;background:${CAT_COLORS[e.cat]};flex-shrink:0;margin-top:2px;"></div>
      <div class="expense-label" style="margin-left:8px;">
        ${CAT_LABELS[e.cat]}${e.note ? ` <span style="color:var(--text-secondary);font-size:12px;">— ${e.note}</span>` : ''}
        <br><span class="expense-sublabel">${e.date}</span>
      </div>
      <div style="font-size:14px;font-weight:500;">${fmt(e.amount)}</div>
      <button onclick="deleteEntry(${e.id})" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);font-size:16px;padding:0 4px;margin-left:6px;" title="Delete">
        <i class="ti ti-trash"></i>
      </button>
    </div>
  `).join('');
}

// Set today's date as default
(function() {
  const d = document.getElementById('tr-date');
  if (!d) return;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  d.value = `${y}-${m}-${day}`;
})();

// ── Chatbot ──────────────────────────────────────────────────────────────────

let chatApiKey = '';
let chatHistory = [];

function saveKey() {
  const v = document.getElementById('api-key-input').value.trim();
  if (!v) return;
  chatApiKey = v;
  document.getElementById('api-key-input').value = '';
  document.getElementById('api-key-input').placeholder = 'API key saved ✓';
  addMsg('system-note', 'API key saved. You can now chat!');
}

function toggleChat() {
  const p = document.getElementById('chat-panel');
  p.classList.toggle('open');
}

function addMsg(role, text) {
  const box = document.getElementById('chat-messages');
  const el = document.createElement('div');
  el.className = 'chat-msg ' + role;
  el.textContent = text;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
  return el;
}

function getBudgetState() {
  return {
    hourlyRate: +document.getElementById('rate').value,
    hoursPerWeek: +document.getElementById('hours').value,
    workWeeks: +document.getElementById('weeks').value,
    taxRate: +document.getElementById('tax').value,
    expenses: {
      housing: +(document.getElementById('exp-housing')?.value || 1600),
      food: +(document.getElementById('exp-food')?.value || 500),
      transit: +(document.getElementById('exp-transit')?.value || 134),
      phone: +(document.getElementById('exp-phone')?.value || 50),
      fun: +(document.getElementById('exp-fun')?.value || 250),
      personal: +(document.getElementById('exp-personal')?.value || 100),
      misc: +(document.getElementById('exp-misc')?.value || 50),
    },
    goals: {
      studyAbroad: +(document.getElementById('abroad-goal')?.value || 12000),
      tuition: +(document.getElementById('tuition-goal')?.value || 6500),
      emergency: +(document.getElementById('emerg-goal')?.value || 3000),
    },
  };
}

function applyActions(actions) {
  const sliderMap = { hourlyRate: 'rate', hoursPerWeek: 'hours', workWeeks: 'weeks', taxRate: 'tax', stipend: 'stipend' };

  let changed = false;
  for (const a of actions) {
    const { field, value } = a;
    if (sliderMap[field]) {
      const el = document.getElementById(sliderMap[field]);
      if (el) { el.value = value; const nm = document.getElementById(field + '-num'); if (nm) nm.value = value; changed = true; }
    } else if (field === 'strategyContent') {
      const el = document.getElementById('advice-content');
      if (el) { el.innerHTML = value; _adviceEdited = true; saveSettings(); }
    } else {
      // Match expense by key or label
      const expMatch = expenses.find(e => e.key === field || e.label.toLowerCase().includes(field.toLowerCase()));
      if (expMatch) {
        const el = document.getElementById('exp-' + expMatch.key);
        if (el) { el.value = value; changed = true; }
      } else {
        // Match goal by label
        const goalMatch = goals.find(g => g.label.toLowerCase().includes(field.toLowerCase()) || g.id === field);
        if (goalMatch) {
          const el = document.getElementById('target-' + goalMatch.id);
          if (el) { el.value = value; changed = true; }
        }
      }
    }
  }
  if (changed) { updateExpenses(); calc(); }
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const text = input.value.trim();
  if (!text) return;

  if (!chatApiKey) {
    addMsg('system-note', 'Please save your Anthropic API key first.');
    return;
  }

  input.value = '';
  sendBtn.disabled = true;
  addMsg('user', text);
  const thinking = addMsg('assistant', '…');

  const rate    = +document.getElementById('rate').value;
  const hours   = +document.getElementById('hours').value;
  const wks     = +document.getElementById('weeks').value;
  const taxPct  = +document.getElementById('tax').value;
  const stipend = +(document.getElementById('stipend')?.value || 0);
  const gross   = rate * hours * wks + stipend;
  const net     = Math.round(gross * (1 - taxPct / 100));
  const months  = wks / (52 / 12);
  const expTotal = Math.round(getExpenseTotal() * months);
  const cityEl  = document.getElementById('city-select');
  const city    = cityEl?.options[cityEl.selectedIndex]?.textContent || 'unknown';

  const expLines = expenses.map(e => `  - ${e.label}: $${+(document.getElementById('exp-' + e.key)?.value ?? e.val)}/mo (key: "${e.key}")`).join('\n');
  const goalLines = goals.map(g => `  - ${g.label}: $${+(document.getElementById('target-' + g.id)?.value ?? g.target)} target (id: "${g.id}")`).join('\n');

  const systemPrompt = `You are a budget assistant embedded in an internship budget manager web app.

CURRENT BUDGET STATE:
- City: ${city}
- Hourly rate: $${rate}/hr | Hours/week: ${hours} | Work weeks: ${wks}
- Stipend/bonus (gross): $${stipend}
- Gross earnings: $${Math.round(gross)} | Effective tax: ${taxPct}% | Net take-home: $${net}
- Internship length: ~${months.toFixed(1)} months
- Total expenses over internship: $${expTotal}
- After expenses: $${net - expTotal}

EXPENSES (monthly):
${expLines}

GOALS:
${goalLines}

You can adjust any value OR rewrite the strategy page. Always respond with valid JSON only:
{"message": "Short confirmation to user.", "actions": [{"field": "...", "value": ...}]}

SETTABLE FIELDS:
- Income: hourlyRate, hoursPerWeek, workWeeks, taxRate, stipend
- Expenses: use the exact key in quotes above (e.g. "housing", "food") or match by label name
- Goals: use the exact id in quotes above (e.g. "goal-abroad") or match by label name
- Strategy page: field "strategyContent", value is an HTML string — rewrite the entire strategy when the user asks to update/personalize/change it

For strategyContent, write rich HTML using <ol>, <li>, <strong> tags. Reference their actual numbers.

If no change needed, use: {"message": "Answer here.", "actions": []}

IMPORTANT: JSON only. No markdown, no text outside the JSON.`;

  chatHistory.push({ role: 'user', content: text });

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': chatApiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-calls': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: systemPrompt,
        messages: chatHistory,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      thinking.textContent = data?.error?.message || 'API error. Check your key.';
      chatHistory.pop();
      sendBtn.disabled = false;
      return;
    }

    const raw = data.content?.[0]?.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { message: raw, actions: [] };
    }

    thinking.textContent = parsed.message || 'Done.';
    chatHistory.push({ role: 'assistant', content: raw });

    if (parsed.actions?.length) applyActions(parsed.actions);
  } catch (err) {
    thinking.textContent = 'Network error: ' + err.message;
    chatHistory.pop();
  }

  sendBtn.disabled = false;
}

renderTracker();