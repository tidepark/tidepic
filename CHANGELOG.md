# Changelog

## 0.2.2 — 2026-11-17

- A value can say how its number reads: `unit` (`13.3°C`, `71,200원`) and `format` (`"duration"` shows seconds as `9:00`) (3.1, 5).
- New `meta` for information about the feed itself: `ttl`, `at`, `credit`. `ttl` moved here from the top of the feed. The runtime does not draw `at` or `credit` (3, 3.9, 4).

- 값이 자기 숫자를 어떻게 읽을지 적을 수 있다. `unit`(`13.3°C`, `71,200원`)과 `format`(`"duration"`이면 초를 `9:00`으로)이다(3.1절, 5절).
- 피드 자체에 대한 정보를 담는 `meta`를 더했다. `ttl`, `at`, `credit`이다. `ttl`은 피드의 맨 위에서 여기로 옮겼다. 런타임은 `at`과 `credit`을 그리지 않는다(3절, 3.9절, 4절).

## 0.2.1 — 2026-11-17

- `focus` says which value the case table and the number look at. It replaces "the first value" (3, 3.7, 5).
- `lead` became `ahead`: `yes`, `tie`, `no`, worked out for each value, for any number of values. With two values, `ahead: yes` on the first is what `lead: first` was (3.7).
- New derived value `rank`. A single value has no `share` and no `rank` (3.2).
- `step` has the same shape as a value: `{ "value": 2, "to": 4 }`. It used to be `{ "now": 2, "total": 4 }`. New condition `step`: `first`, `mid`, `last` (3.3, 3.7).
- With three or more values the number shown is the one `focus` points to. It used to be hidden (5).
- The fifth principle and the no-flicker rule now say the same thing: holding a condition near a boundary applies only to a screen that keeps updating. A still image and the first frame are judged from the boundaries alone (2, 3.7).

- `focus`는 경우표와 숫자가 볼 값을 정한다. 「첫째 값」 대신 쓴다(3절, 3.7절, 5절).
- `lead`가 `ahead`가 되었다. `yes`, `tie`, `no`이고 값마다 판정하며, 값이 몇 개든 된다. 값이 둘일 때 첫째 값의 `ahead: yes`가 전의 `lead: first`다(3.7절).
- 계산된 값 `rank`를 더했다. 값이 하나이면 `share`와 `rank`가 없다(3.2절).
- `step`이 값과 같은 모양이 되었다. `{ "value": 2, "to": 4 }`이고, 전에는 `{ "now": 2, "total": 4 }`였다. 조건 `step`(`first`, `mid`, `last`)을 더했다(3.3절, 3.7절).
- 값이 셋 이상이면 `focus`가 가리키는 값을 숫자로 보여 준다. 전에는 보여 주지 않았다(5절).
- 다섯째 원칙과 깜빡임 방지 규칙이 같은 말을 하게 고쳤다. 경계 가까이에서 조건을 붙드는 것은 이어서 갱신되는 화면에만 있다. 정지 그림과 첫 장은 경계 값만으로 판정한다(2절, 3.7절).

## 0.2.0 — 2026-11-17

The fields of a value changed. Feeds written for 0.1 need to be rewritten. Every derived value is now (a number − an origin) ÷ a span.

- `low` and `high` became `from` and `to`. The range has a direction, and `to` may be the smaller number. `fill` is how far the value has come from `from` to `to` (3.1, 3.2).
- A countdown now runs from the total days to 0, so its fill grows as the day approaches. It used to shrink (3.1, 4).
- New derived values `over` and `under`, and a new condition `bound`, for a value outside its range (3.2, 3.7).
- `momentum` is no longer sent. The sender sends `rate` and `rateScale` and the runtime divides. Without them there is no `momentum` and no `pace`. New condition `drift` for its direction (3.1, 3.2, 3.7).
- `better` is gone. Nothing read it.
- The runtime gives notice when a number has nothing to be divided by, instead of leaving the value out silently (9).
- The address still reads `low`, `high` and `momentum` for now. A feed does not (4).

값의 항목이 바뀌었다. 0.1 에 맞춰 쓴 피드는 다시 써야 한다. 계산된 값은 이제 모두 (숫자 − 원점) ÷ 폭이다.

- `low`, `high`가 `from`, `to`가 되었다. 범위에 방향이 있고 `to`가 더 작은 수여도 된다. `fill`은 `from`에서 `to`로 온 만큼이다(3.1절, 3.2절).
- 남은 날을 셀 때는 전체 날에서 0 으로 간다. 그래서 날이 다가올수록 채움이 늘어난다. 전에는 줄어들었다(3.1절, 4절).
- 범위 밖의 값을 위해 계산된 값 `over`, `under`와 조건 `bound`를 더했다(3.2절, 3.7절).
- `momentum`을 보내지 않는다. 보내는 쪽은 `rate`와 `rateScale`을 보내고 런타임이 나눈다. 둘이 없으면 `momentum`과 `pace`가 없다. 그 방향을 보는 조건 `drift`를 더했다(3.1절, 3.2절, 3.7절).
- `better`를 없앴다. 읽는 곳이 없었다.
- 숫자를 나눌 폭이 없으면 조용히 빼지 않고 알린다(9절).
- 주소에서는 `low`, `high`, `momentum`을 한동안 그대로 읽는다. 피드에서는 읽지 않는다(4절).

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
