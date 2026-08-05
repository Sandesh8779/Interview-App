# Read App.jsx
$content = [System.IO.File]::ReadAllText("src/App.jsx", [System.Text.Encoding]::UTF8)

# Find positions
$hrStart = $content.IndexOf("function HrAiPanel()")
$coderStart = $content.IndexOf("function CodingTest(", [System.StringComparison]::Ordinal)

Write-Host "CodingTest at: $coderStart"
Write-Host "HrAiPanel at: $hrStart"

# Check for garbage from bad edit
$garbageStart = $content.IndexOf("            <span", $hrStart)
if ($garbageStart -gt 0) {
    Write-Host "Found garbage at: $garbageStart"
    # Find the next function after garbage
    $nextFunc = $content.IndexOf("function InterviewTable", $garbageStart)
    if ($nextFunc -gt 0) {
        Write-Host "Removing garbage from $garbageStart to $nextFunc"
        $content = $content.Substring(0, $garbageStart) + $content.Substring($nextFunc)
    }
}

# Verify
$hasHr = $content.Contains("function HrAiPanel")
$hasNotif = $content.Contains("function NotificationList")
$hasCoding = $content.Contains("function CodingTest")
$hasInterviewTable = $content.Contains("function InterviewTable")
$hasGarbage = $content.Contains("Check back for updates")

Write-Host "Has HrAiPanel: $hasHr"
Write-Host "Has NotificationList: $hasNotif"
Write-Host "Has CodingTest: $hasCoding"
Write-Host "Has InterviewTable: $hasInterviewTable"
Write-Host "Has Garbage: $hasGarbage"

[System.IO.File]::WriteAllText("src/App.jsx", $content, [System.Text.Encoding]::UTF8)
Write-Host "File saved."
</｜｜DSML｜｜parameter>
</｜｜DSML｜｜invoke>
</｜｜DSML｜｜tool_calls>
