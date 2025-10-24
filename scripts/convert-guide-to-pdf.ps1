# Convert Teacher UAT Guide to Printable HTML
Write-Host "Creating printable HTML version of Teacher UAT Guide..." -ForegroundColor Cyan

$markdownFile = "docs\TEACHER_UAT_GUIDE.md"
$outputHtml = "docs\TEACHER_UAT_GUIDE.html"

$content = Get-Content $markdownFile -Raw -Encoding UTF8

$html = @"
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Teacher UAT Guide</title>
<style>body{font-family:Arial,sans-serif;max-width:900px;margin:40px auto;padding:20px;line-height:1.7}h1{color:#4F46E5;border-bottom:3px solid #4F46E5;padding-bottom:10px}h2{color:#7C3AED;margin-top:30px;padding:10px;background:#F3F4F6}h3{color:#059669}code{background:#f4f4f4;padding:3px 6px;border-radius:3px}pre{background:#f9f9f9;padding:15px;border-radius:5px;border:1px solid #ddd}@media print{body{padding:10px}}</style>
</head><body>
<pre>$content</pre>
</body></html>
"@

$html | Out-File -FilePath $outputHtml -Encoding UTF8
Write-Host "HTML created: $outputHtml" -ForegroundColor Green
Write-Host "Opening file... Press Ctrl+P to print to PDF" -ForegroundColor Yellow
Start-Process $outputHtml
