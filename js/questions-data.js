/**
 * questions-data.js
 * ------------------------------------------------------------
 * 115年度績效考核流程回饋問卷 —— 題目資料定義檔（V2 重構版）
 *
 * V2 重構重點：
 *   1. 問卷版本改為「一般員工 / 初階主管 / 中高階主管」三種，
 *      依填答者的職務／管理層級區分，不是依「是否有評核他人」區分。
 *   2. 初階主管、中高階主管版進入後，先詢問角色確認題（是否評核他人 /
 *      是否接受主管評核 / 參與方式），再依回答條件顯示對應題組。
 *      同一人可能同時是評核者、面談者、被評核者，三個題組互不排斥。
 *   3. 中高階主管版額外增加「管理制度與組織層級」題組。
 *   4. 全站量表題統一 4 點量表（不再使用 5 點量表），
 *      「新舊制度比較」題的「我是第一年，無法比較」是跳脫量表外的
 *      不適用選項，不算在 4 點量表級距內。
 *
 * 這是整個系統「唯一」需要在改題目時修改的檔案。
 * UI（app.js）會依照這裡的結構自動產生頁面、進度條、驗證規則、
 * 條件分流，並自動產生要寫入 Google Sheets 的欄位。
 *
 * ------------------------------------------------------------
 * 資料結構說明
 * ------------------------------------------------------------
 * QUESTION_SETS = {
 *   employee:        [ section, section, ... ],   // 一般員工
 *   junior_manager:  [ section, section, ... ],   // 初階主管（領班～副理級）
 *   senior_manager:  [ section, section, ... ]    // 中高階主管（經理級以上）
 * }
 *
 * section = {
 *   title: '第一部分｜基本資訊',
 *   description: '（選填）題組說明',
 *   showIf: [ { field: 'is_evaluator', equals: '是' }, ... ],  // 可省略；
 *            // 有多個條件時彼此為「且」的關係，全部成立才顯示本題組
 *   questions: [ question, question, ... ]
 * }
 *
 * question = {
 *   field:    'schedule_reasonable',   // 寫入 Google Sheet 的固定欄位名稱
 *   qcode:    'Q2',                    // 供人員內部對照用的題號
 *   type:     'select' | 'radio' | 'scale' | 'checkbox' | 'textarea',
 *   label:    '題目文字',
 *   required: true / false,
 *   options:  [ { label: '選項文字', value: 4, key: 'xxx' }, ... ]
 *   other:    true / false             // checkbox 是否含「其他：___」
 * }
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
// 共用子題組（三份問卷中文字相同的題目，共用同一組 field，
// 方便日後跨身分別合併統計）—— 全部統一 4 點量表
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

const Q_SELF_EVAL_CONCERN_OPEN = (qcode) => ({
  field: 'self_eval_concern_open',
  qcode,
  type: 'textarea',
  label: '在填寫自評、或面對今年考核的過程中，有沒有讓您感到不確定、擔心、或希望公司未來能說明得更清楚的地方？',
  required: true
});

// 接受主管面談（被評核者角度）—— 三版文字相同
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
    { label: '很差', value: 1 },
    { label: '不願意評論', value: null }
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

// 整體回饋（共通）
const Q_OVERALL_COMPARE = (qcode) => ({
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
// 角色確認題組（初階主管／中高階主管共用）
// ============================================================
const Q_IS_EVALUATOR = (qcode) => ({
  field: 'is_evaluator',
  qcode,
  type: 'radio',
  label: '本次績效考核中，您是否有評核其他同仁？',
  required: true,
  options: [
    { label: '是', value: '是' },
    { label: '否', value: '否' }
  ]
});

const Q_IS_EVALUATED = (qcode) => ({
  field: 'is_evaluated',
  qcode,
  type: 'radio',
  label: '本次績效考核中，您是否有接受主管評核？',
  required: true,
  options: [
    { label: '是', value: '是' },
    { label: '否', value: '否' }
  ]
});

const Q_EVALUATOR_MODE = (qcode) => ({
  field: 'evaluator_mode',
  qcode,
  type: 'radio',
  label: '您本次對部屬的參與方式：',
  required: true,
  options: [
    { label: '僅進行評分', value: '僅進行評分' },
    { label: '評分＋績效面談', value: '評分＋績效面談' }
  ]
});

// ============================================================
// 評核他人題組（初階／中高階主管，僅 is_evaluator=是 時顯示）
// ============================================================
const Q_RATING_DIFFICULTY = (qcode) => ({
  field: 'rating_difficulty',
  qcode,
  type: 'checkbox',
  label: '您在評分時，覺得最困難的部分是什麼？（可複選）',
  required: true,
  options: [
    { label: '不確定怎麼區分相鄰等級', value: '不確定怎麼區分相鄰等級', key: 'grade_boundary' },
    { label: '擔心評太高或太低會有後果', value: '擔心評太高或太低會有後果', key: 'consequence_worry' },
    { label: '不確定評分結果會怎麼被使用', value: '不確定評分結果會怎麼被使用', key: 'usage_unclear' },
    { label: '覺得某些評分項目和部屬實際工作不太相關', value: '覺得某些評分項目和部屬實際工作不太相關', key: 'relevance_low' },
    { label: '手上案例不夠，不確定怎麼給分', value: '手上案例不夠，不確定怎麼給分', key: 'insufficient_cases' }
  ],
  other: true
});

// ============================================================
// 面談者角度題組（is_evaluator=是 且 evaluator_mode=評分＋績效面談 時顯示）
// ============================================================
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
    { label: '非常有幫助', value: 4 },
    { label: '有幫助', value: 3 },
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

// 原本合併的「面談流程與相關工具是否有幫助」拆成兩題，各自獨立評估
const Q_INTERVIEW_PROCESS_HELPFUL = (qcode) => ({
  field: 'interview_process_helpful',
  qcode,
  type: 'scale',
  label: '整體而言，您認為本次績效面談的「流程安排」（例如面談時間、時機、準備方式）是否有幫助？',
  required: true,
  options: [
    { label: '非常有幫助', value: 4 },
    { label: '有幫助', value: 3 },
    { label: '幫助有限', value: 2 },
    { label: '沒有幫助', value: 1 }
  ]
});

const Q_INTERVIEW_TOOL_HELPFUL = (qcode) => ({
  field: 'interview_tool_helpful',
  qcode,
  type: 'scale',
  label: '整體而言，您認為本次績效面談使用的「工具或系統」（例如面談紀錄表、評核系統）是否有幫助？',
  required: true,
  options: [
    { label: '非常有幫助', value: 4 },
    { label: '有幫助', value: 3 },
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

// ============================================================
// 中高階主管專屬：管理制度與組織層級題組
// ============================================================
const Q_MGMT_STANDARD_CLARITY = (qcode) => ({
  field: 'mgmt_standard_consistency',
  qcode,
  type: 'scale',
  label: '以您目前負責的部門來看，您認為主管在進行績效評核時，是否能清楚掌握評核標準？',
  required: true,
  options: [
    { label: '非常清楚，評核時很容易依照標準判斷', value: 4 },
    { label: '大致清楚，少部分情況需要再討論', value: 3 },
    { label: '不太清楚，有些情況不容易判斷', value: 2 },
    { label: '很不清楚，實際評核時常不知道該如何判斷', value: 1 }
  ]
});

const Q_MGMT_DEPT_EXECUTION = (qcode) => ({
  field: 'mgmt_dept_execution_consistency',
  qcode,
  type: 'scale',
  label: '以您目前負責的部門來看，績效考核在實際執行時是否順利？',
  required: true,
  options: [
    { label: '非常順利，主管與同仁都能依照流程進行', value: 4 },
    { label: '大致順利，偶爾需要協助或說明', value: 3 },
    { label: '有一些困難，部分環節容易卡住', value: 2 },
    { label: '不太順利，執行過程中常遇到問題', value: 1 }
  ]
});

const Q_MGMT_SYSTEM_HELPFULNESS = (qcode) => ({
  field: 'mgmt_system_helpfulness',
  qcode,
  type: 'scale',
  label: '以您目前負責的部門來看，這套績效考核制度對您了解部屬表現及進行團隊管理有多少幫助？',
  required: true,
  options: [
    { label: '非常有幫助', value: 4 },
    { label: '有幫助', value: 3 },
    { label: '幫助有限', value: 2 },
    { label: '沒有幫助', value: 1 }
  ]
});

const Q_MGMT_TALENT_DEV_LINK = (qcode) => ({
  field: 'mgmt_talent_dev_link',
  qcode,
  type: 'scale',
  label: '以您目前負責的部門來看，績效考核結果是否能幫助您了解部屬需要加強或發展的方向？',
  required: true,
  options: [
    { label: '非常有幫助，可以明確作為培育與發展的參考', value: 4 },
    { label: '有幫助，但還可以再加強', value: 3 },
    { label: '幫助有限，考核結果與實際培育較少連結', value: 2 },
    { label: '沒有幫助，目前兩者幾乎沒有關聯', value: 1 }
  ]
});

const Q_MGMT_IMPLEMENTATION_DIFFICULTY = (qcode) => ({
  field: 'mgmt_implementation_difficulty',
  qcode,
  type: 'scale',
  label: '以您目前負責的部門來看，執行這次績效考核時，最大的困難程度如何？',
  required: true,
  // 分數方向與其他題目一致：越沒有困難分數越高（4分），方便統一平均計算
  options: [
    { label: '幾乎沒有困難，執行很順利', value: 4 },
    { label: '有一些困難，但可以自行處理', value: 3 },
    { label: '有明顯困難，需要花較多時間或請 HR 協助', value: 2 },
    { label: '困難較大，部分流程容易卡住', value: 1 }
  ]
});

const Q_MGMT_IMPLEMENTATION_DIFFICULTY_OPEN = (qcode) => ({
  field: 'mgmt_implementation_difficulty_open',
  qcode,
  type: 'textarea',
  label: '如果您在執行績效考核時遇到困難，主要是哪一個環節讓您覺得比較不容易？例如：評分標準、資料準備、面談、系統操作、時間安排、與部屬溝通等。若沒有遇到明顯困難，請填寫「無」。',
  required: true
});

// ============================================================
// 一般員工版
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
          { label: '員工自評撰寫時間不夠', value: '員工自評撰寫時間不夠', key: 'self_eval_time' },
          { label: '績效面談排程困難', value: '績效面談排程困難', key: 'interview_schedule' },
          { label: '等待主管評分的時間太長', value: '等待主管評分的時間太長', key: 'wait_manager' },
          { label: '表單/系統操作花太多時間', value: '表單/系統操作花太多時間', key: 'system_time' }
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
      Q_SELF_EVAL_FORM_HELPFUL('Q10'),
      Q_SELF_EVAL_CONCERN_OPEN('Q10a')
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
      Q_OVERALL_COMPARE('Q11'),
      Q_OVERALL_BEST_OPEN('Q12'),
      Q_OVERALL_IMPROVE_OPEN('Q13'),
      Q_OVERALL_OTHER_OPEN('Q14')
    ]
  }
];

// ============================================================
// 初階主管版（領班～副理級）與中高階主管版（經理級以上）
// 共用同一套角色分流骨架，中高階主管版額外多一段管理制度題組
// ============================================================
function buildManagerSurvey(opts) {
  const isSenior = !!opts.isSenior;

  const sections = [
    {
      title: '第一部分｜基本資訊',
      questions: [
        { ...DEPARTMENT_QUESTION, qcode: 'R1' }
      ]
    },
    {
      title: '第二部分｜角色確認',
      description: '以下兩題會依您的回答，決定接下來需要填寫的題組，請依實際情況作答。',
      questions: [
        Q_IS_EVALUATOR('R2'),
        Q_IS_EVALUATED('R3')
      ]
    },
    {
      title: '第三部分｜流程與時程',
      questions: [
        Q_SCHEDULE_REASONABLE('R4'),
        {
          field: 'schedule_bottleneck',
          qcode: 'R5',
          type: 'checkbox',
          label: '如果您覺得時間安排有問題，最卡的環節是哪個？（可複選）',
          required: true,
          options: [
            { label: '員工自評撰寫時間不夠', value: '員工自評撰寫時間不夠', key: 'self_eval_time' },
            { label: '主管評分時間不夠', value: '主管評分時間不夠', key: 'manager_review_time' },
            { label: '績效面談排程困難', value: '績效面談排程困難', key: 'interview_schedule' },
            { label: '等待二層主管評分的時間太長', value: '等待二層主管評分的時間太長', key: 'wait_l2manager' },
            { label: '表單/系統操作花太多時間', value: '表單/系統操作花太多時間', key: 'system_time' }
          ],
          other: true
        },
        Q_HR_COMM_CLEAR('R6'),
        Q_HR_COMM_UNCLEAR_OPEN('R7')
      ]
    },
    {
      title: '第四部分｜評分制度',
      questions: [
        Q_RATING_ITEMS_CLEAR('R8'),
        Q_RATING_ITEMS_UNCLEAR_OPEN('R9'),
        Q_FIVE_LEVEL_CLEAR('R10')
      ]
    },
    {
      title: '第五部分｜評核他人',
      description: '因為您在角色確認中回答「有評核其他同仁」，請繼續回答以下題目。',
      showIf: [{ field: 'is_evaluator', equals: '是' }],
      questions: [
        Q_EVALUATOR_MODE('R11'),
        Q_RATING_DIFFICULTY('R12')
      ]
    },
    {
      title: '第六部分｜面談者角度',
      description: '因為您本次對部屬的參與方式包含績效面談，請繼續回答以下題目。',
      showIf: [
        { field: 'is_evaluator', equals: '是' },
        { field: 'evaluator_mode', equals: '評分＋績效面談' }
      ],
      questions: [
        Q_INTERVIEW_GIVEN_INTERACTION('R13'),
        Q_INTERVIEW_GIVEN_HELPFUL('R14'),
        Q_INTERVIEW_GIVEN_GOAL_CLARITY('R15'),
        Q_INTERVIEW_PROCESS_HELPFUL('R16'),
        Q_INTERVIEW_TOOL_HELPFUL('R17'),
        Q_INTERVIEW_GIVEN_IMPROVE_OPEN('R18')
      ]
    },
    {
      title: '第七部分｜員工自評',
      description: '因為您在角色確認中回答「有接受主管評核」，請繼續回答以下題目。',
      showIf: [{ field: 'is_evaluated', equals: '是' }],
      questions: [
        Q_SELF_EVAL_CLEAR('R19'),
        Q_SELF_EVAL_FORM_HELPFUL('R20'),
        Q_SELF_EVAL_CONCERN_OPEN('R20a')
      ]
    },
    {
      title: '第八部分｜您接受主管的面談',
      description: '此部分詢問您本次作為被評核者，與您的直屬主管進行績效面談的經驗。',
      showIf: [{ field: 'is_evaluated', equals: '是' }],
      questions: [
        Q_INTERVIEW_RECEIVED_DURATION('R21'),
        Q_INTERVIEW_RECEIVED_QUALITY('R22'),
        Q_INTERVIEW_RECEIVED_GOAL_CLEAR('R23')
      ]
    }
  ];

  if (isSenior) {
    sections.push({
      title: '第九部分｜管理制度與組織層級',
      description: '以下題目請以您管理團隊、觀察部門整體運作的角度作答，而非僅針對個人考核經驗。',
      questions: [
        Q_MGMT_STANDARD_CLARITY('M1'),
        Q_MGMT_DEPT_EXECUTION('M2'),
        Q_MGMT_SYSTEM_HELPFULNESS('M3'),
        Q_MGMT_TALENT_DEV_LINK('M4'),
        Q_MGMT_IMPLEMENTATION_DIFFICULTY('M5'),
        Q_MGMT_IMPLEMENTATION_DIFFICULTY_OPEN('M6')
      ]
    });
  }

  sections.push({
    title: (isSenior ? '第十部分' : '第九部分') + '｜整體回饋',
    questions: [
      Q_OVERALL_COMPARE('R24'),
      Q_OVERALL_BEST_OPEN('R25'),
      Q_OVERALL_IMPROVE_OPEN('R26'),
      Q_OVERALL_OTHER_OPEN('R27')
    ]
  });

  return sections;
}

const JUNIOR_MANAGER_SURVEY = buildManagerSurvey({ isSenior: false });
const SENIOR_MANAGER_SURVEY = buildManagerSurvey({ isSenior: true });

// ============================================================
// 身分選擇（首頁顯示用文字）
// ============================================================
const IDENTITY_OPTIONS = [
  {
    key: 'employee',
    title: '一般員工',
    description: '不具主管職，本次考核以被評核者身分參與',
    survey: 'employee'
  },
  {
    key: 'junior_manager',
    title: '初階主管（領班～副理級）',
    description: '本次考核可能評核他人、接受評核，或兩者皆是',
    survey: 'junior_manager'
  },
  {
    key: 'senior_manager',
    title: '中高階主管（經理級以上）',
    description: '本次考核可能評核他人、接受評核，或兩者皆是，並包含管理制度相關題目',
    survey: 'senior_manager'
  }
];

const QUESTION_SETS = {
  employee: EMPLOYEE_SURVEY,
  junior_manager: JUNIOR_MANAGER_SURVEY,
  senior_manager: SENIOR_MANAGER_SURVEY
};

const IDENTITY_LABELS = {
  employee: '一般員工',
  junior_manager: '初階主管',
  senior_manager: '中高階主管'
};
