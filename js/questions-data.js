/**
 * questions-data.js
 * ------------------------------------------------------------
 * 115年度績效考核流程回饋問卷 —— 題目資料定義檔
 *
 * 這是整個系統「唯一」需要在改題目時修改的檔案。
 * UI（app.js）會依照這裡的結構自動產生頁面、進度條、驗證規則，
 * 並自動產生要寫入 Google Sheets 的欄位。
 *
 * ------------------------------------------------------------
 * 資料結構說明
 * ------------------------------------------------------------
 * QUESTION_SETS = {
 *   employee:   [ section, section, ... ],   // 一般同仁
 *   manager:    [ section, section, ... ],   // 主管（直屬／二層）
 *   l1manager:  [ section, section, ... ]    // 一階主管
 * }
 *
 * section = {
 *   title: '第一部分｜基本資訊',
 *   questions: [ question, question, ... ]
 * }
 *
 * question = {
 *   field:    'schedule_reasonable',   // 寫入 Google Sheet 的固定欄位名稱
 *   qcode:    'Q2',                    // 對應原始問卷題號（供 HR 對照紙本題目用）
 *   type:     'select' | 'radio' | 'scale' | 'checkbox' | 'textarea',
 *   label:    '題目文字',
 *   required: true / false,
 *   options:  [ { label: '選項文字', value: 4 }, ... ]   // select/radio/scale/checkbox 用
 *   other:    true / false             // checkbox 是否含「其他：___」
 *   showIf:   { field: 'role', notEquals: '...' }  // 條件顯示（跳題邏輯）
 * }
 *
 * type 說明：
 *   - select   : 下拉選單（單選，無分數）
 *   - radio    : 單選題（無分數，例如角色類別）
 *   - scale    : 單選題，但每個選項附數值分數（供統計平均分用）
 *   - checkbox : 複選題（可能含「其他」開放欄位）
 *   - textarea : 開放式文字題
 * ------------------------------------------------------------
 */

// ============================================================
// 共用：部門清單（下拉選單）
// ============================================================
const DEPARTMENTS = [
  '管理部', '財務部', '人資部', '業務部', '工務部', '儀電部', '設計部',
  '市場開發', '研發中心', '實驗室', '廠務部', '製造部', '技服部', '職安室',
  '專案工程', '資訊室', '產品技術中心', '第二事業部', '第一事業部',
  '總管理處', '董事長室', '總工程師室', '苗栗工廠'
];

const DEPARTMENT_QUESTION = {
  field: 'department',
  qcode: 'Q_dept',
  type: 'select',
  label: '您的所屬單位',
  required: true,
  options: DEPARTMENTS.map(d => ({ label: d, value: d })),
  placeholder: '請選擇所屬單位'
};

// ============================================================
// 共用子題組（三份問卷中文字完全相同的題目，共用同一組 field，
// 方便日後跨身分別合併統計）
// ============================================================

const Q_SCHEDULE_REASONABLE = (qcode) => ({
  field: 'schedule_reasonable',
  qcode,
  type: 'scale',
  label: '整體考核流程的時間安排是否合理？',
  required: true,
  options: [
    { label: '非常合理', value: 4 },
    { label: '大致合理', value: 3 },
    { label: '有些趕', value: 2 },
    { label: '明顯不合理', value: 1 }
  ]
});

const Q_HR_COMM_CLEAR = (qcode) => ({
  field: 'hr_communication_clear',
  qcode,
  type: 'scale',
  label: '人資部在流程中的溝通（通知、說明、提醒）是否清楚？',
  required: true,
  options: [
    { label: '非常清楚，知道每一步該做什麼', value: 4 },
    { label: '大致清楚，偶爾需要再確認', value: 3 },
    { label: '不太清楚，常常不確定下一步', value: 2 },
    { label: '很不清楚', value: 1 }
  ]
});

const Q_HR_COMM_UNCLEAR_OPEN = (qcode) => ({
  field: 'hr_communication_unclear_detail',
  qcode,
  type: 'textarea',
  label: '如果溝通上有不清楚的地方，具體是哪個環節？',
  required: true
});

