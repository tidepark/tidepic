# Changelog

## 0.1.3 — 2026-11-16

- New principle: a scene is decided by the current numbers alone. The runtime no longer fills in `momentum`, `low` or `high` from past feeds (2, 3.2, 9).
- New derived value `share`: a value divided by the sum of all values, for scores and proportions (3.2).
- 원칙을 더했다. 장면은 지금의 숫자만으로 정해진다. 런타임은 지난 피드로 `momentum`, `low`, `high`를 채우지 않는다(2절, 3.2절, 9절).
- 계산되는 값에 몫(`share`)을 더했다. 그 값을 값들의 합으로 나눈 것이고, 점수와 비중에 쓴다(3.2절).

## 0.1.2 — 2026-11-16

- Named conditions (`level`, `trend`, `pace`, `lead`, `state`) worked out by the runtime (3.7).
- A companion can be made as a case table with no code: `scenes.json` says what to show in each condition, with optional effects and video (5, 7.1).
- Skins may include video. Size limits updated (10).
- 런타임이 판정하는 이름 붙은 조건을 넣었다(3.7절).
- 코드 없이 경우표로 컴패니언을 만들 수 있다. `scenes.json`이 조건마다 무엇을 보여 줄지 적고, 효과와 영상을 쓸 수 있다(5절, 7.1절).
- 스킨에 영상을 넣을 수 있다. 크기 한도를 고쳤다(10절).

## 0.1.1 — 2026-11-16

- Licensed under CC BY 4.0 (`LICENSE.md`).
- CC BY 4.0 라이선스를 표시했다(`LICENSE.md`).

## 0.1.0 — 2026-11-16

- First draft of the spec: feed format (`values`, `step`, `state`, `event`, `extra`), data sources, companion package, grades, checks, display rules, safety.
- 규칙 첫 초안: 피드의 모양, 데이터를 받는 곳, 컴패니언 꾸러미, 등급, 점검, 화면 규칙, 안전.
