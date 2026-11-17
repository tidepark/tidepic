// 첫 페이지의 여섯 칸. 숫자를 바꾸면 JSON 한 줄과 숫자판이 바로 바뀌고,
// 장면 다섯은 손을 뗀 뒤에 같은 숫자로 다시 불러온다.
// 장면은 정지 그림 한 장으로 먼저 뜬다. 넓은 화면에서는 페이지가 다 뜬 뒤에 움직이는 장면을 얹고,
// 손가락으로 쓰는 화면에서는 누른 칸만 움직인다. 움직임을 줄이라고 해 둔 사람에게는 정지 그림만 보여 준다.
const range = document.getElementById("range");
const value = document.getElementById("value");
const reading = document.getElementById("reading");
const arc = document.getElementById("arc");
const scenes = [...document.querySelectorAll(".scene[data-c]")];
const LENGTH = 150.8; // 숫자판 호의 길이

const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const wide = window.matchMedia("(min-width: 761px) and (hover: hover)").matches;

function address(scene, v, picture) {
  const query = new URLSearchParams(scene.dataset.q);
  query.set("v", v);
  query.set("to", "100");
  if (picture) {
    query.set("w", "640");
    query.set("h", "480");
  }
  return `https://tidepark.com/c/${scene.dataset.c}${picture ? ".jpg" : ""}?${query}`;
}

function show(v) {
  value.textContent = v;
  reading.textContent = v;
  arc.setAttribute("stroke-dashoffset", (LENGTH * (1 - v / 100)).toFixed(1));
}

// 칸 하나를 움직이는 장면으로 바꾼다. 정지 그림은 밑에 그대로 두어, 장면이 뜨기 전에도 비지 않는다.
function play(scene) {
  let frame = scene.querySelector("iframe");
  if (!frame) {
    frame = document.createElement("iframe");
    frame.title = scene.dataset.title;
    frame.tabIndex = -1;
    scene.append(frame);
  }
  frame.src = address(scene, Number(range.value), false);
}

function load(v) {
  for (const scene of scenes) {
    scene.querySelector("img").src = address(scene, v, true);
    if (scene.querySelector("iframe")) play(scene);
  }
}

range.addEventListener("input", () => show(Number(range.value)));
range.addEventListener("change", () => load(Number(range.value)));

if (!still) {
  if (wide) {
    window.addEventListener("load", () => scenes.forEach(play));
  } else {
    for (const scene of scenes) scene.addEventListener("click", () => play(scene), { once: true });
  }
}
