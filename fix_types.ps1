Get-ChildItem -Path 'src\app' -Recurse -Filter '*.tsx' | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace '\.then\(\(data\) =>', '.then((data: any) =>'
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent -NoNewline
        Write-Host "Fixed: $($_.FullName)"
    }
}

Get-ChildItem -Path 'src\app' -Recurse -Filter '*.ts' | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace '\.then\(\(data\) =>', '.then((data: any) =>'
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent -NoNewline
        Write-Host "Fixed TS: $($_.FullName)"
    }
}

Write-Host "Done fixing fetch response types."