const Q_RATING_ITEMS_CLEAR = (qcode) => ({
  field: 'rating_items_clear',
  qcode,
  type: 'scale',
  label: '評分項目（各維度）是否容易理解？',
  required: true,
  options: [
    { label: '都很清楚', value: 4 },
    { label: '大部分清楚，少數項目不確定怎麼評', value: 3 },
    { label: '有好幾個項目不太確定意思', value: 2 },
    { label: '整體來說很難理解', value: 1 }
  ]
});

const Q_RATING_ITEMS_UNCLEAR_OPEN = (qcode) => ({
  field: 'rating_items_unclear_detail',
  qcode,
  type: 'textarea',
  label: '如果有不清楚的評分項目，請列出是哪些（或描述哪類）：',
  required: true
});

const Q_FIVE_LEVEL_CLEAR = (qcode) => ({
  field: 'five_level_standard_clear',
  qcode,
  type: 'scale',
  label: '五級評分標準（A / B+ / B / B- / C+）的區分是否清楚？',
  required: true,
  options: [
    { label: '很清楚，能判斷每個等級的差異', value: 4 },
    { label: '大致清楚，但相鄰等級（例如 B 和 B+）不太好區分', value: 3 },
    { label: '不太清楚，評分時常猶豫', value: 2 },
    { label: '完全不清楚', value: 1 }
  ]
});

const Q_SELF_EVAL_CLEAR = (qcode) => ({
  field: 'self_eval_clarity',
  qcode,
  type: 'scale',
  label: '撰寫員工自評時，您是否清楚該寫什麼？',
  required: true,
  options: [
    { label: '非常清楚', value: 4 },
    { label: '大致知道，但不確定要寫多詳細', value: 3 },
    { label: '不太清楚，有點不知道從何下手', value: 2 },
    { label: '完全不清楚', value: 1 }
  ]
});

const Q_SELF_EVAL_FORM_HELPFUL = (qcode) => ({
  field: 'self_eval_form_helpful',
  qcode,
  type: 'scale',
  label: '您覺得自評表的設計（題目、格式、引導語）是否有幫助？',
  required: true,
  options: [
    { label: '很有幫助，引導我回顧了整年的工作', value: 4 },
    { label: '有些幫助', value: 3 },
    { label: '沒什麼幫助，填完也不確定有沒有反映真實表現', value: 2 },
    { label: '反而造成困擾', value: 1 }
  ]
});

// 接受主管面談（被面談者角度）— 員工版與主管版文字完全相同
const Q_INTERVIEW_RECEIVED_DURATION = (qcode) => ({
  field: 'interview_received_duration',
  qcode,
  type: 'radio',
  label: '您與您的主管進行的績效面談，大約進行了多久？',
  required: true,
  options: [
    { label: '30 分鐘以內', value: '30分鐘以內' },
    { label: '30–60 分鐘', value: '30-60分鐘' },
    { label: '60–90 分鐘', value: '60-90分鐘' },
    { label: '90 分鐘以上', value: '90分鐘以上' },
    { label: '沒有進行面談', value: '沒有進行面談' }
  ]
});

const Q_INTERVIEW_RECEIVED_QUALITY = (qcode) => ({
  field: 'interview_received_quality',
  qcode,
  type: 'scale',
  label: '面談過程中，您覺得雙方的溝通品質如何？',
  required: true,
  options: [
    { label: '很好，有充分的對話和回饋', value: 4 },
    { label: '還可以，但有些地方講得不夠深', value: 3 },
    { label: '不太好，感覺像是走流程', value: 2 },
    { label: '很差 / 不願意評論', value: 1 }
  ]
});

const Q_INTERVIEW_RECEIVED_GOAL_CLEAR = (qcode) => ({
  field: 'interview_received_goal_clarity',
  qcode,
  type: 'scale',
  label: '面談結束後，您是否清楚自己下一期的工作目標或改善方向？',
  required: true,
  options: [
    { label: '非常清楚', value: 4 },
    { label: '大致清楚', value: 3 },
    { label: '不太清楚', value: 2 },
    { label: '完全不清楚', value: 1 }
  ]
});

