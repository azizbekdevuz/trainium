# One-shot: map legacy Tailwind neutrals → semantic ui-* utilities (apps/web TSX only).
# Excludes app/api. Idempotent-ish: avoids double-replacing ui-* tokens.

$root = Join-Path (Join-Path $PSScriptRoot "..") "src"
$files = Get-ChildItem -Path $root -Recurse -Filter "*.tsx" -File | Where-Object {
  $_.FullName -notmatch '[\\/]app[\\/]api[\\/]'
}

$replacements = @(
  @{ From = 'text-gray-900'; To = 'text-ui-primary' }
  @{ From = 'text-gray-800'; To = 'text-ui-primary' }
  @{ From = 'text-gray-700'; To = 'text-ui-secondary' }
  @{ From = 'text-gray-600'; To = 'text-ui-muted' }
  @{ From = 'text-gray-500'; To = 'text-ui-faint' }
  @{ From = 'text-gray-400'; To = 'text-ui-faint' }
  @{ From = 'text-gray-300'; To = 'text-ui-faint' }
  @{ From = 'text-slate-900'; To = 'text-ui-primary' }
  @{ From = 'text-slate-800'; To = 'text-ui-primary' }
  @{ From = 'text-slate-700'; To = 'text-ui-secondary' }
  @{ From = 'text-slate-600'; To = 'text-ui-muted' }
  @{ From = 'text-slate-500'; To = 'text-ui-faint' }
  @{ From = 'text-slate-400'; To = 'text-ui-faint' }
  @{ From = 'text-slate-300'; To = 'text-ui-faint' }
  @{ From = 'border-gray-400'; To = 'border-ui-strong' }
  @{ From = 'border-gray-300'; To = 'border-ui-default' }
  @{ From = 'border-gray-200'; To = 'border-ui-default' }
  @{ From = 'border-gray-100'; To = 'border-ui-subtle' }
  @{ From = 'border-slate-700'; To = 'border-ui-subtle' }
  @{ From = 'border-slate-600'; To = 'border-ui-subtle' }
  @{ From = 'border-slate-300'; To = 'border-ui-default' }
  @{ From = 'border-slate-200'; To = 'border-ui-default' }
  @{ From = 'bg-gray-100'; To = 'bg-ui-inset' }
  @{ From = 'bg-gray-50'; To = 'bg-ui-inset' }
  @{ From = 'bg-slate-100'; To = 'bg-ui-inset' }
  @{ From = 'bg-slate-50'; To = 'bg-ui-inset' }
  @{ From = 'dark:bg-slate-950'; To = 'dark:bg-ui-base' }
  @{ From = 'dark:bg-slate-900'; To = 'dark:bg-ui-surface' }
  @{ From = 'dark:bg-slate-800'; To = 'dark:bg-ui-elevated' }
  @{ From = 'dark:bg-slate-700'; To = 'dark:bg-ui-inset' }
  @{ From = 'dark:border-slate-700'; To = 'dark:border-ui-subtle' }
  @{ From = 'dark:border-slate-600'; To = 'dark:border-ui-subtle' }
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
Write-Host "Updated $n files under $root"
