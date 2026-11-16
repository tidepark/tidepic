# Tidepark Spec

**Where numbers become scenery.**

Version 0.1.3 (draft) · 2026-11-16 · [한국어](SPEC.ko.md) · [CC BY 4.0](LICENSE.md)

This document defines two things: the data a Tidepark companion receives, and how a companion is packaged. It is a draft. Details may change before 1.0.

## 1. Terms

| Term | Meaning |
|---|---|
| Companion | A self-contained web page that turns numbers into a scene |
| Skin | What a companion shows: images, video, and the case table or layout numbers that arrange them. One companion can have many skins |
| Condition | A named state the runtime works out from the values, such as `high` or `rise` |
| Feed | A JSON document in the format of section 3 |
| Host | Whatever shows a companion: a browser tab, a kiosk screen, or an app that embeds it |
| Runtime | The small piece of code inside a companion that reads the feed and prepares values for drawing |

## 2. Principles

1. **A companion does not know what the numbers mean.** Stock price or step count, it only receives numbers in a fixed shape.
2. **Senders send raw numbers.** Scaling to 0–1 is the runtime's job.
3. **Common fields are always enough to draw.** Domain-specific data (`extra`) only enriches the scene.
4. **Unknown fields are ignored.** They are never an error.
5. **A scene is decided by the current numbers alone.** A companion only shows the current numbers in another form. It does not draw a graph or fill in between past values. The same feed gives the same scene, whenever and however often it is fetched.

## 3. Feed format

```json
{
  "spec": 1,
  "values": [
    { "value": 71200, "low": 70100, "high": 71900, "base": 70500, "momentum": 0.3 }
  ],
  "step":  { "now": 2, "total": 4 },
  "state": "live",
  "event": { "type": "score", "index": 1, "at": 1794787200 },
  "extra": { "baseball": { "inning": 7, "outs": 2 } },
  "ttl": 60
}
```

| Field | Required | Meaning |
|---|---|---|
| `spec` | yes | Major version of this format. Currently `1` |
| `values` | yes | List of values. At least one |
| `step` | no | A stage: "which one out of how many" |
| `state` | no | Progress state |
| `event` | no | A moment that just happened |
| `extra` | no | Domain-specific data |
| `ttl` | no | Minimum seconds before asking again |

### 3.1 `values`

The number of values decides the kind of scene.

| Count | Kind | Examples |
|---|---|---|
| 1 | Fill, or rise and fall | A goal, steps, days left, a price, temperature |
| 2 | Versus | A game score 92:102, income vs. spending, today vs. yesterday |
| Many | A group | A portfolio, a ranking, seven days of a habit |

Each value is an object. Only `value` is required.

| Field | Meaning | Example (steps) | Example (price) |
|---|---|---|---|
| `value` | The current number | 6200 | 71200 |
| `low` | Lower end. Defaults to 0 | 0 | Day low |
| `high` | Upper end | Goal 10000 | Day high |
| `base` | Reference point for rise and fall | Yesterday's steps | Previous close |
| `scale` | Typical size of a move from `base` | — | Usual daily range |
| `momentum` | Speed of change, −1 to 1 | — | Slope of a moving average |
| `better` | Which direction is good: `"high"` or `"low"`. Defaults to `"high"` | `"high"` | `"high"` |

For a countdown, send what remains: `value` is days left and `high` is total days. The fill shrinks as the day approaches.

### 3.2 Derived values

A companion draws from these, not from the raw numbers.

| Name | Range | How | Needs |
|---|---|---|---|
| `fill` | 0 to 1 | (`value` − `low`) ÷ (`high` − `low`) | `high` |
| `rise` | −1 to 1 | (`value` − `base`) ÷ scale | `base` |
| `momentum` | −1 to 1 | As sent. 0 if missing | — |
| `share` | 0 to 1 | `value` ÷ sum of all values | — |

- The scale for `rise` is `scale` if sent, otherwise `high` − `low`. Results are clamped to −1…1. This rule is provisional (see section 13).
- Derived values come from one feed alone. The runtime does not remember past feeds to fill anything in. The sender is the one who knows the trend, so the sender sends the slope (`momentum`).
- A missing `low` counts as 0. Without `high` there is no `fill`, and without `base` there is no `rise`.
- `share` is for comparing numbers that have no upper end, such as scores. 1 against 10 gives 0.09 and 0.91. If any value is negative or the sum is 0, there is no `share`.
- The runtime may ease the scene into place when a new value arrives. It does not change the value it arrives at. A still image always shows the arrived value.

