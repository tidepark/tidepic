# Making a tidepic companion

A guide for AI assistants and for people. [한국어](COMPANION.ko.md) · [Writing a feed](GUIDE.md) · [The spec](SPEC.md)

A companion is a web page that reads a feed and shows it as a scene. This guide covers what is needed to make one. The [spec](SPEC.md) has the rest and is the one to follow when the two differ.

> **If you want an AI assistant to build a companion for you**, give it the address of this page and describe the scene. For example: "Read https://tidepic.com/COMPANION.md and make a tidepic companion: a lighthouse whose light gets brighter as the number fills."

## 1. What you are making

A static bundle. It needs no server and can be hosted wherever static files can be.

```
index.html              entry point, with one canvas
main.js                 starts the runtime
companion.json          what the companion is and what it reads
tidepic.config.json     default settings
draw.js                 drawing code (only when made by code)
skins/<skin>/           one folder per skin
  scenes.json           a case table, or
  skin.json             images and layout numbers for drawing code
```

The runtime is in this repository under [`runtime/`](runtime/). It fetches and checks the feed, works out the values to draw from, and draws the title and number. A companion only decides what the scene looks like.

## 2. Decide the mapping first

Before writing anything, write down what the numbers become. A companion does not know what a number means. It only knows how full it is, which way it is moving, and what state it is in.

| Decide | Examples |
|---|---|
| What one value becomes | one flower, one window, one lane, one stalk |
| What `fill` (0 to 1) becomes | how far a flower opens, how bright a light is, how high water stands |
| What 0 looks like | a bud, an unlit window. It should differ from "a little" |
| What happens past the range (`over`) | it grows past the frame, the water spills |
| What `rise` and `momentum` become, if used | altitude, the slope of a track, the strength of wind |
| How each state looks | `idle`: resting, dim. `done`: finished. `fault`: broken. `stale`: no news, the whole scene subdued |
| How many values it reads | 1, 2, or many (up to 64). With many, how the scene makes room |

Rules of thumb:

- **Keep the order of the feed.** Do not sort by size. A viewer tells which is which by its place.
- **Nothing changes place when a value changes.** Only size, amount or brightness changes.
- **It must read as a still frame.** Nothing that only motion can tell.
- **No text in the scene.** The title and the number come from the runtime.
- **Do not make it a chart in disguise.** Things lined up on one baseline at even spacing read as bars.

## 3. Two ways to make one

| Way | You write | Good for |
|---|---|---|
| Case table | `scenes.json`: which image to show in which case | A scene with a handful of looks. No code |
| Drawing code | `draw.js`: a function that draws on a 2D canvas | A scene that changes continuously, or holds many values |

## 4. A case table

Start from the [example](examples/table/). Copy the folder, replace the images, and edit `scenes.json`.

```json
{
  "slug": "shore",
  "name": { "en": "Shore", "ko": "바닷가" },
  "scenes": [
    { "when": { "state": ["idle", "done"] }, "show": "night.webp" },
    { "when": { "bound": "over" }, "show": "over.webp" },
    { "when": { "level": "full" }, "show": "full.webp" },
    { "when": { "level": "high" }, "show": "high.webp" },
    { "when": { "level": "low" }, "show": "low.webp" },
    { "show": "mid.webp" }
  ],
  "fade": 1
}
```

- Entries are tried from top to bottom, and the first whose `when` matches is shown. The last entry has no `when` and is required.
- Conditions have fixed names. `level` is `empty`, `low`, `mid`, `high` or `full`. `bound` is `under`, `inside` or `over`. `trend` is `fall`, `flat` or `rise`. `drift` is `down`, `still` or `up`. `pace` is `calm` or `brisk`. `state` is `live`, `idle`, `done`, `fault` or `stale`. Section 3.7 of the spec says how each is worked out.
- `show` is an image or a looping muted video. A video needs a `poster` image.
- `effects` adds moving pieces (`drift`, `fall`, `float`, `count`) whose amount can follow a value. Section 7.1 of the spec has the details.

