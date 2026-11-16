# tidepic

**Rules for showing numbers as scenes instead of charts.**

[한국어](README.ko.md)

A companion that follows tidepic turns live numbers into a scene you can leave on screen. A countdown becomes petals on a flower. A step count becomes rising water. A price becomes the slope of a mountain railway.

This repository holds the **tidepic spec**: the data format a companion receives and the rules for packaging one.

tidepic is the name of the rules. [Tidepark](https://tidepark.com) is the place that shows companions built with them.

- [SPEC.md](SPEC.md) — the spec (English)
- [SPEC.ko.md](SPEC.ko.md) — the spec (Korean)
- [CHANGELOG.md](CHANGELOG.md)

## The idea in one example

A companion reads a small JSON document. It does not know what the numbers mean.

```json
{ "spec": 1, "values": [ { "value": 5, "high": 8 } ] }
```

Five glasses of water out of eight, five chapters out of eight, five days out of eight — the scene is the same. Whoever sends the data decides what it stands for.

## Status

Draft 0.1. The spec will be fixed at 1.0 after the first official companions are built against it.

Companions built with these rules are at [tidepark.com/gallery](https://tidepark.com/gallery).

Showing numbers as scenes is not a new idea. tidepic only writes down one set of conventions. Section 14 of the spec lists the work that came before.

## License

The spec is licensed under [CC BY 4.0](LICENSE.md). You are free to implement it, and to say that what you built follows tidepic. The name "Tidepark" and its logos are not covered.
