# PowerShell script to update App.jsx components
$content = Get-Content "src/App.jsx" -Raw

# 1. Update CodingTest - replace the old function
# Find the coding test function boundaries
$oldCodingStart = 'function CodingTest({ setMessage }) {'
$idx = $content.IndexOf($oldCodingStart)
Write-Host "CodingTest starts at index: $idx"

# We'll use regex to find the function body
$pattern = 'function CodingTest\(\{ setMessage \}\) \{\s+const TASKS = \[[\s\S]+?\}\s+function HrAiPanel\(\) \{'
if ($content -match $pattern) {
    $matched = $matches[0]
    Write-Host "Found CodingTest, length: $($matched.Length)"
} else {
    Write-Host "Pattern did not match"
}
</｜｜DSML｜｜parameter>
</｜｜DSML｜｜invoke>
</｜｜DSML｜｜tool_calls>