// 整體回饋（開放題，兩版文字相同）
const Q_OVERALL_BEST_OPEN = (qcode) => ({
  field: 'overall_best_open',
  qcode,
  type: 'textarea',
  label: '本次考核流程中，您覺得做得最好的一件事是什麼？',
  required: true
});

const Q_OVERALL_IMPROVE_OPEN = (qcode) => ({
  field: 'overall_improve_open',
  qcode,
  type: 'textarea',
  label: '如果明年只能改一件事，您最希望改的是什麼？',
  required: true
});

const Q_OVERALL_OTHER_OPEN = (qcode) => ({
  field: 'overall_other_open',
  qcode,
  type: 'textarea',
  label: '其他想法或建議：',
  required: true
});

// ============================================================
// 一般同仁版（原：基層員工版）
// ============================================================
const EMPLOYEE_SURVEY = [
  {
    title: '第一部分｜基本資訊',
    questions: [
      { ...DEPARTMENT_QUESTION, qcode: 'Q1' }
    ]
  },
  {
    title: '第二部分｜流程與時程',
    questions: [
      Q_SCHEDULE_REASONABLE('Q2'),
      {
        field: 'schedule_bottleneck',
        qcode: 'Q3',
        type: 'checkbox',
        label: '如果您覺得時間安排有問題，最卡的環節是哪個？（可複選）',
        required: true,
        options: [
          { label: '員工自評撰寫時間不夠', value: '員工自評撰寫時間不夠' },
          { label: '績效面談排程困難', value: '績效面談排程困難' },
          { label: '等待主管評分的時間太長', value: '等待主管評分的時間太長' },
          { label: '表單/系統操作花太多時間', value: '表單/系統操作花太多時間' }
        ],
        other: true
      },
      Q_HR_COMM_CLEAR('Q4'),
      Q_HR_COMM_UNCLEAR_OPEN('Q5')
    ]
  },
  {
    title: '第三部分｜評分制度',
    questions: [
      Q_RATING_ITEMS_CLEAR('Q6'),
      Q_RATING_ITEMS_UNCLEAR_OPEN('Q7'),
      Q_FIVE_LEVEL_CLEAR('Q8')
    ]
  },
  {
    title: '第四部分｜員工自評',
    questions: [
      Q_SELF_EVAL_CLEAR('Q9'),
      Q_SELF_EVAL_FORM_HELPFUL('Q10')
    ]
  },
  {
    title: '第五部分｜您接受主管的面談',
    description: '此部分詢問您本次作為被評核者，與您的直屬主管進行績效面談的經驗。若本次未進行，請跳過本部分。',
    questions: [
      Q_INTERVIEW_RECEIVED_DURATION('Q18'),
      Q_INTERVIEW_RECEIVED_QUALITY('Q19'),
      Q_INTERVIEW_RECEIVED_GOAL_CLEAR('Q20')
    ]
  },
  {
    title: '第六部分｜整體回饋',
    questions: [
      {
        field: 'overall_compare',
        qcode: 'Q11',
        type: 'scale',
        label: '和過去的考核方式相比（如果您有經歷過），今年的新制度整體而言：',
        required: true,
        options: [
          { label: '明顯比以前好', value: 4 },
          { label: '有進步，但還有改善空間', value: 3 },
          { label: '差不多', value: 2 },
          { label: '反而更麻煩了', value: 1 },
          { label: '我是第一年，無法比較', value: null }
        ]
      },
      Q_OVERALL_BEST_OPEN('Q12'),
      Q_OVERALL_IMPROVE_OPEN('Q13'),
      Q_OVERALL_OTHER_OPEN('Q14')
    ]
  }
];

