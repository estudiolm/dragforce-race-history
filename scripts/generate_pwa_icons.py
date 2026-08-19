#!/usr/bin/env python3
"""
Gera os ícones do PWA (app instalável) a partir do emblema DragForce
(assets/logos/dragforce-emblem.png), que já tem fundo transparente e
formato de "escudo" — perfeito pra virar ícone de app.

Gera:
  assets/icons/icon-192.png            (ícone padrão)
  assets/icons/icon-512.png            (ícone padrão, alta res)
  assets/icons/icon-maskable-192.png   (com "safe zone" pra Android adaptive icon)
  assets/icons/icon-maskable-512.png
  assets/icons/apple-touch-icon.png    (180x180, sem transparência — iOS ignora alpha)
"""
import os
from PIL import Image, ImageDraw

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, "assets/logos/dragforce-emblem.png")
OUT_DIR = os.path.join(BASE, "assets/icons")
os.makedirs(OUT_DIR, exist_ok=True)

BG = (11, 12, 17, 255)  # var(--bg-void) do site


def fit_on_square(im, size, content_ratio, bg):
    """Redimensiona `im` (RGBA) pra caber num quadrado `size`x`size`,
    ocupando `content_ratio` da área (o resto é margem/safe-zone),
    centralizado sobre um fundo `bg`."""
    canvas = Image.new("RGBA", (size, size), bg)
    target = int(size * content_ratio)
    ratio = min(target / im.width, target / im.height)
    new_w, new_h = max(1, int(im.width * ratio)), max(1, int(im.height * ratio))
    resized = im.resize((new_w, new_h), Image.LANCZOS)
    x = (size - new_w) // 2
    y = (size - new_h) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas


src = Image.open(SRC).convert("RGBA")
bbox = src.split()[3].getbbox()
if bbox:
    src = src.crop(bbox)

# ícones "any" (podem preencher quase tudo, o próprio conteúdo já tem borda)
for size in (192, 512):
    icon = fit_on_square(src, size, content_ratio=0.94, bg=BG)
    icon.save(os.path.join(OUT_DIR, f"icon-{size}.png"))

# ícones "maskable" (Android recorta em círculo/squircle — precisa de mais
# margem pra nada importante ficar cortado: safe zone = 80% central)
for size in (192, 512):
    icon = fit_on_square(src, size, content_ratio=0.72, bg=BG)
    icon.save(os.path.join(OUT_DIR, f"icon-maskable-{size}.png"))

# apple-touch-icon: iOS não respeita alpha (fica preto onde é transparente),
# então compõe sobre fundo sólido e arredonda levemente por segurança visual
apple = fit_on_square(src, 180, content_ratio=0.86, bg=BG).convert("RGB")
apple.save(os.path.join(OUT_DIR, "apple-touch-icon.png"))

print("ícones gerados em", OUT_DIR)
for f in sorted(os.listdir(OUT_DIR)):
    print(" -", f)
