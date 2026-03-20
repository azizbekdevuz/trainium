$root = Join-Path (Join-Path $PSScriptRoot "..") "src"
$files = Get-ChildItem -Path $root -Recurse -Filter "*.tsx" -File | Where-Object {
  $_.FullName -notmatch '[\\/]app[\\/]api[\\/]'
}

$replacements = @(
  @{ From = 'bg-white dark:bg-ui-surface'; To = 'glass-surface' }
  @{ From = 'bg-white dark:bg-ui-elevated'; To = 'glass-surface' }
  @{ From = 'dark:border-slate-800'; To = 'dark:border-ui-subtle' }
  @{ From = 'dark:border-slate-700'; To = 'dark:border-ui-subtle' }
  @{ From = 'text-ui-primary dark:text-slate-100'; To = 'text-ui-primary' }
  @{ From = 'text-ui-secondary dark:text-slate-200'; To = 'text-ui-secondary' }
  @{ From = 'text-ui-secondary dark:text-ui-faint'; To = 'text-ui-secondary' }
  @{ From = 'dark:hover:bg-slate-800'; To = 'dark:hover:bg-ui-elevated' }
  @{ From = 'dark:hover:bg-slate-700'; To = 'dark:hover:bg-ui-inset' }
  @{ From = 'hover:bg-gray-200'; To = 'hover:bg-ui-inset' }
  @{ From = 'hover:bg-slate-200'; To = 'hover:bg-ui-inset' }
  @{ From = 'dark:placeholder-slate-400'; To = 'dark:placeholder:text-ui-faint' }
  @{ From = 'placeholder-slate-500'; To = 'placeholder:text-ui-faint' }
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
Write-Host "Phase2 updated $n files"
