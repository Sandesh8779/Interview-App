# PowerShell script to check what needs updating
$content = [System.IO.File]::ReadAllText("src/App.jsx")
Write-Host "File length: $($content.Length)"
Write-Host "Has CandidateResult: $($content.Contains('function CandidateResult'))"
Write-Host "Has HrAiPanel useState: $($content.Contains('useState(['))"
