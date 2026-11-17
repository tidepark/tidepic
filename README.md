# tidepic

**Rules for showing numbers as scenes instead of charts.**

[한국어](README.ko.md)

![A window seat on a tilted mountain train. A lake and snowy peaks pass outside, and the hand straps hang straight down.](scene.webp)

This could be a stock price,\
or today's temperature,\
or today's weight,\
or today's step count.

When that number climbs, the train heads uphill. When it falls, downhill.

> I started this project, and drafted the spec and wrote the code with Claude. Still rough around the edges — PRs and feedback are always welcome.

A companion that follows tidepic turns changing numbers into a scene you can leave on screen. A countdown becomes petals on a flower. A step count becomes rising water. A price becomes the slope of a mountain railway.

This repository holds the **tidepic spec**: the data format a companion receives and the rules for packaging one.

tidepic is the name of the rules. [Tidepark](https://tidepark.com) is the place that shows companions built with them.

- [SPEC.md](SPEC.md) — the spec (English)
- [SPEC.ko.md](SPEC.ko.md) — the spec (Korean)
- [CHANGELOG.md](CHANGELOG.md)

## The idea in one example

A companion reads a small JSON document. It does not know what the numbers mean.

```json
{ "spec": 1, "values": [ { "value": 5, "to": 8 } ] }
```

Five glasses of water out of eight, five chapters out of eight, five days out of eight — the scene is the same. Whoever sends the data decides what it stands for.

## Runtime and an example

The repository also holds the runtime that plays what the spec describes.

- [`runtime/`](runtime) reads a feed, checks it, computes the values, judges the conditions, and plays a companion. A companion can be a case table with a few pictures, or drawing code of your own. It is plain JavaScript modules with no build step and no dependencies. Playing a Lottie file is the one exception: it needs the `lottie-web` package and a bundler.
- [`examples/table/`](examples/table) is a companion made with a case table and a few pictures. It has no drawing code. It runs at [tidepic.com/examples/table/](https://tidepic.com/examples/table/). Add `?v=20&to=100&num=1` to the address to give it a number.
- To make your own, copy `examples/table/`, replace the pictures, and edit `scenes.json`. Serve the folder with any static file server.
- `npm test` runs the runtime's tests.

The runtime is a draft like the spec and changes with it. The companions on tidepark.com are not in this repository.

## Status

A draft. The current version is at the top of the spec. The spec will be fixed at 1.0 after the first official companions are built against it.

Companions built with these rules are at [tidepark.com/gallery](https://tidepark.com/gallery).

To see whether a feed follows the rules and what values a companion would draw with, paste it into the [feed checker](https://tidepic.com/check.html). It uses the same runtime.

For writing a feed, there is a short [guide](GUIDE.md) with examples and common mistakes. It is written so that an AI assistant can follow it too. If you work with one, give it `https://tidepic.com/GUIDE.md` (or [`llms.txt`](llms.txt), which lists what to read) and say what you want to show.

Showing numbers as scenes is not a new idea. tidepic only writes down one set of conventions. Section 14 of the spec lists the work that came before.

## License

The spec is licensed under [CC BY 4.0](LICENSE.md), and the code under [MIT](LICENSE-MIT). You are free to implement it, and to say that what you built follows tidepic. The name "Tidepark" and its logos are not covered.
