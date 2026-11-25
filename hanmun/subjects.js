// 과목 목록 — 위쪽 과목 탭에 이 순서대로 나와요.
// data가 있는 과목은 레슨 · 퀴즈 · 요약 · 복습이 열리고, 없는 과목은 '준비 중' 화면이 보여요.
// color는 jade · coral · sky · violet · teal · ochre · rose · ink 중에서 골라요.
'use strict';
const SUBJECTS = [
  { id: 'korean', name: '국어', mark: '국', color: 'coral' },
  { id: 'history', name: '역사', mark: '역', color: 'rose', data: HISTORY },
  { id: 'hanmun', name: '한문', mark: '漢', color: 'jade', data: { units: UNITS, summary: SUMMARY, exam: EXAM, mock: MOCK } },
  { id: 'science', name: '과학', mark: '과', color: 'teal' },
];
SUBJECTS.forEach(s => { s.ready = !!s.data; });
