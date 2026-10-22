#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
python3 demo-output/plan.py
python3 demo-output/narrate.py
node demo-output/capture.cjs
node demo-output/graphics.cjs
python3 demo-output/render.py
