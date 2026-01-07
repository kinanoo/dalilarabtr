# Pseudoscript to recover missing FAQ items

$sourceFile = "src\lib\faq-data.ts"
$migrationDir = "C:\Users\Dopara\.gemini\antigravity\brain\216b5e27-5425-41da-ab55-931f73e27cab"
$outputFile = "$migrationDir\migration_batch_6_recovery.sql"

# 1. Get all IDs from existing migration files
$migratedIds = @{}
Get-ChildItem -Path $migrationDir -Filter "migration_batch_*.sql" | ForEach-Object {
    $content = Get-Content $_.FullName
    $matches = [regex]::Matches($content, "'([\w\d\-_]+)',\s*'")
    foreach ($match in $matches) {
        $id = $match.Groups[1].Value
        $migratedIds[$id] = $true
    }
}

Write-Host "Found $($migratedIds.Count) migrated IDs."

# 2. Parse source file for ALL items
$content = Get-Content $sourceFile -Raw
# Regex to match FAQ objects in the TS file logic
# Expected format:
# {
#   id: 'id',
#   category: 'cat',
#   question: 'q',
#   answer: 'a'
# }
# We need a robust regex.
# Assuming standard formatting as seen in files.

$regex = "(?ms)\{\s*id:\s*'([^']+)',\s*category:\s*'([^']+)',\s*question:\s*'([^']+)',\s*answer:\s*'([^']+)'"
$matches = [regex]::Matches($content, $regex)

$missingItems = @()

foreach ($match in $matches) {
    $id = $match.Groups[1].Value
    $category = $match.Groups[2].Value
    $question = $match.Groups[3].Value
    $answer = $match.Groups[4].Value

    # Clean up strings (escape single quotes for SQL)
    $q_clean = $question -replace "'", "''"
    $a_clean = $answer -replace "'", "''"
    $c_clean = $category -replace "'", "''"

    if (-not $migratedIds.ContainsKey($id)) {
        $missingItems += "('$id', '$c_clean', '$q_clean', '$a_clean')"
    }
}

Write-Host "Found $($matches.Count) total items in source."
Write-Host "Found $($missingItems.Count) missing items."

# 3. Generate SQL
if ($missingItems.Count -gt 0) {
    $sqlHeader = @"
-- ==============================================================================
-- 🚀 MIGRATION: BATCH 6 (RECOVERY)
-- Description: Inserts missing items that were skipped in previous batches.
-- Count: $($missingItems.Count) items
-- ==============================================================================

INSERT INTO faqs (id, category, question, answer) VALUES
"@
    
    $sqlValues = $missingItems -join ",`n"
    
    $sqlFooter = @"

ON CONFLICT (id) DO NOTHING;
"@

    $finalSql = $sqlHeader + "`n" + $sqlValues + "`n" + $sqlFooter
    Set-Content -Path $outputFile -Value $finalSql -Encoding UTF8
    Write-Host "Recovery script generated at $outputFile"
} else {
    Write-Host "No missing items found!"
}
