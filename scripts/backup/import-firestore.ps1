param(
  [string]$project = "edusync-sis-staging",
  [string]$gcsPath
)

if ([string]::IsNullOrEmpty($gcsPath)) {
  Write-Error "Usage: .\import-firestore.ps1 -gcsPath gs://bucket/path/to/export-xxxx"
  exit 1
}

Write-Host "Importing Firestore export from '$gcsPath' into project '$project'"
$cmd = "gcloud firestore import $gcsPath --project=$project"
Write-Host "Running: $cmd"
Invoke-Expression $cmd
Write-Host "Import finished. Verify the staging Firestore console for imported documents."