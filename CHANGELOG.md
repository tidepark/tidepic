# Changelog

## 0.2.7 — 2026-11-17

- A value can carry its past values: `history` (oldest first, up to 60 per value) and `every` (seconds between them). The runtime turns them into a list of 0 to 1, worked out the same way as `fill`, with the current value at the end. Without a range the list is fitted to its own smallest and largest numbers, and the runtime gives notice (3.1, 3.2, 3.8, 9).
- Principle 5 now reads "a scene is decided by what is in the feed alone". Before, it said the current numbers alone. What it keeps is the same: the same feed gives the same scene, and neither the runtime nor a companion keeps past feeds (2).
- The random source sends `history` from the same sequence. A companion can declare `"history"` in `reads.needs` (4, 6).

- 값에 지난 값을 실을 수 있다. `history`(오래된 것부터, 값 하나에 60개까지)와 `every`(값 사이의 간격, 초)다. 런타임은 이것을 `fill`과 같은 식으로 0~1 의 줄로 바꾸고, 맨 끝에 지금 값을 붙인다. 범위가 없으면 줄 안의 가장 작은 값과 큰 값에 맞추고 알린다(3.1절, 3.2절, 3.8절, 9절).
- 원칙 5를 "장면은 피드에 담긴 것만으로 정해진다"로 고쳤다. 전에는 "지금의 숫자만으로"였다. 지키는 것은 같다. 같은 피드는 같은 장면이고, 런타임과 컴패니언은 지난 피드를 기억해 두지 않는다(2절).
- 난수는 같은 흐름에서 `history`도 낸다. 컴패니언은 `reads.needs`에 `"history"`를 밝힐 수 있다(4절, 6절).

## 0.2.6 — 2026-11-17

- A skin can declare options: parts of its look that can be changed, each one a choice of words, a range of numbers, or a color. Values come from the address (`skin.<name>`), from `view.options` in the feed, or from `options` in the config file, in that order. Anything the skin did not declare is dropped (3.10, 5, 7.3, 11).

- 스킨이 선택 항목을 밝힐 수 있다. 자기 모습 가운데 바꿀 수 있는 것이고, 항목마다 낱말 가운데 하나, 수의 범위, 색 가운데 하나로 밝힌다. 값은 주소(`skin.<이름>`), 피드의 `view.options`, 설정 파일의 `options` 순으로 받는다. 스킨이 밝히지 않은 것은 버린다(3.10절, 5절, 7.3절, 11절).

## 0.2.5 — 2026-11-17

A read-through after eight versions in one day. The text now matches the runtime. No rule changed.

- The example feed in section 3 pointed its event at a value that was not there. The companion example asked for `fill` on scores that have no range.
- Things the runtime already did and the text did not say: which fields of `event` are required and that an event in the first feed counts as past (3.5), `state` among what is worked out for each value (3.7, 8), the default and range of `every`, random values every second (4), the `dataOrigins` setting (5), where a skin's suggested positions are read from (5).
- Wording: the example for fine-tuning within one condition, "0.x while in draft", what a companion may fetch (10), "not restricted" in place of "anything" (8). The last sentence of section 14 repeated the one before it and is gone.

하루에 판이 여덟 번 바뀐 뒤 처음부터 끝까지 읽고 맞췄다. 글이 실행기와 같아졌다. 규칙은 바뀌지 않았다.

- 3절의 예시 피드가 없는 값을 가리키는 사건을 싣고 있었다. 꾸러미 예시는 범위가 없는 점수에 `fill`이 필요하다고 적혀 있었다.
- 실행기가 이미 하던 일인데 글에 없던 것: `event`에서 꼭 있어야 하는 항목과 처음 받은 피드의 사건은 지난 일로 본다는 것(3.5절), 값마다 판정하는 것에 `state`(3.7절, 8절), `every`의 기본값과 범위, 난수는 1초마다(4절), `dataOrigins` 설정(5절), 스킨이 권하는 위치를 어디서 읽는지(5절).
- 문장: 한 조건 안에서 미세하게 달라지는 예, 「초안 동안은 0.x」, 컴패니언이 받아 올 수 있는 것(10절), 「무엇이든」 대신 「정해 두지 않는다」(8절). 14절의 마지막 문장은 앞 문장을 되풀이해서 지웠다.

## 0.2.4 — 2026-11-17

- `state` can be written on each value. A value without one follows the feed's (3.1, 3.4, 3.7).
- New state `fault` for something broken. `idle` also covers maintenance (3.4).
- A feed address on another site must use `https`, and a feed fetched from an address is asked for at most every 10 seconds (4).

- `state`를 값마다 적을 수 있다. 적지 않은 값은 피드의 것을 따른다(3.1절, 3.4절, 3.7절).
- 고장을 뜻하는 상태 `fault`를 더했다. `idle`은 점검도 포함한다(3.4절).
- 다른 사이트의 피드 주소는 `https`여야 하고, 주소에서 받는 피드는 10초보다 자주 묻지 않는다(4절).

## 0.2.3 — 2026-11-17

- New `view`: the sender can choose the skin, the title and the number. It uses the names of the settings and only chooses among what the companion already has. An address parameter comes before it (3.10, 5, 11).
- Section 3 now says what the four parts of a feed are: values, moment, view, meta.

- `view`를 더했다. 보내는 쪽이 스킨, 제목, 숫자를 고를 수 있다. 설정과 같은 이름을 쓰고, 컴패니언이 이미 가진 것 가운데서 고르기만 한다. 주소 인자가 이것보다 앞선다(3.10절, 5절, 11절).
- 3절에 피드의 네 칸(값, 때, 보이기, 꼬리표)을 적었다.

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