### 3.3 `step`

```json
"step": { "now": 2, "total": 4 }
```

A quarter, a set, a delivery stage, a pomodoro round. `total` is optional.

### 3.4 `state`

| Value | Meaning |
|---|---|
| `"live"` | In progress (market open, game on). The default |
| `"idle"` | Resting (market closed, before the game) |
| `"done"` | Finished |

When no data arrives for a while, the runtime reports the feed as stale by itself. Senders do not set this. Other values are ignored; domain-specific states such as weather conditions belong in `extra`.

### 3.5 `event`

```json
"event": { "type": "score", "index": 1, "at": 1794787200 }
```

- A moment such as a goal scored or a target reached. The scene reacts once.
- `type` is a short lowercase word. Companions ignore types they do not know.
- `index` says which value it concerns (position in `values`, from 0).
- `at` is a Unix time in seconds. A new `at` means a new event; the same `at` is reacted to only once.

### 3.6 `extra`

```json
"extra": { "baseball": { "inning": 7, "half": "bottom", "outs": 2, "bases": [1, 0, 1] } }
```

- Grouped by domain name, in lowercase.
- The runtime passes `extra` through untouched. Interpreting it is up to the companion.
- A companion declares which domains it reads (section 6).
- Without `extra`, a companion draws from the common fields alone.
- Allowed contents: numbers, short strings, booleans, and arrays of these. No URLs, HTML or code.
- When several companions come to use the same `extra`, it may be promoted to a common field in a later version.

Example: for baseball, the common fields carry only the score. Inning, runners and outs travel in `extra`.

### 3.7 Conditions

The runtime also turns the derived values into named conditions. Every companion uses the same names, so a scene can be chosen by case instead of by arithmetic.

| Condition | Names | Worked out from |
|---|---|---|
| `level` | `empty`, `low`, `mid`, `high`, `full` | `fill`: below 0.05, below 0.35, below 0.65, below 0.95, and the rest |
| `trend` | `fall`, `flat`, `rise` | `rise`: below −0.1, in between, above 0.1 |
| `pace` | `calm`, `brisk` | Size of `momentum`: below 0.3, or not |
| `lead` | `first`, `tie`, `second` | With two values, which one is ahead |
| `state` | `live`, `idle`, `done`, `stale` | Section 3.4. `stale` is set by the runtime |

- Conditions are worked out for each value.
- A condition that cannot be worked out is simply absent. Without `base` there is no `trend`.
- **No flicker at the edges.** Once a condition changes, the value must move a further 0.03 past the boundary before it changes back.
- **Conditions pick the scene; derived values fine-tune it.** The derived values stay available for speed and amount, so 62% and 68% need not look identical.
- The boundaries above are provisional (section 13).

### 3.8 Limits

| Item | Limit |
|---|---|
| Whole feed | 16 KB |
| `values` | 64 items |
| `extra` | 4 KB |
| Strings | 64 characters |

Numbers must be finite. Anything over a limit or of the wrong type is dropped, not repaired.

## 4. Data sources

A companion gets its feed from one of three sources. All produce the same format.

| Source | Setting | Notes |
|---|---|---|
| Random | `data=random` (default) | Generated inside the page, no network. Moves smoothly. The same `seed` gives the same sequence |
| Inline | `v=62&high=100` | Values written directly in the address. Several values: `v=92,102` |
| URL | `data=<url>` | The page fetches a feed from that address |

- Random is a source, not a special mode. Every companion therefore runs with no setup.
- A URL source must allow cross-origin requests (CORS).
- A site or host may restrict which feed URLs it accepts.

### Refresh

- The viewer sets the interval with `every` (seconds).
- If the feed carries `ttl`, the companion does not ask more often than that.

## 5. Companion package

A companion is a static bundle. It needs no server and can be hosted anywhere or packed inside an app.

```
index.html              entry point
companion.json          what the companion is and what it reads (section 6)
tidepark.config.json    default settings
draw.js                 drawing code, kept separate (only when made by code)
skins/<skin>/           one folder per skin (section 7)
  scenes.json           a case table, or
  skin.json             layout numbers for drawing code
```

### Three ways to make a companion

A companion is, in the end, a table of cases: when the values are in this condition, show that.

