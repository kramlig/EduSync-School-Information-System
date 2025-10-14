#!/usr/bin/env bash
set -euo pipefail

# CI helper: start firestore emulator in background, run tests, capture logs on failure
EMULATOR_LOG="$RUNNER_TEMP/firestore-emulator.log"
mkdir -p "$(dirname "$EMULATOR_LOG")"

# Start emulator in background
firebase emulators:start --only firestore --export-on-exit="./emulator_export" --project=edusync-sis >"$EMULATOR_LOG" 2>&1 &
EMULATOR_PID=$!

# Wait for emulator to be ready (poll the log)
READY=false
for i in {1..30}; do
  if grep -q "Firestore Emulator logging to" "$EMULATOR_LOG" || grep -q "All emulators ready" "$EMULATOR_LOG" ; then
    READY=true
    break
  fi
  sleep 1
done

if [ "$READY" != true ]; then
  echo "Emulator failed to start. Dumping log:" >&2
  cat "$EMULATOR_LOG" >&2 || true
  kill $EMULATOR_PID || true
  exit 1
fi

# Run tests
if ! node ./scripts/test-firestore-rules.cjs; then
  echo "Tests failed. Emulator log contents:" >&2
  cat "$EMULATOR_LOG" >&2 || true
  kill $EMULATOR_PID || true
  exit 1
fi

# Cleanup
kill $EMULATOR_PID || true
exit 0
