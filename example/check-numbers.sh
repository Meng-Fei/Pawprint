#!/bin/bash
# The rule check lives in the engine; run this file to check this deck.
exec "$(dirname "$0")/../engine/check.sh" "$(dirname "$0")"
