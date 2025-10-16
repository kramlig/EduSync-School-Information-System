# Run Firestore emulator and execute rules unit tests
# Requires dev dependencies installed (npm install)

$script = "node scripts/tests/firestore-rules.test.cjs"
Write-Output "Starting Firebase emulators to run rules tests..."
Write-Output "Running rules tests wrapped by Firebase emulator (emulators:exec)..."
# Use npx to ensure local firebase-tools is used; wrap the test so the harness auto-discovers emulator host/port
npx firebase emulators:exec --only firestore --project emu-test -- node scripts/tests/firestore-rules.test.cjs

if ($LASTEXITCODE -ne 0) {
  Write-Error "Rules tests failed with exit code $LASTEXITCODE"
  exit $LASTEXITCODE
}
Write-Output "Rules tests finished successfully."