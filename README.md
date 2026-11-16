# Tidepark

**Where numbers become scenery.**

[한국어](README.ko.md)

Tidepark turns live data into scenes you can leave on screen. A step count becomes petals on a flower. A countdown becomes falling leaves. A price becomes the slope of a mountain railway.

This repository holds the **Tidepark Spec**: the data format a companion receives and the rules for packaging one.

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

Official companions are published at [tidepark.com](https://tidepark.com) (not open yet).

## License

The spec is licensed under [CC BY 4.0](LICENSE.md). You are free to implement it. The name "Tidepark" and its logos are not covered.
