# Writing a tidepic feed

A guide for AI assistants and for people. [한국어](GUIDE.ko.md) · [The spec](SPEC.md) · [Feed checker](check.html)

A feed is one JSON object. A companion reads it and draws a scene. This guide covers what most feeds need. The [spec](SPEC.md) has the rest and is the one to follow when the two differ.

> **If you want an AI assistant to write the feed for you**, give it the address of this page and say what you want to show. For example: "Read https://tidepic.com/GUIDE.md and write a tidepic feed for my daily steps, with a goal of 10,000."

## 1. The smallest feed

```json
{ "spec": 1, "values": [{ "value": 62, "to": 100 }] }
```

`spec` is always `1`. `values` has at least one value, and each value needs `value`.

## 2. Send the numbers as they are

Do not turn a number into 0 to 1 or into a percentage before sending it. Send the number itself and, next to it, what it should be read against. The runtime does the dividing.

| Field | What to put | Example (steps) | Example (price) |
|---|---|---|---|
| `value` | The number now | 6200 | 71200 |
| `from` | Where the range starts. Leave out for 0 | | day low |
| `to` | Where the range ends | goal 10000 | day high |
| `base` | The point that rise and fall are measured from | | previous close |
| `scale` | How large a move from `base` counts as a full move | | usual daily range |
| `rate` | How fast the number is changing, per unit of time | | change per minute |
| `rateScale` | How large a `rate` counts as fast, in the same units | | usual change per minute |
| `unit` | Text shown right after the number, up to 8 characters | ` steps` | |
| `format` | `"duration"` shows seconds as `9:00` | | |
| `state` | The state of this value alone (section 4) | | |
| `history` | Past values, oldest first, up to 60 | | |
| `every` | Seconds between the values in `history` | | |

A range has a direction. `"from": 30, "to": 0` is days left, counting down from 30 to 0.

## 3. Which fields for which kind of number

**Progress toward a goal.** `value` and `to`.

```json
{ "spec": 1, "values": [{ "value": 6200, "to": 10000, "unit": " steps" }] }
```

**Days left.** `value` is the days left, `from` the total, `to` is 0. If there is no server, a companion can count by itself from its address: `?until=2026-12-25`.

```json
{ "spec": 1, "values": [{ "value": 12, "from": 30, "to": 0 }] }
```

**Something that rises and falls.** `base` and `scale` say how far up or down it is. `rate` and `rateScale` say which way it is moving now.

```json
{
  "spec": 1,
  "values": [{ "value": 71200, "base": 70500, "scale": 1400, "rate": 50, "rateScale": 150 }]
}
```

**On and off.** 1 and 0 with `"to": 1`. A value in between is partly on.

```json
{ "spec": 1, "values": [{ "value": 1, "to": 1 }, { "value": 0, "to": 1 }, { "value": 1, "to": 1 }] }
```

**Several things side by side.** One value each, in an order that stays the same from feed to feed. Companions keep that order, so a viewer can tell which is which by its place.

```json
{
  "spec": 1,
  "values": [{ "value": 14, "to": 20 }, { "value": 0, "to": 20 }, { "value": 23, "to": 20 }]
}
```

**With past values.** `history` holds the past, oldest first. The current number stays in `value` and is not repeated.

```json
{
  "spec": 1,
  "values": [{ "value": 6200, "to": 10000, "history": [1200, 900, 2400, 5100, 7300], "every": 3600 }]
}
```

## 4. What kind of moment it is

`state` says that the numbers should be read differently for now. It can be on the feed, on a value, or both.

| `state` | Use it when |
|---|---|
| `"live"` | Things are in progress. The default, so it can be left out |
| `"idle"` | Resting: market closed, under maintenance |
| `"done"` | Finished |
| `"fault"` | Broken: a failed sensor, a server that is down |

```json
{
  "spec": 1,
  "values": [{ "value": 1, "to": 1 }, { "value": 0, "to": 1, "state": "idle" }, { "value": 0, "to": 1, "state": "fault" }]
}
```

