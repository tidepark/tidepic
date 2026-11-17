// 언어 링크를 누르면 고른 언어를 일 년 동안 기억한다(쿠키 lang).
// 첫 페이지는 이 쿠키를 먼저 보고, 없으면 브라우저의 언어를 본다(index.html 의 머리).
document.addEventListener("click", (event) => {
  const link = event.target.closest?.("a[data-lang]");
  if (link) document.cookie = `lang=${link.dataset.lang}; path=/; max-age=31536000; samesite=lax`;
});
