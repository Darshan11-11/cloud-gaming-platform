param(
    [int]$Port = 8000
)

function Get-AvailablePort {
    param ([int]$StartPort = 8000)
    $p = $StartPort
    while ($p -lt ($StartPort + 50)) {
        $testListener = New-Object System.Net.HttpListener
        try {
            $testListener.Prefixes.Add("http://localhost:$p/")
            $testListener.Start()
            $testListener.Stop()
            return $p
        } catch {
            $p++
        } finally {
            try { $testListener.Close() } catch {}
        }
    }
    return $StartPort
}

# Find an available port starting from requested port
$activePort = Get-AvailablePort -StartPort $Port
$url = "http://localhost:$activePort/"

$listener = New-Object System.Net.HttpListener
try { $listener.Prefixes.Add("http://localhost:$activePort/") } catch {}
try { $listener.Prefixes.Add("http://127.0.0.1:$activePort/") } catch {}

try {
    $listener.Start()
    Write-Host "========================================================" -ForegroundColor Cyan
    Write-Host "  NimbuPlay Local Web Server Running!" -ForegroundColor Green
    Write-Host "  URL: $url" -ForegroundColor Yellow
    if ($activePort -ne $Port) {
        Write-Host "  (Port $Port was in use, automatically switched to $activePort)" -ForegroundColor DarkYellow
    }
    Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host "========================================================" -ForegroundColor Cyan

    # Auto-open browser
    try { Start-Process $url } catch {}

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        try {
            $localPath = $request.Url.LocalPath
            if ($localPath -eq "/") { $localPath = "/index.html" }
            
            $cleanRelativePath = $localPath.TrimStart('/').Replace('/', '\')
            $filePath = Join-Path $PSScriptRoot $cleanRelativePath
            
            if (Test-Path $filePath -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                switch ($ext) {
                    ".html" { $response.ContentType = "text/html; charset=utf-8" }
                    ".css"  { $response.ContentType = "text/css; charset=utf-8" }
                    ".js"   { $response.ContentType = "application/javascript; charset=utf-8" }
                    ".png"  { $response.ContentType = "image/png" }
                    ".jpg"  { $response.ContentType = "image/jpeg" }
                    ".svg"  { $response.ContentType = "image/svg+xml" }
                    ".ico"  { $response.ContentType = "image/x-icon" }
                    ".json" { $response.ContentType = "application/json" }
                    default { $response.ContentType = "application/octet-stream" }
                }
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $buf = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $response.ContentLength64 = $buf.Length
                $response.OutputStream.Write($buf, 0, $buf.Length)
            }
        } catch {
            Write-Host "Error handling request: $_" -ForegroundColor Red
        } finally {
            try { $response.Close() } catch {}
        }
    }
} catch {
    Write-Host "Error starting server: $_" -ForegroundColor Red
} finally {
    if ($listener.IsListening) { $listener.Stop() }
}
