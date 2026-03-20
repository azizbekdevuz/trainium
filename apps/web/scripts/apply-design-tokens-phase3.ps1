$root = Join-Path (Join-Path $PSScriptRoot "..") "src"
$files = Get-ChildItem -Path $root -Recurse -Filter "*.tsx" -File | Where-Object {
  $_.FullName -notmatch '[\\/]app[\\/]api[\\/]'
}

$replacements = @(
  @{ From = 'rounded-2xl border bg-white p-'; To = 'glass-surface rounded-2xl border border-[var(--border-default)] p-' }
  @{ From = 'rounded-2xl border bg-white '; To = 'glass-surface rounded-2xl border border-[var(--border-default)] ' }
  @{ From = 'rounded-xl border bg-white p-'; To = 'glass-surface rounded-xl border border-[var(--border-default)] p-' }
  @{ From = '<section className="rounded-2xl border bg-white'; To = '<section className="glass-surface rounded-2xl border border-[var(--border-default)]' }
)

$n = 0
foreach ($f in $files) {
  $c = [IO.File]::ReadAllText($f.FullName)
  $orig = $c
  foreach ($r in $replacements) {
    $c = $c.Replace($r.From, $r.To)
  }
  if ($c -ne $orig) {
    [IO.File]::WriteAllText($f.FullName, $c)
    $n++
  }
}
Write-Host "Phase3 updated $n files"