// ============================================================
// 主管版（直屬主管＋二層主管）
// ============================================================
const MANAGER_ROLE_OPTIONS = [
  { label: '直屬主管（僅進行評分）', value: '直屬主管（僅進行評分）' },
  { label: '直屬主管（進行評分與面談）', value: '直屬主管（進行評分與面談）' },
  { label: '二層主管（進行評分與面談）', value: '二層主管（進行評分與面談）' },
  { label: '直屬＋二層主管（同時為直屬與二層，進行評分與面談）', value: '直屬＋二層主管（同時為直屬與二層，進行評分與面談）' }
];

const Q_RATING_DIFFICULTY = (qcode) => ({
  field: 'rating_difficulty',
  qcode,
  type: 'checkbox',
  label: '您在評分時，覺得最困難的部分是什麼？（可複選）',
  required: true,
  options: [
    { label: '不確定怎麼區分相鄰等級', value: '不確定怎麼區分相鄰等級' },
    { label: '擔心評太高或太低會有後果', value: '擔心評太高或太低會有後果' },
    { label: '不確定評分結果會怎麼被使用', value: '不確定評分結果會怎麼被使用' },
    { label: '覺得某些評分項目和部屬實際工作不太相關', value: '覺得某些評分項目和部屬實際工作不太相關' },
    { label: '手上案例不夠，不確定怎麼給分', value: '手上案例不夠，不確定怎麼給分' }
  ],
  other: true
});

const Q_INTERVIEW_GIVEN_INTERACTION = (qcode) => ({
  field: 'interview_given_interaction',
  qcode,
  type: 'scale',
  label: '整體而言，您認為本次績效面談的互動與溝通情形如何？',
  required: true,
  options: [
    { label: '非常良好，多數同仁都能積極參與討論', value: 4 },
    { label: '良好，大多數同仁能參與並回應討論', value: 3 },
    { label: '普通，部分同仁較為被動，主要由主管引導', value: 2 },
    { label: '有待改善，多數面談以主管單方面說明為主', value: 1 }
  ]
});

const Q_INTERVIEW_GIVEN_HELPFUL = (qcode) => ({
  field: 'interview_given_helpful',
  qcode,
  type: 'scale',
  label: '整體而言，您認為本次績效面談是否有助於主管與部屬針對工作表現進行深入溝通？',
  required: true,
  options: [
    { label: '非常有幫助', value: 5 },
    { label: '有幫助', value: 4 },
    { label: '普通', value: 3 },
    { label: '幫助有限', value: 2 },
    { label: '沒有幫助', value: 1 }
  ]
});

const Q_INTERVIEW_GIVEN_GOAL_CLARITY = (qcode) => ({
  field: 'interview_given_goal_clarity',
  qcode,
  type: 'scale',
  label: '完成本次績效面談後，您認為部屬對於後續工作目標或改善方向的理解程度如何？',
  required: true,
  options: [
    { label: '非常清楚，多數同仁已能明確掌握', value: 4 },
    { label: '大致清楚，多數同仁了解主要方向', value: 3 },
    { label: '普通，部分同仁仍需要後續溝通', value: 2 },
    { label: '不太清楚，後續仍需要再進一步確認', value: 1 }
  ]
});

const Q_INTERVIEW_GIVEN_TOOL_HELPFUL = (qcode) => ({
  field: 'interview_given_tool_helpful',
  qcode,
  type: 'scale',
  label: '整體而言，您認為本次績效面談的流程與相關工具，對於進行面談是否有幫助？',
  required: true,
  options: [
    { label: '非常有幫助', value: 5 },
    { label: '有幫助', value: 4 },
    { label: '普通', value: 3 },
    { label: '幫助有限', value: 2 },
    { label: '沒有幫助', value: 1 }
  ]
});

const Q_INTERVIEW_GIVEN_IMPROVE_OPEN = (qcode) => ({
  field: 'interview_given_improve_open',
  qcode,
  type: 'textarea',
  label: '本次績效面談過程中，您認為最需要改善或獲得協助的地方是什麼？',
  required: true
});

