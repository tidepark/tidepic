import { start } from "../../runtime/src/index.js";

// A companion made with a case table has no drawing code. The runtime shows the scenes.
// 경우표로 만든 컴패니언에는 그리기 코드가 없다. 런타임이 장면을 보여 준다.
start({ canvas: document.getElementById("scene") });
