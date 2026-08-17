/**
 * app.js
 * ------------------------------------------------------------
 * 問卷系統核心邏輯（UI 渲染 / 驗證 / 送出）
 * 題目內容一律讀取自 questions-data.js，本檔不含任何題目文字，
 * 修改題目時完全不需要動到這支程式。
 * ------------------------------------------------------------
 */

const APP_ROOT = document.getElementById('app');

// ------------------------------------------------------------
// 全域狀態
// ------------------------------------------------------------
const state = {
  view: 'home',        // 'home' | 'survey' | 'submitting' | 'done' | 'error'
  identity: null,       // 'employee' | 'junior_manager' | 'senior_manager'
  sections: [],          // 該身分對應的 section 陣列
  visibleSectionIdx: [], // 依 showIf 條件計算出目前可見的 section 索引清單
  currentStep: 0,        // 目前在 visibleSectionIdx 中的第幾步
  answers: {},            // { field: value, field_other: value ... }
  errors: {}               // { field: '錯誤訊息' }
};

// ------------------------------------------------------------
// 工具函式
// ------------------------------------------------------------
// section.showIf 是一組條件陣列，彼此為「且」的關係：
// 全部條件都符合（answers[field] === equals）才顯示這個題組。
// 沒有 showIf 的題組一律顯示。
function sectionVisible(sec, answers) {
  if (!sec.showIf || sec.showIf.length === 0) return true;
  return sec.showIf.every(cond => answers[cond.field] === cond.equals);
}

function computeVisibleSections() {
  const list = [];
  state.sections.forEach((sec, idx) => {
    if (!sectionVisible(sec, state.answers)) return;
    list.push(idx);
  });
  state.visibleSectionIdx = list;
  if (state.currentStep >= list.length) state.currentStep = list.length - 1;
}

function currentSection() {
  const secIdx = state.visibleSectionIdx[state.currentStep];
  return state.sections[secIdx];
}

