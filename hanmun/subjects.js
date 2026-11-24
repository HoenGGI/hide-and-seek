// 과목 목록 — 위쪽 과목 탭에 이 순서대로 나와요.
// ready: false인 과목은 탭만 있고 '준비 중' 화면이 보여요. 이름과 순서는 여기서 바꾸면 돼요.
// color는 jade · coral · sky · violet · teal · ochre · rose · ink 중에서 골라요.
'use strict';
const SUBJECTS = [
  { id: 'hanmun', name: '한문', mark: '漢', color: 'jade', ready: true },
  { id: 'korean', name: '국어', mark: '국', color: 'coral', ready: false },
  { id: 'english', name: '영어', mark: 'A', color: 'sky', ready: false },
  { id: 'math', name: '수학', mark: '수', color: 'violet', ready: false },
  { id: 'science', name: '과학', mark: '과', color: 'teal', ready: false },
  { id: 'social', name: '사회', mark: '사', color: 'ochre', ready: false },
  { id: 'history', name: '역사', mark: '역', color: 'rose', ready: false },
];
