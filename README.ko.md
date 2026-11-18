# tidepic

**숫자를 차트 대신 장면으로 보여 주기 위한 규칙.**
장면은 정확한 숫자보다 지금의 분위기를 읽기 위한 것입니다.

[English](README.md) · [tidepic.com](https://tidepic.com/ko.html) · [갤러리 (Tidepark)](https://tidepark.com/ko/gallery) · [피드 확인기](https://tidepic.com/check.ko.html)

[![같은 JSON 한 줄을 읽는 여섯 칸. 흔히 보는 숫자판과 장면 다섯(꽃병, 표정, 모닥불, 도서관, 대나무숲).](https://tidepark.com/og/tidepic.jpg)](https://tidepic.com/ko.html)

## 한 줄이 장면이 됩니다

컴패니언은 작은 JSON 문서를 읽어 화면에 띄워 둘 장면으로 바꿉니다. 그 숫자가 무엇을 뜻하는지는 모릅니다.

```json
{ "spec": 1, "values": [ { "value": 62, "to": 100 } ] }
```

100 가운데 62 가 물 잔이든, 읽은 쪽수든, 지난 날이든 장면은 같습니다. 무엇을 뜻하는지는 데이터를 보내는 쪽이 정합니다.

숫자가 바뀌면 장면이 따라 바뀝니다. 아래는 같은 장면에 95, 50, 5 를 준 것입니다.

<table>
<tr><td><img src="https://tidepark.com/c/vase.jpg?v=95&to=100&w=480&h=320" width="260" alt="꽃병, 95: 꽃이 생생하다"></td><td><img src="https://tidepark.com/c/vase.jpg?v=50&to=100&w=480&h=320" width="260" alt="꽃병, 50: 꽃이 조금 시들었다"></td><td><img src="https://tidepark.com/c/vase.jpg?v=5&to=100&w=480&h=320" width="260" alt="꽃병, 5: 꽃이 말랐다"></td></tr>
<tr><td><img src="https://tidepark.com/c/face.jpg?v=95&to=100&w=480&h=320" width="260" alt="표정, 95: 활짝 웃는다"></td><td><img src="https://tidepark.com/c/face.jpg?v=50&to=100&w=480&h=320" width="260" alt="표정, 50: 무표정"></td><td><img src="https://tidepark.com/c/face.jpg?v=5&to=100&w=480&h=320" width="260" alt="표정, 5: 운다"></td></tr>
<tr><td><img src="https://tidepark.com/c/campfire.jpg?v=95&to=100&w=480&h=320" width="260" alt="모닥불, 95: 불이 높다"></td><td><img src="https://tidepark.com/c/campfire.jpg?v=50&to=100&w=480&h=320" width="260" alt="모닥불, 50: 불이 중간이다"></td><td><img src="https://tidepark.com/c/campfire.jpg?v=5&to=100&w=480&h=320" width="260" alt="모닥불, 5: 불이 작다"></td></tr>
<tr><td align="center">95</td><td align="center">50</td><td align="center">5</td></tr>
</table>

위 그림들은 저장소에 든 파일이 아닙니다. 장면의 주소 끝에 `.jpg`를 붙여 그 자리에서 받아 온 것입니다. 예: `https://tidepark.com/c/vase.jpg?v=62&to=100`

## 써 보기

1. **피드를 씁니다.** [피드 쓰는 법](GUIDE.ko.md)에 항목과 본보기, 흔한 실수가 있습니다.
2. **확인합니다.** [피드 확인기](https://tidepic.com/check.ko.html)에 붙여 넣으면 규칙에 맞는지와, 장면이 어떤 값으로 그리게 되는지를 보여 줍니다.
3. **장면에 잇습니다.** [갤러리](https://tidepark.com/ko/gallery)에서 장면을 고르고 피드 주소를 적으면 주소 하나가 나옵니다. 그 주소를 브라우저 탭이나 키오스크 화면에 띄워 둡니다.

AI 에게 맡기려면 `https://tidepic.com/GUIDE.ko.md`를 주고 무엇을 보여 주고 싶은지 말하면 됩니다. 읽을 것을 모아 둔 [`llms.txt`](llms.txt)도 있습니다.

터미널에서는 [tidetop](https://github.com/tidepark/tidetop) 이 피드를 장면으로 그립니다: `npx tidetop --data <피드 주소> --scene library`. `--data` 없이 띄우면 컴퓨터에 남은 여유를 보여 줍니다.

## 새 장면 만들기

장면(컴패니언)은 두 가지로 만들 수 있습니다. 그림 몇 장과 경우표로 만들거나, 그리기 코드를 직접 짭니다. [컴패니언 만드는 법](COMPANION.ko.md)에 순서가 있습니다. AI 에게 맡길 때는 `https://tidepic.com/COMPANION.ko.md`를 주고 어떤 장면을 바라는지 말합니다.

- [`examples/table/`](examples/table)은 경우표와 그림 몇 장으로 만든 본보기입니다. 그리기 코드가 없습니다. [tidepic.com/examples/table/](https://tidepic.com/examples/table/?v=20&to=100&num=1)에서 돌고 있습니다.
- 직접 만들려면 이 폴더를 복사해 그림을 바꾸고 `scenes.json`을 고칩니다. 정적 파일 서버 아무것으로나 그 폴더를 열면 됩니다. 스킨이 Lottie 파일을 보여 준다면 `examples/vendor/`를 옆에 같이 둡니다. 페이지가 거기서 Lottie 재생기를 불러옵니다([lottie-web](https://github.com/airbnb/lottie-web), MIT).
- [`examples/code/`](examples/code)는 코드로 그린 본보기입니다. 그림 없이 `draw.js`로 물이 차오르는 작은 장면을 그립니다. [tidepic.com/examples/code/](https://tidepic.com/examples/code/?v=60&to=100)에서 돌고 있습니다. 직접 만들려면 이 폴더를 복사해 `draw.js`를 고칩니다.

## 이 저장소에 있는 것

| 파일 | 내용 |
|---|---|
| [SPEC.ko.md](SPEC.ko.md), [SPEC.md](SPEC.md) | 규칙. 컴패니언이 받는 데이터의 모양과 컴패니언을 꾸리는 규칙 |
| [GUIDE.ko.md](GUIDE.ko.md), [GUIDE.md](GUIDE.md) | 피드 쓰는 법 |
| [COMPANION.ko.md](COMPANION.ko.md), [COMPANION.md](COMPANION.md) | 컴패니언 만드는 법 |
| [`runtime/`](runtime) | 규칙에 적힌 것을 실제로 돌리는 실행기. 피드를 검사하고, 값을 계산하고, 조건을 판정하고, 컴패니언을 틉니다. 빌드 없이 쓰는 JavaScript 모듈이고 딸린 꾸러미가 없습니다(Lottie 를 틀 때만 `lottie-web`이 필요합니다). `npm test`로 테스트를 돌립니다 |
| [`examples/table/`](examples/table) | 경우표로 만든 본보기 컴패니언 |
| [`examples/code/`](examples/code) | 코드로 그린 본보기 컴패니언 |
| [CHANGELOG.md](CHANGELOG.md) | 바뀐 내용 |

tidepic 은 규칙의 이름이고, [Tidepark](https://tidepark.com)은 이 규칙으로 만든 컴패니언을 모아 보여 주는 곳입니다. tidepark.com 의 컴패니언은 이 저장소에 없습니다.

## 오르내리는 숫자

![기울어진 산악열차의 창가. 창밖으로 호수와 설산이 보이고, 손잡이는 똑바로 늘어져 있다.](scene.webp)

이건 주식 데이터일 수도,\
오늘 온도일 수도,\
이번 주 방문자일 수도 있습니다.

그 숫자가 오르면 열차는 오르막을, 내리면 내리막을 탑니다.

## 상태

초안입니다. 지금 판은 규칙 첫머리에 있습니다. 첫 공식 컴패니언들을 이 규칙에 맞춰 만든 뒤 1.0 으로 확정합니다. 실행기도 규칙처럼 초안이고 규칙과 함께 바뀝니다.

숫자를 장면으로 보여 주려는 시도는 전부터 있었습니다. tidepic 은 새로운 생각이 아니라 약속 하나를 적어 둔 것입니다. 앞서 있던 것들은 규칙 14절에 적었습니다.

> 이 프로젝트를 시작했고, 규칙 초안과 코드는 Claude 와 함께 썼습니다. 아직 거친 데가 많습니다. PR 과 의견은 언제든 환영합니다.

## 라이선스

규칙은 [CC BY 4.0](LICENSE.md) 을, 코드는 [MIT](LICENSE-MIT) 를 따릅니다. 규칙을 따라 만드는 것은 자유이고, 만든 것이 tidepic 을 따른다고 밝혀도 됩니다. "Tidepark"이라는 이름과 로고는 들어 있지 않습니다.