How much, how fast and how well are numbers, not states. Do not invent states. One that is not in the table is ignored.

`event` marks a moment that just happened, such as a goal being reached. `type` is a short lowercase word and `at` is a Unix time in seconds. A new `at` means a new event.

```json
{ "spec": 1, "values": [{ "value": 20, "to": 20 }], "event": { "type": "reached", "index": 0, "at": 1794787200 } }
```

## 5. Optional parts

`view` carries the sender's wishes about display, and `meta` carries facts about the feed itself. Both can be left out.

```json
{
  "spec": 1,
  "values": [{ "value": 18.5, "unit": "°C", "rate": -0.4, "rateScale": 2 }],
  "view": { "title": "Seoul", "num": true },
  "meta": { "ttl": 600, "at": 1794787200, "credit": "Based on data from MET Norway" }
}
```

- `view.title` is up to 40 characters. `view.num` shows or hides the number. `view.skin` picks one of the companion's skins by name.
- `meta.ttl` is the least number of seconds before the feed should be asked for again.
- What is written in the companion's address wins over `view`.

## 6. Limits

| What | Limit |
|---|---|
| The whole feed | 16 KB |
| `values` | 64 |
| Text | 64 characters, 8 for `unit`, 40 for `view.title` |
| `history` | 60 per value |

Numbers must be finite. Text cannot contain `<`, `>` or an address. Anything over a limit or of the wrong type is dropped, not repaired, and the rest of the feed is still used.

## 7. Serving a feed

A companion takes its numbers from one of these.

| How | Address of the companion ends with |
|---|---|
| Numbers written in the address | `?v=62&to=100`, several as `?v=92,102` |
| A date | `?until=2026-12-25` |
| A feed address | `?data=https://example.com/feed.json` |

For a feed address:

- It must be `https`.
- The response must allow other sites to read it: `Access-Control-Allow-Origin: *`.
- By default it is asked for once a minute, and never more often than every 10 seconds. `meta.ttl` sets a longer wait.
- If the feed address has its own `?` or `&`, write them as `%3F` and `%26`.
- The request carries no cookies, so the feed cannot depend on a login.

Numbers written in an address can be read by anyone who sees that address. Use a feed address for numbers that should not travel in links.

## 8. Common mistakes

- **Sending 0.62 instead of 6200 with a goal of 10000.** With no range a companion has nothing to read 0.62 against, and the number shown is 0.62. Send the real number and `to`.
- **`base` with nothing to divide by.** Add `scale`, or a range (`from`, `to`).
- **`rate` without `rateScale`.** The direction cannot be worked out.
- **Numbers as text.** `"value": "62"` is not a number, and a feed with such a value is rejected. Other fields written as text are dropped.
- **Field names from before version 0.2.** `low`, `high`, `momentum`, `better`, a top-level `ttl`, and `now` and `total` in `step` are not read. Use `from`, `to`, `rate` with `rateScale`, `meta.ttl`, and `value` and `to` in `step`.
- **Putting a stage into `values`.** "Third quarter of four" is `"step": { "value": 3, "to": 4 }`. The number of values decides the kind of scene.
- **Changing the order of `values`.** Viewers know which is which by its place.
- **Words in the feed that describe the scene.** A feed says what the numbers are, not how to draw them. A companion decides the drawing.

## 9. Check before you hand it over

- Paste the feed into the [feed checker](check.html). It shows what was dropped and what a companion will draw from.
- In JavaScript, the same check is `validateFeed` in [`runtime/src/validate.js`](runtime/src/validate.js). `computeFeed` in `runtime/src/compute.js` gives the values a companion draws from, and `checkFeed` in `runtime/src/check.js` lists what could not be worked out.

## 10. Making a companion

There is a separate guide: [Making a companion](COMPANION.md). To have an AI assistant build one, give it that page's address (`https://tidepic.com/COMPANION.md`) and describe the scene.
