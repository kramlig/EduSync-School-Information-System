#!/usr/bin/env bash
set -euo pipefail

# CI helper: start firestore emulator in background, run tests, capture logs on failure
EMULATOR_LOG="$RUNNER_TEMP/firestore-emulator.log"
mkdir -p "$(dirname "$EMULATOR_LOG")"

# Start emulator in background in its own process group so we can kill it and children
setsid firebase emulators:start --only firestore --export-on-exit="./emulator_export" --project=edusync-sis >"$EMULATOR_LOG" 2>&1 &
EMULATOR_PID=$!

# Wait for emulator port to be open (check TCP) up to 120 seconds
EMULATOR_HOST="127.0.0.1"
EMULATOR_PORT=8085
MAX_WAIT=120
SLEEP=1
SECONDS_WAITED=0
echo "Waiting for Firestore emulator to accept connections on ${EMULATOR_HOST}:${EMULATOR_PORT}..."
while [ $SECONDS_WAITED -lt $MAX_WAIT ]; do
  # Try opening TCP connection
  if bash -c "</dev/tcp/${EMULATOR_HOST}/${EMULATOR_PORT}" >/dev/null 2>&1; then
    echo "Emulator is listening"
    break
  fi
  if grep -q "ERROR" "$EMULATOR_LOG" >/dev/null 2>&1; then
    echo "Detected ERROR in emulator log. Dumping log:" >&2
    cat "$EMULATOR_LOG" >&2 || true
    kill -TERM $EMULATOR_PID || true
    exit 1
  fi
  sleep $SLEEP
  SECONDS_WAITED=$((SECONDS_WAITED + SLEEP))
done

if [ $SECONDS_WAITED -ge $MAX_WAIT ]; then
  echo "Emulator did not become ready after ${MAX_WAIT}s. Dumping log:" >&2
  cat "$EMULATOR_LOG" >&2 || true
  kill -TERM $EMULATOR_PID || true
  exit 1
fi

# Export host so tests can connect
export FIRESTORE_EMULATOR_HOST="${EMULATOR_HOST}:${EMULATOR_PORT}"

# Run tests
if ! node ./scripts/tests/firestore-rules.test.cjs; then
  echo "Tests failed. Emulator log contents:" >&2
  cat "$EMULATOR_LOG" >&2 || true
  kill -TERM $EMULATOR_PID || true
  exit 1
fi

# Cleanup
kill -TERM $EMULATOR_PID || true
sleep 1
exit 0
