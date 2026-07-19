Get-ChildItem -Path 'src\app' -Recurse -Filter '*.tsx' | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    # Fix ".then(data =>" pattern (without parentheses)
    $newContent = $content -replace '\.then\(data =>', '.then((data: any) =>'
    # Fix ".then(res =>" that's used for json()
    # Don't touch those - res is not used for property access
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent -NoNewline
        Write-Host "Fixed: $($_.FullName)"
    }
}
Write-Host "Done."
