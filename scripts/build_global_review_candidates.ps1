Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$inputPath = Join-Path $PSScriptRoot '..\data\processed\clean_foods.csv'
$outputPath = Join-Path $PSScriptRoot '..\data\processed\game_candidates_global_review.csv'
$rows = Import-Csv -LiteralPath $inputPath

$priorityCountries = @(
    'India',
    'United States',
    'Canada',
    'Australia',
    'New Zealand',
    'Singapore',
    'United Arab Emirates',
    'United Kingdom'
)

function Get-StableSortKey([string]$value) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($value)
    $hash = [System.Security.Cryptography.SHA256]::HashData($bytes)
    return [Convert]::ToHexString($hash)
}

function Get-CountryPriority([string]$countries) {
    if ($countries -match '(?i)(^|,)\s*India\s*(,|$)') { return 1 }
    if ($countries -match '(?i)(United States|Canada|Australia|New Zealand|Singapore|United Arab Emirates)') { return 2 }
    if ($countries -match '(?i)(United Kingdom|en:gb|en:united-kingdom)') { return 3 }
    return 9
}

$eligible = $rows | Where-Object {
    $countries = $_.countries
    $priorityCountries | Where-Object {
        if ($_ -eq 'United Kingdom') {
            $countries -match '(?i)(United Kingdom|en:gb|en:united-kingdom)'
        }
        else {
            $countries -match [regex]::Escape($_)
        }
    }
} | Where-Object {
    $_.display_name -match '^[\x20-\x7E]+$' -and $_.display_name -match '[A-Za-z]'
}

$candidates = foreach ($level in 1..4) {
    $eligible |
        Where-Object { [int]$_.nova_group -eq $level } |
        Sort-Object @{ Expression = { Get-CountryPriority $_.countries } }, @{ Expression = { Get-StableSortKey $_.code } } |
        Select-Object -First 50 |
        ForEach-Object {
            $_ | Select-Object *, @{ Name = 'selection_rationale'; Expression = {
                switch (Get-CountryPriority $_.countries) {
                    1 { 'India-listed product; verify familiarity and classification' }
                    2 { 'English-readable product from a global-priority market; verify familiarity and classification' }
                    3 { 'English-readable UK product used to complete level balance; verify familiarity and classification' }
                    default { 'Manual review required' }
                }
            }}
        }
}

if ($candidates.Count -ne 200) {
    throw "Expected 200 candidates (50 per NOVA level); produced $($candidates.Count)."
}

$candidates | Export-Csv -LiteralPath $outputPath -NoTypeInformation -Encoding utf8

$summary = $candidates | Group-Object nova_group | Sort-Object Name | ForEach-Object { "Level $($_.Name): $($_.Count)" }
Write-Output "Created $outputPath"
Write-Output ($summary -join '; ')
