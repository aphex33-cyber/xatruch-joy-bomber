$ErrorActionPreference = "Stop"

$distDir = Join-Path $PSScriptRoot "dist-itch"
$zipPath = Join-Path $PSScriptRoot "xatruch-joy-bomber-itch.zip"

if (Test-Path $distDir) {
  Remove-Item -Recurse -Force $distDir
}
if (Test-Path $zipPath) {
  Remove-Item -Force $zipPath
}

New-Item -ItemType Directory -Path $distDir | Out-Null
Copy-Item -Recurse -Path (Join-Path $PSScriptRoot "assets") -Destination (Join-Path $distDir "assets")
Copy-Item -Recurse -Path (Join-Path $PSScriptRoot "css") -Destination (Join-Path $distDir "css")
Copy-Item -Recurse -Path (Join-Path $PSScriptRoot "src") -Destination (Join-Path $distDir "src")

$portalHtml = @'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Xatruch Joy Bomber</title>
  <script>
    window.__PORTAL_LANG__ = 'en';
  </script>
  <link rel="stylesheet" href="css/style.css">
  <style>
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #090d16;
    }
    .game-container {
      max-width: 100vw;
      width: 100vw;
      height: 100vh;
      height: 100dvh;
      border-radius: 0;
      border: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .game-header {
      flex-shrink: 0;
    }
    canvas#gameCanvas {
      flex: 1 1 auto;
      width: 100%;
      min-height: 0;
    }
    .touch-controls {
      flex-shrink: 0;
    }
  </style>
</head>
<body>
  <div class="game-container">
    <header class="game-header">
      <div class="brand-badge">
        <span>✈️</span>
        <span>XATRUCH JOY BOMBER</span>
      </div>
      <div class="header-actions">
        <button id="btnMenu" class="btn-pill">🏠 Menu</button>
        <button id="btnPause" class="btn-pill">⏸️ Pause</button>
        <button id="btnMode" class="btn-pill">📖 Mode: Story</button>
        <button id="btnDifficulty" class="btn-pill">🎚️ Easy</button>
        <button id="btnHangar" class="btn-pill">✈️ Hangar</button>
        <button id="btnFullscreen" class="btn-pill">⛶ Fullscreen</button>
        <button id="btnMute" class="btn-pill">🔊 Audio: ON</button>
        <button id="btnLang" class="btn-pill">🌐 EN</button>
      </div>
    </header>

    <canvas id="gameCanvas" width="960" height="520"></canvas>

    <div class="touch-controls">
      <div class="carousel-buttons">
        <button id="btnPrev" class="ctrl-btn">◀ [Q] Prev</button>
        <button id="btnNext" class="ctrl-btn">[E] Next ▶</button>
      </div>
      <button id="btnDrop" class="ctrl-btn ctrl-btn-primary">🚀 DROP [SPACE]</button>
    </div>
  </div>

  <script type="module" src="src/main.js"></script>
</body>
</html>
'@

Set-Content -Path (Join-Path $distDir "index.html") -Value $portalHtml -Encoding UTF8
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($distDir, $zipPath)
Write-Host "itch.io / Newgrounds package ready at: $zipPath"
