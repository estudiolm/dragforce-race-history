#!/usr/bin/env python3
"""Imprime as tags <link rel="apple-touch-startup-image"> pra colar no
<head> do index.html, uma por par (retrato, paisagem) de cada aparelho."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from generate_ios_splash import DEVICES

seen = set()
lines = []
for w, h, scale in DEVICES:
    key = (w, h, scale)
    if key in seen:
        continue
    seen.add(key)
    file_portrait = f"splash-{w*scale}x{h*scale}.png"
    lines.append(
        f'<link rel="apple-touch-startup-image" href="assets/icons/splash/{file_portrait}" '
        f'media="(device-width: {w}px) and (device-height: {h}px) and (-webkit-device-pixel-ratio: {scale}) and (orientation: portrait)" />'
    )

print("\n".join(lines))
