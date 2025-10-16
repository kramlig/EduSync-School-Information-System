param(
  [string]$project = "edusync-sis",
  [string]$bucket = "gs://edusync-firestore-backups",
  [string]$collections = "",
  [string]$prefix = "firestore-export"
)

# Create timestamped destination
$timestamp = (Get-Date).ToString("yyyyMMdd-HHmmss")
$destinationPath = "$bucket/$prefix-$timestamp"

Write-Host "Exporting Firestore from project '$project' to '$destinationPath'"

$cmd = "gcloud firestore export $destinationPath --project=$project"
if ($collections -ne "") {
  $cmd += " --collection-ids=$collections"
}

Write-Host "Running: $cmd"
Invoke-Expression $cmd

Write-Host "Export finished. Verify the exported files in the GCS bucket."