`main.js` for a case table is one line:

```js
import { start } from "../../runtime/src/index.js";
start({ canvas: document.getElementById("scene") });
```

## 5. Drawing code

`main.js` passes the drawing function to the runtime:

```js
import { start } from "../../runtime/src/index.js";
import { draw } from "./draw.js";
start({ canvas: document.getElementById("scene"), draw });
```

```js
export function draw(ctx, { values, state, skin, width, height, time }) {
  // values[i]: { fill, over, under, rise, momentum, share, rank, history, state, raw }
}
```

- **Draw from the derived values**, not from the raw numbers. A value that cannot be worked out is `null`. `fill` is `null` when the feed gave no range, so decide what to draw then.
- **The same input gives the same picture.** Do not use `Math.random`. For variety, use a number worked out from the index, such as `frac(sin(i * 127.1 + k * 311.7) * 43758.5453)`.
- **Motion is a function of `time`** (seconds). Wind, blinking and drifting clouds are all worked out from `time` alone.
- The runtime eases a value into place when a new one arrives. The drawing code draws what it is given.
- `state` is the state of the whole feed, and `"stale"` means no news is arriving. Each value also has its own `state`.
- `skin.images.<name>` are the skin's images, already loaded. `skin.layout` holds the skin's numbers and the options a viewer chose.
- If an image is missing, still draw something.
- Fill the whole canvas at any aspect ratio. Check a small card and a tall phone screen.

`skin.json` for drawing code:

```json
{
  "slug": "harbor",
  "name": { "en": "Harbor", "ko": "항구" },
  "images": { "back": "back.webp", "boat": "boat.webp" },
  "layout": { "horizon": 0.62 },
  "options": { "boats": [1, 12], "light": ["day", "dusk"] }
}
```

`options` declares what a viewer may change: a list of words, a range of numbers, or `"color"`. A viewer sets one in the address as `skin.boats=6`.

## 6. Declaring the companion

```json
{
  "slug": "harbor",
  "name": { "en": "Harbor", "ko": "항구" },
  "spec": 1,
  "made": "code",
  "grade": "basic",
  "still": true,
  "reads": { "values": "many", "needs": ["fill"], "step": false, "events": [], "extra": [] },
  "skins": ["harbor"]
}
```

`made` is `"table"` or `"code"`. `reads.values` is `1`, `2` or `"many"`. `reads.needs` lists the derived values the companion cannot do without, so the runtime can warn when a feed lacks them.

`tidepic.config.json` holds the defaults:

```json
{ "data": "random", "every": 60, "skin": "harbor" }
```

## 7. Images

- A skin refers to its files by plain file name, inside its own folder. No URLs.
- WebP is suggested. One image is at most 2400 px on its long side, and a skin loaded by address is at most 3 MB of images.
- When the number or the size of things changes with the values, do not use one finished picture. Use a background and separate parts on a transparent background, and let the code place the parts.
- For stages of one thing, such as a flower from fresh to dry, make one base picture first and then change only that thing in it. The rest of the picture then matches from stage to stage.
- Keep the background quieter than the parts that carry the values, so the two are not confused.

## 8. Check

Serve this repository with any static file server and open the companion's folder, for example `python3 -m http.server` and then `http://localhost:8000/examples/table/`.

- With no parameters the companion runs on random numbers. Every companion must look right this way.
- With numbers in the address: `?v=62&to=100`, several as `?v=10,80,45&to=100`.
- With a feed: `?data=<address of a JSON file>`. Use one whose values have different states.
- With 1, 3, 12 and 64 values if it reads many.
- At a small card size and on a tall screen.
- Change a value a little and look at before and after side by side. Nothing should jump to another place.
- The browser console shows what the runtime dropped or could not work out.

## 9. Rules a companion keeps

- No network requests except for the feed and the files of its own bundle.
- Never insert text from a feed as HTML.
- Pause when the tab is hidden, and draw at most 30 frames per second.
- The scene contains no text.

Sections 10 and 11 of the [spec](SPEC.md) have the full lists.
