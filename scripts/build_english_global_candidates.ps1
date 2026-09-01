Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$inputPath = Join-Path $PSScriptRoot '..\data\processed\clean_foods.csv'
$outputPath = Join-Path $PSScriptRoot '..\data\processed\game_candidates_english_global_review.csv'
$rows = Import-Csv -LiteralPath $inputPath

function Get-StableSortKey([string]$value) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($value)
    $hash = [System.Security.Cryptography.SHA256]::HashData($bytes)
    return [Convert]::ToHexString($hash)
}

function Get-MarketPriority([string]$countries) {
    if ($countries -match '(?i)india') { return 1 }
    if ($countries -match '(?i)(United States|en:united-states)') { return 2 }
    if ($countries -match '(?i)(Canada|Australia|New Zealand|Singapore|United Arab Emirates)') { return 3 }
    if ($countries -match '(?i)(United Kingdom|en:united-kingdom|en:gb)') { return 4 }
    return 9
}

function Get-BrandPriority([string]$brands) {
    if ($brands -match '(?i)(Nestle|Maggi|Coca-Cola|Pepsi|Cadbury|Kellogg|Lay''s|Oreo|Heinz|Knorr|Nescafe|Red Bull|Pringles|McCain|Britannia)') { return 0 }
    return 1
}

# This rejects common non-English descriptor words. It is deliberately conservative:
# all selected cards remain pending manual review before they can be used in the game.
$nonEnglishWords = '\b(avec|sans|moutarde|chocolat|fromage|yaourt|lait|eau|miel|sucre|beurre|farine|huile|vinaigre|sel|galettes|creme|biscuit|de|des|du|les|le|la|con|sin|queso|leche|azucar|agua|pan)\b'
$familiarFoodTerms = '(?i)(apple|banana|milk|water|oat|cocoa|cereal|bread|rice|pasta|olive|coconut|vinegar|salt|sugar|honey|peanut|butter|tea|coffee|ketchup|jam|sauce|cheese|yogurt|yoghurt|ice cream|biscuit|cookie|cracker|chip|crisp|chocolate|drink|juice|cola|energy|noodle|soup|bar|cake|muffin|pizza|sandwich|chicken|fish|salmon|tuna|pickle|porridge|tomato|flour|curry|spice|lemon|orange|berry|candy|sweet|snack|soda|corn|bean|lentil|mustard|mayonnaise|spread|bacon|sausage|ham|meat|tofu|quinoa|granola|protein|broth|stock)'
$knownGlobalBrands = '(?i)(Nestle|Maggi|Coca-Cola|Pepsi|Cadbury|Kellogg|Lay''s|Oreo|Heinz|Knorr|Nescafe|Red Bull|Pringles|McCain|Britannia|Hershey|Quaker|Skippy|Nature Valley|Ritz|Tropicana|Lipton|Fanta|Sprite|KitKat)'

$eligible = $rows | Where-Object {
    $_.display_name -match '^[\x20-\x7E]+$' -and
    $_.display_name -match '[A-Za-z]' -and
    $_.display_name -notmatch $nonEnglishWords -and
    ($_.display_name -match $familiarFoodTerms -or $_.brands -match $knownGlobalBrands) -and
    (Get-MarketPriority $_.countries) -lt 9
}

$candidates = foreach ($level in 1..4) {
    $eligible |
        Where-Object { [int]$_.nova_group -eq $level } |
        Sort-Object @{ Expression = { Get-MarketPriority $_.countries } }, @{ Expression = { Get-BrandPriority $_.brands } }, @{ Expression = { Get-StableSortKey $_.code } } |
        Select-Object -First 50 |
        ForEach-Object {
            $_ | Select-Object *, @{ Name = 'selection_rationale'; Expression = {
                'English-readable candidate from an India/English-speaking market; manual familiarity review required'
            }}
        }
}

if ($candidates.Count -ne 200) {
    throw "Expected 200 candidates (50 per NOVA level); produced $($candidates.Count)."
}

$candidates | Export-Csv -LiteralPath $outputPath -NoTypeInformation -Encoding utf8
Write-Output "Created $outputPath"
($candidates | Group-Object nova_group | Sort-Object Name | ForEach-Object { "Level $($_.Name): $($_.Count)" }) -join '; ' | Write-Output
