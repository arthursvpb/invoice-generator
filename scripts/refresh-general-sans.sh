#!/usr/bin/env bash
# Download General Sans WOFF2 faces from Fontshare into public/fonts/general-sans/.

set -euo pipefail

WEIGHTS="300,400,500,600,700"
OUT_DIR="public/fonts/general-sans"

if [[ ! -d "$OUT_DIR" ]]; then
  mkdir -p "$OUT_DIR"
fi

TMP_CSS="$(mktemp)"
trap 'rm -f "$TMP_CSS"' EXIT

curl -sSL "https://api.fontshare.com/v2/css?f%5B%5D=general-sans@${WEIGHTS}&display=swap" -o "$TMP_CSS"

awk '
  /src:.*woff2/ { gsub(/.*url\(.\/\//, ""); gsub(/\.woff2.*/, ".woff2"); url=$0 }
  /font-weight:/ { gsub(/font-weight: /, ""); gsub(/;/, ""); weight=$0; gsub(/ /, "", weight); print weight, url }
' "$TMP_CSS" | while read -r weight url; do
  target="$OUT_DIR/GeneralSans-${weight}.woff2"
  curl -sSL "https://${url}" -o "$target"
  echo "wrote $target ($(wc -c < "$target") bytes)"
done

echo "done."
