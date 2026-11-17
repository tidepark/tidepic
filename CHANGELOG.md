# Changelog

## 0.1.8 — 2026-11-17

- Wording only. Section 14 now says what tidepic covers instead of comparing it with earlier work. Removed "any number" (14) and "far more" (7). No rule changed.
- 문장만 고쳤다. 14절에서 앞선 것들과 견주는 문장을 tidepic 이 다루는 범위를 말하는 문장으로 바꿨다. 「어떤 숫자든」(14절)과 「훨씬」(7절)을 뺐다. 규칙은 바뀌지 않았다.

## 0.1.7 — 2026-11-17

- Inline values can carry `scale` and `momentum` in the address, so a scene that follows rise or momentum can be driven by an address alone (4, 5).
- 주소에 직접 적는 값에 `scale`과 `momentum`을 적을 수 있다. 오르내림이나 기울기를 따르는 장면도 주소만으로 움직일 수 있다(4절, 5절).

## 0.1.6 — 2026-11-16

- A case table can show a Lottie file. `follow` holds it at the position of a derived value instead of looping (5, 7.1).
- Prior art: what tidepic does differently from formats that describe how a picture is drawn (14).
- 경우표의 `show`에 Lottie 파일을 적을 수 있다. `follow`를 적으면 되풀이해 트는 대신 계산된 값의 자리에 멈춰 보여 준다(5절, 7.1절).
- 앞서 있던 것들: 그림을 어떻게 그리는지 정하는 형식과 tidepic 이 무엇이 다른지 적었다(14절).

## 0.1.5 — 2026-11-16

- The rules now have their own name, tidepic. Tidepark is the name of the gallery only. The settings file is `tidepic.config.json` (1, 5).
- New section on prior art (14).
- 규칙에 tidepic 이라는 이름을 따로 붙였다. Tidepark 은 갤러리의 이름으로만 쓴다. 설정 파일은 `tidepic.config.json`이다(1절, 5절).
- 앞서 있던 것들을 적은 절을 더했다(14절).

## 0.1.4 — 2026-11-16

- New data source: a date. `until=2026-12-25` counts the days left inside the page, with no network. `since` gives the total (4, 5).
- 받는 곳에 날짜를 더했다. `until=2026-12-25`라고 적으면 페이지가 남은 날을 센다. 네트워크를 쓰지 않는다. `since`를 적으면 전체 날도 알려 준다(4절, 5절).

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
