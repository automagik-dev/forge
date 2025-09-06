#!/bin/bash

# Path to AGENTS.md file
AGENTS_FILE="AGENTS.md"

# Check if AGENTS.md exists
if [ ! -f "$AGENTS_FILE" ]; then
    echo "Error: $AGENTS_FILE not found in current directory"
    exit 1
fi

# Read the contents of AGENTS.md
AGENTS_CONTENT=$(<"$AGENTS_FILE")

# Run claude with opus model and append the AGENTS.md content as system prompt
claude --model opus --append-system-prompt "$AGENTS_CONTENT"