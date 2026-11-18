// 방문 통계(Google Analytics). tidepic.com 의 안내 페이지와 확인기에만 싣는다.
// examples/ 의 본보기 컴패니언은 이 파일을 부르지 않는다.
// index.html 이 다른 언어 페이지로 보내는 중이면 건너뛴다(한 번 온 것을 두 번 세지 않게).
(function () {
  if (window.tidepicLeaving) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  // 첫 페이지가 이 페이지로 보냈으면, 그 전에 있던 곳을 들어온 곳으로 알린다.
  // 태그는 페이지에서 건넨 값을 받지 않고 document.referrer 를 읽으므로, 그 값을 바꿔 둔다.
  try {
    var from = sessionStorage.getItem("cameFrom");
    sessionStorage.removeItem("cameFrom");
    if (from) Object.defineProperty(document, "referrer", { get: function () { return from; } });
  } catch (e) {}
  var tag = document.createElement("script");
  tag.async = true;
  tag.src = "https://www.googletagmanager.com/gtm.js?id=GTM-TVS94Z25";
  document.head.appendChild(tag);
})();