const Q_OVERALL_COMPARE_MANAGER = (qcode) => ({
  field: 'overall_compare',
  qcode,
  type: 'scale',
  label: '和過去的考核方式相比（如果您有經歷過），今年的新制度整體而言：',
  required: true,
  options: [
    { label: '明顯比以前好', value: 4 },
    { label: '有進步，但還有改善空間', value: 3 },
    { label: '差不多', value: 2 },
    { label: '反而更麻煩了', value: 1 },
    { label: '我是第一年，無法比較', value: null }
  ]
});

const MANAGER_SURVEY = [
  {
    title: '第一部分｜基本資訊',
    questions: [
      {
        field: 'role_detail',
        qcode: 'Q1',
        type: 'radio',
        label: '您在本次考核中的角色',
        required: true,
        options: MANAGER_ROLE_OPTIONS
      },
      { ...DEPARTMENT_QUESTION, qcode: 'Q2' }
    ]
  },
  {
    title: '第二部分｜流程與時程',
    questions: [
      Q_SCHEDULE_REASONABLE('Q3'),
      {
        field: 'schedule_bottleneck',
        qcode: 'Q4',
        type: 'checkbox',
        label: '如果您覺得時間安排有問題，最卡的環節是哪個？（可複選）',
        required: true,
        options: [
          { label: '員工自評撰寫時間不夠', value: '員工自評撰寫時間不夠' },
          { label: '主管評分時間不夠', value: '主管評分時間不夠' },
          { label: '績效面談排程困難', value: '績效面談排程困難' },
          { label: '等待二層主管評分的時間太長', value: '等待二層主管評分的時間太長' },
          { label: '表單/系統操作花太多時間', value: '表單/系統操作花太多時間' }
        ],
        other: true
      },
      Q_HR_COMM_CLEAR('Q5'),
      Q_HR_COMM_UNCLEAR_OPEN('Q6')
    ]
  },
  {
    title: '第三部分｜評分制度',
    questions: [
      Q_RATING_ITEMS_CLEAR('Q7'),
      Q_RATING_ITEMS_UNCLEAR_OPEN('Q8'),
      Q_FIVE_LEVEL_CLEAR('Q9'),
      Q_RATING_DIFFICULTY('Q10')
    ]
  },
  {
    title: '第四部分｜員工自評',
    questions: [
      Q_SELF_EVAL_CLEAR('Q11'),
      Q_SELF_EVAL_FORM_HELPFUL('Q12')
    ]
  },
  {
    title: '第五部分｜您對部屬的面談（面談者角度）',
    description: '若您於「您在本次考核中的角色」選擇「直屬主管（僅進行評分）」，本次無需進行面談，請跳過本部分，直接前往下一部分。',
    // 跳題邏輯：role_detail 為「直屬主管（僅進行評分）」時，整個 section 略過
    skipIf: { field: 'role_detail', equals: '直屬主管（僅進行評分）' },
    questions: [
      Q_INTERVIEW_GIVEN_INTERACTION('Q13'),
      Q_INTERVIEW_GIVEN_HELPFUL('Q14'),
      Q_INTERVIEW_GIVEN_GOAL_CLARITY('Q15'),
      Q_INTERVIEW_GIVEN_TOOL_HELPFUL('Q16'),
      Q_INTERVIEW_GIVEN_IMPROVE_OPEN('Q17')
    ]
  },
  {
    title: '第六部分｜您接受主管的面談（被面談者角度）',
    description: '此部分詢問您本次作為被評核者，與您的直屬主管進行績效面談的經驗。',
    questions: [
      Q_INTERVIEW_RECEIVED_DURATION('Q18'),
      Q_INTERVIEW_RECEIVED_QUALITY('Q19'),
      Q_INTERVIEW_RECEIVED_GOAL_CLEAR('Q20')
    ]
  },
  {
    title: '第七部分｜整體回饋',
    questions: [
      Q_OVERALL_COMPARE_MANAGER('Q21'),
      Q_OVERALL_BEST_OPEN('Q22'),
      Q_OVERALL_IMPROVE_OPEN('Q23'),
      Q_OVERALL_OTHER_OPEN('Q24')
    ]
  }
];

