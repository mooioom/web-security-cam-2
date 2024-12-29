#!/bin/bash

# Create audio directory if it doesn't exist
mkdir -p public/audio

# List of required sound files
SOUNDS=(
    "alarm1.mp3"
    "alarm2.mp3"
    "alarm3.mp3"
    "baby1.mp3"
    "baby2.mp3"
    "bark1.mp3"
    "bark2.mp3"
    "bark3.mp3"
    "dishes.mp3"
    "lead1.mp3"
    "lead2.mp3"
    "people.mp3"
    "siren1.mp3"
    "siren2.mp3"
    "siren3.mp3"
)

# Check each sound file
for sound in "${SOUNDS[@]}"; do
    if [ ! -f "public/audio/$sound" ]; then
        echo "Warning: Missing sound file: $sound"
    fi
done 