| Way | What you write | `made` |
|---|---|---|
| Case table | For each condition, a picture or a video. No code | `"table"` |
| Case table with effects | The same, plus moving effects the runtime provides | `"table"` |
| Code | Your own drawing code | `"code"` |

### Settings

`tidepark.config.json` holds defaults. Address parameters override them.

```json
{
  "data": "random",
  "every": 60,
  "skin": "alps",
  "assets": "https://example.com/train/"
}
```

| Setting | Meaning | In the address |
|---|---|---|
| `data` | `random`, or a feed URL | yes |
| `every` | Refresh interval in seconds | yes |
| `skin` | Skin slug. Falls back to the default skin | yes |
| `seed` | Seed for random numbers | yes |
| `title` | Text shown as a title. Empty hides it (default) | yes |
| `titleAt` | Where the title goes (see below). Default `tl` | yes |
| `num` | `1` shows the number. Default `0` | yes |
| `numAt` | Where the number goes. Default `br` | yes |
| `v`, `low`, `high`, `base` | Inline values | yes |
| `assets` | Where skin images are loaded from | no — config file only |

Order of precedence: address parameters, then the config file, then built-in defaults.

### Title and number

A viewer may switch on a title and the number. Both are off by default, so a companion shows the scene alone.

Positions use a nine-cell grid:

```
tl  tc  tr
ml  mc  mr
bl  bc  br
```

- The runtime draws them on top of the scene. A companion's drawing code never draws text, so every companion gets the same title and number.
- They are drawn on the canvas, not as page elements, so a still image shows them too.
- With one value the number is that value. With two it is shown as `92 : 102`. With more, no number is shown.
- If both land in the same cell, the title sits above the number.
- A skin may suggest positions that suit its artwork (`"overlay": { "titleAt": "tc", "numAt": "bc" }` in `skin.json`). The viewer's choice wins.

## 6. `companion.json`

```json
{
  "slug": "ballpark",
  "name": { "en": "Ballpark", "ko": "야구장" },
  "spec": 1,
  "made": "code",
  "grade": "basic",
  "still": true,
  "reads": {
    "values": 2,
    "needs": ["fill"],
    "step": false,
    "events": ["score"],
    "extra": ["baseball"]
  },
  "skins": ["day", "night"]
}
```

| Field | Meaning |
|---|---|
| `slug` | Lowercase name used in addresses |
| `name` | Display name, in English and Korean |
| `spec` | Feed version it understands |
| `made` | `"table"` or `"code"` (section 5) |
| `grade` | `"basic"` or `"free"` (section 8) |
| `still` | Whether it can produce a still image |
| `reads.values` | How many values it reads: `1`, `2` or `"many"` |
| `reads.needs` | Derived values it cannot do without: `"fill"`, `"rise"`, `"share"` |
| `reads.step` | Whether it uses `step` |
| `reads.events` | Event types it reacts to |
| `reads.extra` | `extra` domains it reads |
| `skins` | Skin slugs it ships with |

## 7. Skins

A skin is everything a companion shows: images, video, and the numbers that arrange them.

- A skin contains no code, no URLs and no font files. Files are referred to by plain file names inside the skin's own folder.
- The same companion with a different skin reads the same data and looks different.
- A different skin can change far more than a picture. It can bring its own effects or video.

There are two kinds, matching how the companion is made (section 5).

### 7.1 Case table (`scenes.json`)

For a companion made as a table. The skin says what to show in each case.

```json
{
  "slug": "spring",
  "name": { "en": "Spring", "ko": "봄" },
  "scenes": [
    { "when": { "state": ["idle", "done"] }, "show": "night.webp" },
    { "when": { "level": "full" }, "show": "bloom.webm", "poster": "bloom.webp" },
    { "when": { "trend": "rise", "pace": "brisk" },
      "show": "breeze.webp",
      "effects": [ { "type": "drift", "image": "petal.webp", "amount": "fill" } ] },
    { "show": "calm.webp" }
  ],
  "events": [
    { "on": "score", "play": "burst.webm" }
  ],
  "fade": 1.5
}
```

- Entries are tried from top to bottom. The first whose `when` matches is shown.
- Every condition in `when` must hold. A list means "any of these".
- The last entry has no `when`. It is the default, and it is required.
- `show` is an image or a video. A video plays muted and loops, and needs a `poster` image for still frames.
- `effects` adds moving pieces drawn by the runtime. `amount` is a number from 0 to 1, or the name of a derived value (`"fill"`, `"rise"`, `"momentum"`, `"share"`) to follow it continuously.
- `events` plays something once, on top, when an event of that type arrives.
- `fade` is the cross-fade in seconds when the scene changes. The default is 1.

