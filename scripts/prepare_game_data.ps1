Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$rawPath = Join-Path $PSScriptRoot '..\data\raw\openfoodfacts_nutrition_final_2025-12-10.csv'
$processedDir = Join-Path $PSScriptRoot '..\data\processed'
$cleanPath = Join-Path $processedDir 'clean_foods.csv'
$candidatesPath = Join-Path $processedDir 'game_candidates_review.csv'
$summaryPath = Join-Path $processedDir 'data_quality_summary.txt'

New-Item -ItemType Directory -Force -Path $processedDir | Out-Null
$rows = Import-Csv -LiteralPath $rawPath

function Get-StableSortKey([string]$value) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($value)
    $hash = [System.Security.Cryptography.SHA256]::HashData($bytes)
    return [Convert]::ToHexString($hash)
}

$cleanRows = foreach ($row in $rows) {
    $nova = $row.nova_group.Trim()
    $name = $row.product_name.Trim()
    $ingredients = $row.ingredients_text.Trim()

    if ($nova -notmatch '^[1-4](\.0)?$') { continue }
    if ([string]::IsNullOrWhiteSpace($name)) { continue }
    if ([string]::IsNullOrWhiteSpace($ingredients)) { continue }

    [pscustomobject]@{
        code              = $row.code.Trim()
        display_name      = $name
        brands            = $row.brands.Trim()
        countries         = $row.countries.Trim()
        categories        = $row.categories.Trim()
        ingredients_text  = $ingredients
        nova_group        = [int][double]$nova
        nutriscore_grade  = $row.nutriscore_grade.Trim()
        ecoscore_grade    = $row.ecoscore_grade.Trim()
        energy_kcal_100g  = $row.'energy-kcal_100g'.Trim()
        sugars_100g       = $row.sugars_100g.Trim()
        salt_100g         = $row.salt_100g.Trim()
        game_ready        = 'false'
        review_status     = 'pending'
        review_notes      = ''
        source_dataset    = 'Global Food Nutrition Database (Open Food Facts snapshot, 2025-12-10)'
    }
}

$cleanRows | Export-Csv -LiteralPath $cleanPath -NoTypeInformation -Encoding utf8

$candidateRows = foreach ($level in 1..4) {
    $cleanRows |
        Where-Object { $_.nova_group -eq $level } |
        Sort-Object @{ Expression = { Get-StableSortKey $_.code } } |
        Select-Object -First 50
}

$candidateRows | Export-Csv -LiteralPath $candidatesPath -NoTypeInformation -Encoding utf8

$novaCounts = $cleanRows | Group-Object nova_group | Sort-Object Name
$summary = @(
    'Week 2 data audit',
    "Raw rows: $($rows.Count)",
    "Clean rows (valid NOVA, name, and ingredient text): $($cleanRows.Count)",
    "Review candidates: $($candidateRows.Count) (50 per NOVA level)",
    '',
    'Clean NOVA distribution:'
) + ($novaCounts | ForEach-Object { "Level $($_.Name): $($_.Count)" })
$summary | Set-Content -LiteralPath $summaryPath -Encoding utf8

Write-Output "Created $cleanPath"
Write-Output "Created $candidatesPath"
Write-Output "Created $summaryPath"