// ============================================================
// 一階主管版
// ============================================================
const L1MANAGER_SURVEY = [
  {
    title: '第一部分｜基本資訊',
    questions: [
      {
        field: 'role_detail',
        qcode: 'Q1',
        type: 'radio',
        label: '您在本次考核中的角色',
        required: true,
        options: [
          { label: '一階主管', value: '一階主管' }
        ]
      },
      { ...DEPARTMENT_QUESTION, qcode: 'Q2' }
    ]
  },
  {
    title: '第二部分｜流程與時程',
    questions: [
      Q_SCHEDULE_REASONABLE('Q3'),
      {
        field: 'schedule_bottleneck',
        qcode: 'Q4',
        type: 'checkbox',
        label: '如果您覺得時間安排有問題，最卡的環節是哪個？（可複選）',
        required: true,
        options: [
          { label: '員工自評撰寫時間不夠', value: '員工自評撰寫時間不夠' },
          { label: '主管評分時間不夠', value: '主管評分時間不夠' },
          { label: '績效面談排程困難', value: '績效面談排程困難' },
          { label: '等待二層主管評分的時間太長', value: '等待二層主管評分的時間太長' },
          { label: '表單/系統操作花太多時間', value: '表單/系統操作花太多時間' }
        ],
        other: true
      },
      Q_HR_COMM_CLEAR('Q5'),
      Q_HR_COMM_UNCLEAR_OPEN('Q6')
    ]
  },
  {
    title: '第三部分｜評分制度',
    questions: [
      Q_RATING_ITEMS_CLEAR('Q7'),
      Q_RATING_ITEMS_UNCLEAR_OPEN('Q8'),
      Q_FIVE_LEVEL_CLEAR('Q9'),
      Q_RATING_DIFFICULTY('Q10')
    ]
  },
  {
    title: '第四部分｜員工自評',
    questions: [
      Q_SELF_EVAL_CLEAR('Q11'),
      Q_SELF_EVAL_FORM_HELPFUL('Q12')
    ]
  },
  {
    title: '第五部分｜您對部屬的面談',
    questions: [
      Q_INTERVIEW_GIVEN_INTERACTION('Q13'),
      Q_INTERVIEW_GIVEN_HELPFUL('Q14'),
      Q_INTERVIEW_GIVEN_GOAL_CLARITY('Q15'),
      Q_INTERVIEW_GIVEN_TOOL_HELPFUL('Q16'),
      Q_INTERVIEW_GIVEN_IMPROVE_OPEN('Q17')
    ]
  },
  {
    title: '第七部分｜整體回饋',
    questions: [
      Q_OVERALL_COMPARE_MANAGER('Q21'),
      Q_OVERALL_BEST_OPEN('Q22'),
      Q_OVERALL_IMPROVE_OPEN('Q23'),
      Q_OVERALL_OTHER_OPEN('Q24')
    ]
  }
];

// ============================================================
// 身分選擇（首頁顯示用文字，不出現 HR 內部命名）
// ============================================================
const IDENTITY_OPTIONS = [
  {
    key: 'employee',
    title: '一般同仁',
    description: '不具主管職，本次考核以被評核者身分參與',
    survey: 'employee'
  },
  {
    key: 'manager',
    title: '主管（直屬／二層主管）',
    description: '本次考核擔任直屬主管或二層主管，負責評分或面談',
    survey: 'manager'
  },
  {
    key: 'l1manager',
    title: '一階主管',
    description: '單位最高層級主管',
    survey: 'l1manager'
  }
];

const QUESTION_SETS = {
  employee: EMPLOYEE_SURVEY,
  manager: MANAGER_SURVEY,
  l1manager: L1MANAGER_SURVEY
};

const IDENTITY_LABELS = {
  employee: '一般同仁',
  manager: '主管（直屬／二層主管）',
  l1manager: '一階主管'
};
