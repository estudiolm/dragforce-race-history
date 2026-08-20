#!/usr/bin/env python3
"""
Gera as telas de splash (launch screen) do app instalado no iPhone/iPad
via Safari -> "Adicionar à Tela de Início". O iOS não usa manifest.json
pra isso (ao contrário do Android) — precisa de uma imagem estática por
tamanho de tela, referenciada via <link rel="apple-touch-startup-image">
com media query batendo largura/altura/pixel-ratio exatos do aparelho.

Sem isso, o app abre com uma tela branca em branco por um instante antes
de carregar (feio, "quebra" a sensação de app nativo). Com isso, abre
direto com o fundo escuro da marca + o emblema, igual um app de verdade.

Gera em assets/icons/splash/: um PNG por combinação (largura, altura,
escala) cobrindo os iPhones mais comuns em uso, retrato e paisagem.
"""
import os
import numpy as np
from PIL import Image

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EMBLEM_SRC = os.path.join(BASE, "assets/logos/dragforce-emblem.png")
OUT_DIR = os.path.join(BASE, "assets/icons/splash")
os.makedirs(OUT_DIR, exist_ok=True)

BG = (11, 12, 17, 255)          # var(--bg-app)
RED_GLOW = (224, 7, 16)          # var(--df-red)
CHROME_GLOW = (200, 205, 215)    # tom cromado usado nos radiais do body

# (largura_css, altura_css, escala) — cobre os iPhones mais comuns em uso
# (SE/8 até a linha 14/15/16), retrato. O mesmo arquivo serve pro par
# invertido em paisagem (o link HTML usa a mesma imagem pros dois
# orientation via duas entradas, ver generate_links()).
DEVICES = [
    (320, 568, 2),   # iPhone SE (1ª geração)
    (375, 667, 2),   # iPhone 6/7/8, SE 2ª/3ª geração
    (414, 736, 3),   # iPhone 6/7/8 Plus
    (375, 812, 3),   # iPhone X/XS/11 Pro, 12/13 mini
    (414, 896, 2),   # iPhone XR, 11
    (414, 896, 3),   # iPhone XS Max, 11 Pro Max
    (390, 844, 3),   # iPhone 12/13/14, 12/13 Pro
    (428, 926, 3),   # iPhone 12/13 Pro Max, 14 Plus
    (393, 852, 3),   # iPhone 14/15 Pro, 15/16
    (430, 932, 3),   # iPhone 14/15/16 Pro Max
    (402, 874, 3),   # iPhone 16/16 Pro
    (440, 956, 3),   # iPhone 16 Pro Max
]


def radial_layer(px_w, px_h, cx_ratio, cy_ratio, rw_ratio, rh_ratio, color, peak_alpha):
    """Gradiente radial suave (elipse), igual ao radial-gradient() do CSS
    do body do site — sem borda dura, cai a zero na borda da elipse."""
    y, x = np.mgrid[0:px_h, 0:px_w]
    cx, cy = px_w * cx_ratio, px_h * cy_ratio
    rw, rh = px_w * rw_ratio, px_h * rh_ratio
    dist = np.sqrt(((x - cx) / rw) ** 2 + ((y - cy) / rh) ** 2)
    alpha = np.clip(1 - dist, 0, 1) * peak_alpha
    layer = np.zeros((px_h, px_w, 4), dtype=np.uint8)
    layer[..., 0] = color[0]
    layer[..., 1] = color[1]
    layer[..., 2] = color[2]
    layer[..., 3] = alpha.astype(np.uint8)
    return Image.fromarray(layer, "RGBA")


def make_splash(px_w, px_h, emblem):
    canvas = Image.new("RGBA", (px_w, px_h), BG)

    # replica os dois radiais do fundo do site (glow vermelho no topo +
    # glow cromado sutil no canto), centralizados pra uma tela vertical
    canvas.alpha_composite(radial_layer(px_w, px_h, 0.5, 0.02, 0.85, 0.30, RED_GLOW, 34))
    canvas.alpha_composite(radial_layer(px_w, px_h, 0.85, 0.0, 0.65, 0.22, CHROME_GLOW, 14))

    # emblema centralizado, ocupando ~34% da menor dimensão
    target = int(min(px_w, px_h) * 0.34)
    ratio = target / max(emblem.width, emblem.height)
    ew, eh = max(1, int(emblem.width * ratio)), max(1, int(emblem.height * ratio))
    resized = emblem.resize((ew, eh), Image.LANCZOS)
    ex, ey = (px_w - ew) // 2, (px_h - eh) // 2 - int(px_h * 0.015)
    canvas.alpha_composite(resized, (ex, ey))

    return canvas.convert("RGB")


def main():
    emblem = Image.open(EMBLEM_SRC).convert("RGBA")
    bbox = emblem.split()[3].getbbox()
    if bbox:
        emblem = emblem.crop(bbox)

    seen = set()
    manifest = []
    for w, h, scale in DEVICES:
        px_w, px_h = w * scale, h * scale
        key = (px_w, px_h)
        if key in seen:
            continue
        seen.add(key)
        img = make_splash(px_w, px_h, emblem)
        fname = f"splash-{px_w}x{px_h}.png"
        img.save(os.path.join(OUT_DIR, fname), optimize=True)
        manifest.append({"w": w, "h": h, "scale": scale, "file": fname})
        print("gerado:", fname)

    return manifest


if __name__ == "__main__":
    main()