// 選項值可能是數字（scale 題型）或字串，HTML 表單元件送回來的一律是字串，
// 這裡統一轉成字串再比較，避免「數字 4」跟「文字 "4"」被誤判成不相等。
// 注意：null（例如「我是第一年，無法比較」選項）轉成空字串 ''，
// 但「尚未作答」是 undefined，兩者必須分開處理，否則會誤判成該選項已被選取。
function valToStr(v) {
  return v === null ? '' : String(v);
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ------------------------------------------------------------
// 首頁：身分選擇
// ------------------------------------------------------------
function renderHome() {
  APP_ROOT.innerHTML = `
    <div class="home-screen">
      <div class="home-card">
        <h1>${escapeHtml(CONFIG.SURVEY_TITLE)}</h1>
        <p class="home-intro">${escapeHtml(CONFIG.SURVEY_INTRO)}</p>

        <div class="identity-prompt">請選擇您本次填答的身分</div>
        <div class="identity-grid" role="list">
          ${IDENTITY_OPTIONS.map(opt => `
            <button class="identity-card" role="listitem" data-identity="${opt.key}">
              <span class="identity-title">${escapeHtml(opt.title)}</span>
              <span class="identity-desc">${escapeHtml(opt.description)}</span>
              <span class="identity-arrow" aria-hidden="true">→</span>
            </button>
          `).join('')}
        </div>

        <p class="home-footnote">選擇身分後將自動進入對應的問卷內容。</p>
      </div>
    </div>
  `;

  APP_ROOT.querySelectorAll('.identity-card').forEach(btn => {
    btn.addEventListener('click', () => startSurvey(btn.dataset.identity));
  });
}

function startSurvey(identityKey) {
  state.identity = identityKey;
  state.sections = QUESTION_SETS[identityKey];
  state.answers = {};
  state.errors = {};
  state.currentStep = 0;
  computeVisibleSections();
  state.view = 'survey';
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ------------------------------------------------------------
// 問卷頁：題目渲染
// ------------------------------------------------------------
function renderQuestion(q) {
  const errorMsg = state.errors[q.field];
  const errorHtml = errorMsg ? `<div class="field-error" id="err-${q.field}">${escapeHtml(errorMsg)}</div>` : '';
  const requiredMark = q.required ? '<span class="required-mark">＊</span>' : '';

  let bodyHtml = '';

  switch (q.type) {
    case 'select': {
      const val = state.answers[q.field] || '';
      bodyHtml = `
        <select class="field-select" data-field="${q.field}" aria-describedby="${errorMsg ? 'err-' + q.field : ''}">
          <option value="" disabled ${val ? '' : 'selected'}>${escapeHtml(q.placeholder || '請選擇')}</option>
          ${q.options.map(o => `<option value="${escapeHtml(o.value)}" ${valToStr(val) === valToStr(o.value) ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('')}
        </select>
      `;
      break;
    }
    case 'radio':
    case 'scale': {
      const val = state.answers[q.field];
      bodyHtml = `
        <div class="option-list" role="radiogroup" aria-describedby="${errorMsg ? 'err-' + q.field : ''}">
          ${q.options.map((o, i) => {
            const optId = `${q.field}__${i}`;
            const checked = (val !== undefined) && (valToStr(val) === valToStr(o.value)) ? 'checked' : '';
            return `
              <label class="option-item" for="${optId}">
                <input type="radio" id="${optId}" name="${q.field}" value="${escapeHtml(o.value)}" data-field="${q.field}" data-type="radio" ${checked} />
                <span class="option-label">${escapeHtml(o.label)}</span>
              </label>
            `;
          }).join('')}
        </div>
      `;
      break;
    }
    case 'checkbox': {
      const val = Array.isArray(state.answers[q.field]) ? state.answers[q.field] : [];
      const otherChecked = state.answers[q.field + '_other_checked'] === true;
      const otherText = state.answers[q.field + '_other_text'] || '';
      bodyHtml = `
        <div class="option-list" aria-describedby="${errorMsg ? 'err-' + q.field : ''}">
          ${q.options.map((o, i) => {
            const optId = `${q.field}__${i}`;
            const checked = val.includes(o.value) ? 'checked' : '';
            return `
              <label class="option-item" for="${optId}">
                <input type="checkbox" id="${optId}" value="${escapeHtml(o.value)}" data-field="${q.field}" data-type="checkbox" ${checked} />
                <span class="option-label">${escapeHtml(o.label)}</span>
              </label>
            `;
          }).join('')}
          ${q.other ? `
            <label class="option-item option-item-other" for="${q.field}__other">
              <input type="checkbox" id="${q.field}__other" data-field="${q.field}" data-type="checkbox-other-toggle" ${otherChecked ? 'checked' : ''} />
              <span class="option-label">其他：</span>
              <input type="text" class="other-text-input" data-field="${q.field}" data-type="other-text" placeholder="請說明" value="${escapeHtml(otherText)}" ${otherChecked ? '' : 'disabled'} />
            </label>
          ` : ''}
        </div>
      `;
      break;
    }
    case 'textarea': {
      const val = state.answers[q.field] || '';
      bodyHtml = `
        <textarea class="field-textarea" data-field="${q.field}" rows="3" placeholder="請輸入您的想法；若無，請填寫「無」" aria-describedby="${errorMsg ? 'err-' + q.field : ''}">${escapeHtml(val)}</textarea>
      `;
      break;
    }
  }

  return `
    <div class="question-block ${errorMsg ? 'has-error' : ''}" data-question-field="${q.field}">
      <div class="question-label">
        <span class="qcode">${escapeHtml(q.qcode)}</span>
        <span class="qtext">${escapeHtml(q.label)}${requiredMark}</span>
      </div>
      ${bodyHtml}
      ${errorHtml}
    </div>
  `;
}

function renderSurvey() {
  const totalSteps = state.visibleSectionIdx.length;
  const sec = currentSection();
  const isLast = state.currentStep === totalSteps - 1;
  const isFirst = state.currentStep === 0;
  const progressPct = Math.round(((state.currentStep) / totalSteps) * 100) + Math.round((1 / totalSteps) * 30);

  APP_ROOT.innerHTML = `
    <div class="survey-screen">
      <div class="survey-header">
        <div class="survey-header-top">
          <span class="identity-chip">${escapeHtml(IDENTITY_LABELS[state.identity])}</span>
          <span class="step-indicator">第 ${state.currentStep + 1}／${totalSteps} 頁</span>
        </div>
        <div class="progress-track" role="progressbar" aria-valuenow="${progressPct}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-fill" style="width:${Math.min(progressPct, 100)}%"></div>
        </div>
      </div>

      <div class="survey-body">
        <h2 class="section-title">${escapeHtml(sec.title)}</h2>
        ${sec.description ? `<p class="section-desc">${escapeHtml(sec.description)}</p>` : ''}

        <div class="question-group">
          ${sec.questions.map(renderQuestion).join('')}
        </div>
      </div>

      <div class="survey-footer">
        <button class="btn btn-secondary" id="btn-prev">${isFirst ? '重新選擇身分' : '上一步'}</button>
        <button class="btn btn-primary" id="btn-next">${isLast ? '送出問卷' : '下一步'}</button>
      </div>
    </div>
  `;

  attachSurveyListeners(sec);
}

function attachSurveyListeners(sec) {
  // select
  APP_ROOT.querySelectorAll('select[data-field]').forEach(el => {
    el.addEventListener('change', () => {
      state.answers[el.dataset.field] = el.value;
      clearError(el.dataset.field);
    });
  });

  // radio
  APP_ROOT.querySelectorAll('input[type="radio"][data-field]').forEach(el => {
    el.addEventListener('change', () => {
      if (el.checked) {
        state.answers[el.dataset.field] = el.value;
        clearError(el.dataset.field);
        // 角色確認題（is_evaluator/is_evaluated/evaluator_mode）變動可能影響跳題邏輯，
        // 但不在此立即重算，等使用者按下一步再重新計算（見 goNext 內的 computeVisibleSections）
      }
    });
  });

  // checkbox
  APP_ROOT.querySelectorAll('input[type="checkbox"][data-type="checkbox"]').forEach(el => {
    el.addEventListener('change', () => {
      const field = el.dataset.field;
      const cur = Array.isArray(state.answers[field]) ? state.answers[field].slice() : [];
      if (el.checked) {
        if (!cur.includes(el.value)) cur.push(el.value);
      } else {
        const idx = cur.indexOf(el.value);
        if (idx > -1) cur.splice(idx, 1);
      }
      state.answers[field] = cur;
      clearError(field);
    });
  });

  // checkbox "other" toggle
  APP_ROOT.querySelectorAll('input[data-type="checkbox-other-toggle"]').forEach(el => {
    el.addEventListener('change', () => {
      const field = el.dataset.field;
      state.answers[field + '_other_checked'] = el.checked;
      const textInput = APP_ROOT.querySelector(`input[data-type="other-text"][data-field="${field}"]`);
      if (textInput) {
        textInput.disabled = !el.checked;
        if (el.checked) textInput.focus();
      }
      clearError(field);
    });
  });

  // other text
  APP_ROOT.querySelectorAll('input[data-type="other-text"]').forEach(el => {
    el.addEventListener('input', () => {
      state.answers[el.dataset.field + '_other_text'] = el.value;
      clearError(el.dataset.field);
    });
  });

  // textarea
  APP_ROOT.querySelectorAll('textarea[data-field]').forEach(el => {
    el.addEventListener('input', () => {
      state.answers[el.dataset.field] = el.value;
    });
  });

  document.getElementById('btn-prev').addEventListener('click', goPrev);
  document.getElementById('btn-next').addEventListener('click', goNext);
}

function clearError(field) {
  if (state.errors[field]) {
    delete state.errors[field];
    const block = APP_ROOT.querySelector(`[data-question-field="${field}"]`);
    if (block) {
      block.classList.remove('has-error');
      const errEl = block.querySelector('.field-error');
      if (errEl) errEl.remove();
    }
  }
}

// ------------------------------------------------------------
// 驗證
// ------------------------------------------------------------
function validateCurrentSection() {
  const sec = currentSection();
  const errors = {};
  let firstErrorField = null;

  sec.questions.forEach(q => {
    if (!q.required) {
      // 即使非必填，若複選題勾選了「其他」但沒填文字，仍視為錯誤
      if (q.type === 'checkbox' && q.other) {
        const otherChecked = state.answers[q.field + '_other_checked'] === true;
        const otherText = (state.answers[q.field + '_other_text'] || '').trim();
        if (otherChecked && !otherText) {
          errors[q.field] = '請填寫「其他」欄位的說明內容';
          if (!firstErrorField) firstErrorField = q.field;
        }
      }
      return;
    }

    const val = state.answers[q.field];
    let empty = false;

    if (q.type === 'select') {
      // select 的預設（尚未選擇）狀態值就是空字串，維持原本判斷方式
      empty = val === undefined || val === null || val === '';
    } else if (q.type === 'radio' || q.type === 'scale') {
      // scale 題型可能有選項的值本身就是空字串（例如「我是第一年，無法比較」），
      // 所以只用「有沒有作答過」（undefined）來判斷，不能用是否為空字串判斷。
      empty = val === undefined;
    } else if (q.type === 'checkbox') {
      const arr = Array.isArray(val) ? val : [];
      const otherChecked = state.answers[q.field + '_other_checked'] === true;
      empty = arr.length === 0 && !otherChecked;
    } else if (q.type === 'textarea') {
      empty = !val || String(val).trim() === '';
    }

    if (empty) {
      errors[q.field] = q.type === 'textarea'
        ? '此題為必填，若無請填寫「無」'
        : '此題為必填，請完成作答';
      if (!firstErrorField) firstErrorField = q.field;
    }

    if (q.type === 'checkbox' && q.other) {
      const otherChecked = state.answers[q.field + '_other_checked'] === true;
      const otherText = (state.answers[q.field + '_other_text'] || '').trim();
      if (otherChecked && !otherText) {
        errors[q.field] = '請填寫「其他」欄位的說明內容';
        if (!firstErrorField) firstErrorField = q.field;
      }
    }
  });

  state.errors = errors;
  return { valid: Object.keys(errors).length === 0, firstErrorField };
}

function goPrev() {
  if (state.currentStep > 0) {
    state.currentStep -= 1;
    state.errors = {};
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // 在第一頁按「重新選擇身分」：回到首頁，清空本次已填寫的答案
    state.view = 'home';
    state.identity = null;
    state.sections = [];
    state.visibleSectionIdx = [];
    state.currentStep = 0;
    state.answers = {};
    state.errors = {};
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function goNext() {
  const { valid, firstErrorField } = validateCurrentSection();
  if (!valid) {
    render();
    const el = APP_ROOT.querySelector(`[data-question-field="${firstErrorField}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // 重新計算可見 section（角色可能剛在本頁選定，影響後續是否跳過面談段落）
  computeVisibleSections();

  const totalSteps = state.visibleSectionIdx.length;
  const isLast = state.currentStep === totalSteps - 1;

  if (isLast) {
    submitSurvey();
  } else {
    state.currentStep += 1;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ------------------------------------------------------------
// 送出資料
// ------------------------------------------------------------
function buildPayload() {
  const payload = {
    timestamp: new Date().toISOString(),
    identity: IDENTITY_LABELS[state.identity],
    identity_key: state.identity
  };

  state.sections.forEach(sec => {
    sec.questions.forEach(q => {
      const raw = state.answers[q.field];

      if (q.type === 'scale') {
        const opt = (raw !== undefined) ? q.options.find(o => valToStr(o.value) === valToStr(raw)) : undefined;
        payload[q.field + '_label'] = opt ? opt.label : '';
        payload[q.field + '_score'] = opt && opt.value !== null ? opt.value : '';
      } else if (q.type === 'checkbox') {
        const arr = Array.isArray(raw) ? raw.slice() : [];
        const otherChecked = state.answers[q.field + '_other_checked'] === true;
        const otherText = (state.answers[q.field + '_other_text'] || '').trim();
        if (otherChecked && otherText) arr.push('其他：' + otherText);
        payload[q.field] = arr.join('；');
        payload[q.field + '_other_text'] = otherChecked ? otherText : '';

        // 每個選項各自獨立一欄，勾選=1、未勾選=0，方便直接加總/計數，
        // 不需要再對合併文字欄位做文字比對。
        q.options.forEach(o => {
          if (!o.key) return; // 保險：沒設定 key 的選項就不特別拆欄位
          payload[q.field + '__' + o.key] = raw && Array.isArray(raw) && raw.includes(o.value) ? 1 : 0;
        });
        if (q.other) {
          payload[q.field + '__other_flag'] = otherChecked ? 1 : 0;
        }
      } else {
        payload[q.field] = raw !== undefined && raw !== null ? raw : '';
      }
    });
  });

  return payload;
}

function submitSurvey() {
  state.view = 'submitting';
  render();

  const payload = buildPayload();

  if (!CONFIG.GAS_WEB_APP_URL || CONFIG.GAS_WEB_APP_URL.indexOf('PASTE_YOUR') === 0) {
    // 尚未設定後端網址：仍讓使用者看到完成頁，但於主控台提示開發者
    console.warn('尚未設定 CONFIG.GAS_WEB_APP_URL，資料未送出到 Google Sheets。', payload);
    state.view = 'done';
    render();
    return;
  }

  fetch(CONFIG.GAS_WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json().catch(() => ({ result: 'success' })))
    .then(() => {
      state.view = 'done';
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    })
    .catch(err => {
      console.error('送出失敗：', err);
      state.view = 'error';
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ------------------------------------------------------------
// 送出中 / 完成頁 / 錯誤頁
// ------------------------------------------------------------
function renderSubmitting() {
  APP_ROOT.innerHTML = `
    <div class="status-screen">
      <div class="spinner" aria-hidden="true"></div>
      <p>正在送出您的回覆，請稍候...</p>
    </div>
  `;
}

function renderDone() {
  APP_ROOT.innerHTML = `
    <div class="status-screen">
      <div class="done-icon" aria-hidden="true">✓</div>
      <h2>✨ 謝謝你留下這份回饋</h2>
      <p>你的每一個想法，我們都會認真看見，\n也會成為 HR 持續優化績效考核的重要參考。\n\n謝謝你的參與與分享，\n讓我們一起把制度做得更貼近大家的需要 💛</p>
      <p class="signature">人資部 敬上</p>
    </div>
  `;
}

function renderErrorScreen() {
  APP_ROOT.innerHTML = `
    <div class="status-screen">
      <div class="error-icon" aria-hidden="true">!</div>
      <h2>送出時發生問題</h2>
      <p>網路連線可能不穩定，請確認網路狀態後再試一次。</p>
      <button class="btn btn-primary" id="btn-retry">重新送出</button>
    </div>
  `;
  document.getElementById('btn-retry').addEventListener('click', submitSurvey);
}

// ------------------------------------------------------------
// 總渲染入口
// ------------------------------------------------------------
function render() {
  if (state.view === 'home') renderHome();
  else if (state.view === 'survey') renderSurvey();
  else if (state.view === 'submitting') renderSubmitting();
  else if (state.view === 'done') renderDone();
  else if (state.view === 'error') renderErrorScreen();
}

render();
