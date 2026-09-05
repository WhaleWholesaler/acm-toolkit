$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$stage = Join-Path $env:TEMP 'acmtoolkit-build'
$dist = Join-Path $PSScriptRoot 'dist'
$sdk = Join-Path $PSScriptRoot 'lib'

if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }
New-Item -ItemType Directory -Path "$stage\www\css", "$stage\www\js", $dist -Force | Out-Null

Copy-Item "$root\index.html" "$stage\www\"
Copy-Item "$root\skilltree.html" "$stage\www\"
Copy-Item "$root\css\app.css" "$stage\www\css\"
Copy-Item "$root\css\tree.css" "$stage\www\css\"
Copy-Item "$root\js\app.js" "$stage\www\js\"
Copy-Item "$root\js\tree.js" "$stage\www\js\"
Copy-Item "$sdk\WebView2Loader.dll" "$stage\"

$csc = "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
$out = Join-Path $dist 'ACM训练台.exe'
$coreDll = "$sdk\Microsoft.Web.WebView2.Core.dll"
$formsDll = "$sdk\Microsoft.Web.WebView2.WinForms.dll"
$manifest = Join-Path $PSScriptRoot 'app.manifest'
$program = Join-Path $PSScriptRoot 'Program.cs'

$args = @(
  '/nologo','/target:winexe','/platform:x64','/optimize+','/utf8output',
  "/win32manifest:`"$manifest`"",
  "/out:`"$out`"",
  "/r:`"$coreDll`"",
  "/r:`"$formsDll`"",
  "`"$program`"",
  "/resource:`"$stage\WebView2Loader.dll`",webview2loader",
  "/resource:`"$coreDll`",wv2core",
  "/resource:`"$formsDll`",wv2winforms",
  "/resource:`"$stage\www\index.html`",www/index.html",
  "/resource:`"$stage\www\skilltree.html`",www/skilltree.html",
  "/resource:`"$stage\www\css\app.css`",www/css/app.css",
  "/resource:`"$stage\www\css\tree.css`",www/css/tree.css",
  "/resource:`"$stage\www\js\app.js`",www/js/app.js",
  "/resource:`"$stage\www\js\tree.js`",www/js/tree.js"
)

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $csc
$psi.Arguments = ($args -join ' ')
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$p = [System.Diagnostics.Process]::Start($psi)
$stdout = $p.StandardOutput.ReadToEnd()
$stderr = $p.StandardError.ReadToEnd()
$p.WaitForExit()

if ($stdout) { Write-Output $stdout }
if ($stderr) { Write-Output ("STDERR: " + $stderr) }
if ($p.ExitCode -ne 0) { Write-Output 'BUILD FAILED'; exit 1 }
$exe = Get-Item $out
Write-Output ("BUILD OK: {0} ({1:N1} KB)" -f $exe.FullName, ($exe.Length/1KB))
