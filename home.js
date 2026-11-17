// 첫 페이지의 네 칸. 숫자를 바꾸면 JSON 한 줄과 숫자판이 바로 바뀌고,
// 장면 셋은 손을 뗀 뒤에 같은 숫자로 다시 불러온다.
const range = document.getElementById("range");
const value = document.getElementById("value");
const reading = document.getElementById("reading");
const arc = document.getElementById("arc");
const frames = [...document.querySelectorAll("iframe[data-c]")];
const LENGTH = 150.8; // 숫자판 호의 길이

function show(v) {
  value.textContent = v;
  reading.textContent = v;
  arc.setAttribute("stroke-dashoffset", (LENGTH * (1 - v / 100)).toFixed(1));
}

function load(v) {
  for (const frame of frames) {
    const query = new URLSearchParams(frame.dataset.q);
    query.set("v", v);
    query.set("to", "100");
    frame.src = `https://tidepark.com/c/${frame.dataset.c}?${query}`;
  }
}

range.addEventListener("input", () => show(Number(range.value)));
range.addEventListener("change", () => load(Number(range.value)));
