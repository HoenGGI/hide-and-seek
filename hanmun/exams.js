// 시험 시간표와 범위 (2학년). 다음 시험 때는 이 파일만 고치면 됩니다.
// slots: [교시, 과목 id] — 과목 id가 null이면 교과수업. 과목 id는 아래 subjects의 키.
'use strict';
const EXAM_INFO = {
  title: '2학기 2차시험',
  grade: '2학년',
  periods: {
    1: { enter: '08:45', time: '08:50~09:35' },
    2: { enter: '09:45', time: '09:50~10:35' },
    3: { enter: '10:45', time: '10:50~11:35' },
  },
  days: [
    { date: '2026-12-02', slots: [[1, 'history'], [2, null], [3, 'english']] },
    { date: '2026-12-03', slots: [[1, 'science'], [2, null], [3, 'hanmun']] },
    { date: '2026-12-04', slots: [[1, 'math'], [2, null], [3, 'korean']] },
  ],
  note: '4교시(11:35~12:30)는 급식 후 귀가 (2학년 먼저)',
  subjects: {
    history: {
      name: '역사', mark: '역', color: 'rose',
      range: ['교과서 145~194쪽', '152~155쪽, 168~181쪽은 제외'], material: '개념 학습지 10장',
    },
    english: {
      name: '영어', mark: 'A', color: 'sky',
      range: ['Lesson 7', 'Lesson 8'], material: '교과서, 학습지',
    },
    science: {
      name: '과학', mark: '과', color: 'teal',
      range: ['Ⅵ. 동물과 에너지 중 호흡계, 배설계 (205~225쪽)', 'Ⅶ. 전기와 자기 전체 (229~267쪽)', 'Ⅷ. 별과 우주 (280~297쪽)'], material: '교과서',
    },
    hanmun: {
      name: '한문', mark: '漢', color: 'jade',
      range: ['14. 삶을 이끈 한마디', '15. 할아버지와 걷는 눈길', '18. 바보 온달과 평강 공주', '19. 김만덕의 나눔'], material: '학습지 1장',
      tip: '18과 바보 온달과 평강 공주는 아직 앱에 없습니다. 교과서와 학습지로 따로 공부해 주십시오.',
    },
    math: {
      name: '수학', mark: '수', color: 'violet',
      range: ['5.3 삼각형의 외심 ~ 7.5 피타고라스 정리', '교과서 153~231쪽'], material: '교과서',
    },
    korean: {
      name: '국어', mark: '국', color: 'coral',
      range: ['3. (1) 국어의 음운과 문자 (116~141쪽)', '3. (2) 듣기·말하기 성찰하기 (146~153쪽)', '4. (1) 복합양식 평가하며 읽기 (170~183쪽)'], material: '교과서, 학습지',
    },
  },
  after: [
    ['12월 14일(월) ~ 16일(수)', '개인 성적 확인 및 이의 신청'],
    ['12월 28일(월)', '성적표 발송'],
  ],
};
