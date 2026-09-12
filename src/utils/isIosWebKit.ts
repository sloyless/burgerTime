/** iOS Safari / in-app WebViews — Firestore IndexedDB persistence is often slow on first load. */
export function isIosWebKit(): boolean {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;
  const isClassicIos = /iPad|iPhone|iPod/.test(ua);
  const isIpadOs =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

  return isClassicIos || isIpadOs;
}
