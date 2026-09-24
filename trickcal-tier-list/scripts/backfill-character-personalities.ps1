param(
  [Parameter(Mandatory = $true)]
  [string]$TableName,
  [string]$Region = 'us-east-1'
)

$mainPersonalities = @(
  'vivacious',
  'depressed',
  'innocent',
  'composed',
  'mad'
)
$exclusiveStartKey = $null
$updatedCount = 0
$skippedCount = 0

do {
  $scanArguments = @(
    'dynamodb',
    'scan',
    '--table-name', $TableName,
    '--region', $Region,
    '--projection-expression', 'id, personality, personalities'
  )

  if ($exclusiveStartKey) {
    $scanArguments += @('--exclusive-start-key', $exclusiveStartKey)
  }

  $page = (& aws @scanArguments | ConvertFrom-Json)

  foreach ($item in $page.Items) {
    $personalities = @($item.personalities.SS | Where-Object { $_ })
    if (-not $personalities.Count) {
      if ($item.personality.S -eq 'resonance') {
        $personalities = $mainPersonalities
      } elseif ($mainPersonalities -contains $item.personality.S) {
        $personalities = @($item.personality.S)
      } else {
        Write-Warning "Skipping character $($item.id.S): no valid personality."
        $skippedCount++
        continue
      }
    }

    $values = @{
      ':personalities' = @{
        SS = @($personalities)
      }
    } | ConvertTo-Json -Compress

    & aws dynamodb update-item `
      --table-name $TableName `
      --region $Region `
      --key (@{ id = @{ S = $item.id.S } } | ConvertTo-Json -Compress) `
      --update-expression 'SET personalities = :personalities REMOVE personality' `
      --expression-attribute-values $values | Out-Null
    $updatedCount++
  }

  $exclusiveStartKey = if ($page.LastEvaluatedKey) {
    $page.LastEvaluatedKey | ConvertTo-Json -Compress
  } else {
    $null
  }
} while ($exclusiveStartKey)

Write-Output "Updated $updatedCount character(s); skipped $skippedCount."
