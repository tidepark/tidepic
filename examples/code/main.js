import { start } from "../../runtime/src/index.js";
import { draw } from "./draw.js";

// A companion made with code hands its drawing function to the runtime.
// 코드로 만든 컴패니언은 그리기 함수를 런타임에 넘긴다.
start({ canvas: document.getElementById("scene"), draw });
