# tidepic

**Rules for showing numbers as scenes instead of charts.**
A scene is for reading the mood, not the exact number.

[한국어](README.ko.md) · [tidepic.com](https://tidepic.com) · [Gallery (Tidepark)](https://tidepark.com/gallery) · [Feed checker](https://tidepic.com/check.html) · [Make a companion](https://tidepic.com/make.html)

[![Six panels reading the same line of JSON: the usual readout and five scenes (a vase, a face, a campfire, a library, bamboo).](https://tidepark.com/og/tidepic.jpg)](https://tidepic.com)

## One line becomes a scene

A companion reads a small JSON document and turns it into a scene you can leave on screen. It does not know what the number means.

```json
{ "spec": 1, "values": [ { "value": 62, "to": 100 } ] }
```

62 glasses of water out of 100, 62 pages, 62 days: the scene is the same. Whoever sends the data decides what it stands for.

When the number changes, the scene follows. Below, the same scenes are given 95, 50 and 5.

<table>
<tr><td><img src="https://tidepark.com/c/vase.jpg?v=95&to=100&w=480&h=320" width="260" alt="Vase at 95: the flower is fresh"></td><td><img src="https://tidepark.com/c/vase.jpg?v=50&to=100&w=480&h=320" width="260" alt="Vase at 50: the flower is wilting"></td><td><img src="https://tidepark.com/c/vase.jpg?v=5&to=100&w=480&h=320" width="260" alt="Vase at 5: the flower has dried"></td></tr>
<tr><td><img src="https://tidepark.com/c/face.jpg?v=95&to=100&w=480&h=320" width="260" alt="Face at 95: a wide smile"></td><td><img src="https://tidepark.com/c/face.jpg?v=50&to=100&w=480&h=320" width="260" alt="Face at 50: a plain look"></td><td><img src="https://tidepark.com/c/face.jpg?v=5&to=100&w=480&h=320" width="260" alt="Face at 5: crying"></td></tr>
<tr><td><img src="https://tidepark.com/c/campfire.jpg?v=95&to=100&w=480&h=320" width="260" alt="Campfire at 95: tall flames"></td><td><img src="https://tidepark.com/c/campfire.jpg?v=50&to=100&w=480&h=320" width="260" alt="Campfire at 50: a medium fire"></td><td><img src="https://tidepark.com/c/campfire.jpg?v=5&to=100&w=480&h=320" width="260" alt="Campfire at 5: a small flame"></td></tr>
<tr><td align="center">95</td><td align="center">50</td><td align="center">5</td></tr>
</table>

These pictures are not files in this repository. Each one is fetched as it is shown, by adding `.jpg` to the end of a scene's address. For example: `https://tidepark.com/c/vase.jpg?v=62&to=100`

## Try it

1. **Write a feed.** [Writing a feed](GUIDE.md) has the fields, examples and common mistakes.
2. **Check it.** Paste it into the [feed checker](https://tidepic.com/check.html) to see whether it follows the rules and what values a scene would draw with.
3. **Connect it to a scene.** Pick a scene in the [gallery](https://tidepark.com/gallery), enter the address of your feed, and you get one address. Leave that address open in a browser tab or on a kiosk screen.

To have an AI assistant do it, give it `https://tidepic.com/GUIDE.md` and say what you want to show. [`llms.txt`](llms.txt) lists what to read.

In a terminal, [tidetop](https://github.com/tidepark/tidetop) draws a feed as a scene: `npx tidetop --data <feed address> --scene library`. Without `--data` it shows how much room the computer has left.

## Making a new scene

A scene (a companion) can be made in two ways: from a few pictures and a case table, or with drawing code of your own. [Making a companion](COMPANION.md) has the steps. With an AI assistant, give it `https://tidepic.com/COMPANION.md` and describe the scene.

- [`examples/table/`](examples/table) is an example made with a case table and a few pictures. It has no drawing code. It runs at [tidepic.com/examples/table/](https://tidepic.com/examples/table/?v=20&to=100&num=1).
- To make your own, copy that folder, replace the pictures, and edit `scenes.json`. Serve the folder with any static file server. If a skin shows a Lottie file, keep `examples/vendor/` next to it: the page loads the Lottie player from there ([lottie-web](https://github.com/airbnb/lottie-web), MIT).
- [`examples/code/`](examples/code) is an example drawn with code: a small water scene in `draw.js`, with no pictures. It runs at [tidepic.com/examples/code/](https://tidepic.com/examples/code/?v=60&to=100). To make your own, copy the folder and change `draw.js`.

## What is in this repository

| File | What it is |
|---|---|
| [SPEC.md](SPEC.md), [SPEC.ko.md](SPEC.ko.md) | The spec: the data format a companion receives and the rules for packaging one |
| [GUIDE.md](GUIDE.md), [GUIDE.ko.md](GUIDE.ko.md) | Writing a feed |
| [COMPANION.md](COMPANION.md), [COMPANION.ko.md](COMPANION.ko.md) | Making a companion |
| [`runtime/`](runtime) | The runtime that plays what the spec describes. It checks a feed, computes the values, judges the conditions, and plays a companion. Plain JavaScript modules with no build step and no dependencies (playing a Lottie file is the one exception: it needs `lottie-web`). `npm test` runs its tests |
| [`examples/table/`](examples/table) | An example companion made with a case table |
| [`examples/code/`](examples/code) | An example companion drawn with code |
| [CHANGELOG.md](CHANGELOG.md) | What changed |

tidepic is the name of the rules. [Tidepark](https://tidepark.com) is the place that shows companions built with them. The companions on tidepark.com are not in this repository.

## Numbers that rise and fall

![A window seat on a tilted mountain train. A lake and snowy peaks pass outside, and the hand straps hang straight down.](scene.webp)

This could be a stock price,\
or today's temperature,\
or this week's visitors.

When that number climbs, the train heads uphill. When it falls, downhill.

## Status

A draft. The current version is at the top of the spec. The spec will be fixed at 1.0 after the first official companions are built against it. The runtime is a draft like the spec and changes with it.

Showing numbers as scenes is not a new idea. tidepic only writes down one set of conventions. Section 14 of the spec lists the work that came before.

> I started this project, and drafted the spec and wrote the code with Claude. Still rough around the edges. PRs and feedback are always welcome.

## License

The spec is licensed under [CC BY 4.0](LICENSE.md), and the code under [MIT](LICENSE-MIT). You are free to implement it, and to say that what you built follows tidepic. The name "Tidepark" and its logos are not covered.
