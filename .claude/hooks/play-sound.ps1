# Reproduce el aviso sonoro de Claude Code (hooks Stop y Notification).
$mp3 = Join-Path $PSScriptRoot '..\..\..\claudecode-finished.mp3'
if (-not (Test-Path $mp3)) { exit 0 }

Add-Type -AssemblyName PresentationCore
$player = New-Object System.Windows.Media.MediaPlayer
$player.Open([uri](Resolve-Path $mp3).Path)

# Espera a que cargue la duración (máx ~2 s).
$waited = 0
while (-not $player.NaturalDuration.HasTimeSpan -and $waited -lt 2000) {
  Start-Sleep -Milliseconds 50
  $waited += 50
}

$player.Play()
$ms = if ($player.NaturalDuration.HasTimeSpan) { $player.NaturalDuration.TimeSpan.TotalMilliseconds } else { 3000 }
Start-Sleep -Milliseconds ([int]$ms + 200)
$player.Close()
