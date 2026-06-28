function renderPairPage({ token = null, error = null }) {
  if (error) {
    const msg =
      error === 'invalid'
        ? '코드가 만료되었거나 잘못되었습니다.'
        : '연결에 실패했습니다.'
    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="2;url=/?pair_error=${encodeURIComponent(error)}">
  <title>cursor_mobile — 연결</title>
  <style>
    body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
      background:#0f0f0f; color:#eee; font-family:-apple-system,sans-serif; padding:24px; text-align:center; }
    p { color:#aaa; line-height:1.5; }
  </style>
</head>
<body>
  <div>
    <p>${msg}<br>잠시 후 연결 화면으로 이동합니다…</p>
    <p><a href="/?pair_error=${encodeURIComponent(error)}" style="color:#6eb6ff">바로 이동</a></p>
  </div>
</body>
</html>`
  }

  const safeToken = JSON.stringify(token)
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>cursor_mobile — 연결 중</title>
  <style>
    body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
      background:#0f0f0f; color:#eee; font-family:-apple-system,sans-serif; }
    p { color:#888; }
  </style>
</head>
<body>
  <p>연결 중…</p>
  <script>
    (function () {
      var t = ${safeToken};
      try { localStorage.setItem('cm_token', t); } catch (_) {}
      location.replace('/#cm=' + encodeURIComponent(t));
    })();
  </script>
</body>
</html>`
}

module.exports = { renderPairPage }