Effects the runtime provides (provisional list):

| Type | What it does |
|---|---|
| `drift` | Pieces float across: petals, snow, leaves |
| `fall` | Pieces drop from above |
| `float` | Pieces rise from below: bubbles, steam |
| `count` | Shows pieces in fixed places. How many follows `amount` |

### 7.2 Layout numbers (`skin.json`)

For a companion drawn by code. The skin supplies the images and the numbers the code draws with.

```json
{
  "slug": "alps",
  "name": { "en": "Alps", "ko": "알프스" },
  "images": { "far": "far.webp", "cabin": "cabin.webp" },
  "layout": { "window": [0.07, 0.31, 0.46, 0.61] }
}
```

The keys under `images` and `layout` are defined by each companion.

## 8. Grades

| | Basic | Free |
|---|---|---|
| Drawing | A case table, or 2D canvas code in its own file | Anything: 3D, WebAssembly, physics engines |
| Still image | Yes | Optional |
| Packed inside a host app | Yes | No — loaded by address only |
| Must follow | This whole document | Sections 3–6, 9, 11, and the display rules marked "all grades" |

### Drawing code (basic grade)

A companion made as a case table has no drawing code; the runtime shows its scenes. For a companion made by code, so that a still image can be rendered anywhere, the drawing function:

- **Draws only from what it is given** — values, skin, size and time. It does not depend on page elements.
- **Gives the same picture for the same input.** If it needs randomness, it takes a seed.

```js
draw(ctx, {
  values,   // [{ fill, rise, momentum, share, raw }]
  step, state, event, extra,
  skin,     // images and layout numbers
  width, height,
  time,     // seconds
  seed,
})
```

## 9. Compatibility checks

The runtime compares what a companion declares with what actually arrives.

| Situation | What happens |
|---|---|
| `momentum` or `low` is missing | Counts as 0. No notice |
| A needed value cannot be computed (no `high` but `fill` is needed, or no `base` but `rise` is needed) | Warning |
| The count differs (reads 2, got 1) | Warning |
| A case uses a condition that cannot be worked out (`trend` without `base`) | Warning. That case never matches |
| `extra` did not arrive | Draws from common fields and notes "showing default behavior" |

A warning never blanks the screen. The companion draws what it can.

## 10. Display rules

| Rule | Grades |
|---|---|
| Fills any aspect ratio. No empty bands | all |
| Readable at small card sizes | all |
| Readable as a still frame. Nothing that only motion can tell | basic |
| The scene itself contains no text. Title and number come only from the runtime (section 5) | all |
| Pauses when the tab is hidden | all |
| At most 30 frames per second | all |
| Network requests only for the feed and skin images | all |

| Size | Limit |
|---|---|
| A skin loaded by address, images only | 3 MB |
| A skin loaded by address, with video | 20 MB |
| A skin packed inside a host app | 200 KB, no video |
| One image | 2400 px on the long side, WebP |
| One video | 1920 px on the long side, 10 seconds, no sound, loops without a visible seam |

## 11. Safety

- **Validate before use.** The runtime checks every feed against section 3 and passes on only what conforms.
- **Never insert feed data as HTML.** Strings from a feed are data, not markup.
- **The title is plain text**, at most 40 characters. It is never treated as markup.
- **Skin files come from the address in the config file.** It cannot be changed through address parameters.
- **A skin names its files by plain file name.** No URLs, and no paths that leave the skin's folder.
- **A server that renders or relays must not fetch addresses supplied by visitors.**
- **Hosts should isolate companions they did not make**, for example in a sandboxed frame.

## 12. Versions

- `spec` in a feed is the major version. It changes only when old feeds would stop working.
- New optional fields may be added without changing `spec`. Companions ignore fields they do not know.
- This document carries its own version (0.1.x while in draft).

## 13. Open questions

- The scale for `rise`. Values with very different volatility should still read as the same slope.
- Whether `better` stays.
- The boundaries of the conditions in section 3.7, and whether a viewer may adjust the `flat` range.
- How a case table handles many values.
- The rule that keeps conditions from flickering at a boundary (3.7) remembers the previous state. How to square it with the fifth principle in section 2. A still image is judged with no previous state.
- The list of effects.
- The fields of `skin.json`.
- The exact signature of `draw`.
