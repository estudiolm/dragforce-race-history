#!/usr/bin/env python3
"""
Remove o fundo preto sólido das logos (a partir dos arquivos-fonte em alta
resolução em assets/logos-original/) via flood-fill a partir das bordas da
imagem, convertendo o fundo em transparência real (alpha) — em vez do
retângulo/quadrado preto sólido que estava "colado" no design atual.

Gera os arquivos finais (redimensionados, com alpha) direto em assets/logos/.
"""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

BG_THRESHOLD = 30   # canal máx. (R,G,B) abaixo disso = "candidato a fundo preto"
BLUR_RADIUS = 1.1   # suaviza a borda do recorte (evita serrilhado)
PAD = 10            # padding transparente ao redor do conteúdo, em px


def detransparentize(path_in, max_width=None, max_height=None, threshold=BG_THRESHOLD):
    im = Image.open(path_in).convert('RGBA')
    arr = np.array(im).astype(np.int16)
    rgb = arr[:, :, :3]
    maxc = rgb.max(axis=2)

    bgcand = maxc < threshold

    structure = np.array([[0, 1, 0], [1, 1, 1], [0, 1, 0]])
    labels, n = ndimage.label(bgcand, structure=structure)

    border_labels = set(labels[0, :].tolist()) | set(labels[-1, :].tolist()) \
        | set(labels[:, 0].tolist()) | set(labels[:, -1].tolist())
    border_labels.discard(0)

    bg_mask = np.isin(labels, list(border_labels))
    alpha = np.where(bg_mask, 0, 255).astype(np.uint8)

    alpha_img = Image.fromarray(alpha, mode='L').filter(ImageFilter.GaussianBlur(BLUR_RADIUS))
    im.putalpha(alpha_img)

    a = np.array(im.split()[-1])
    ys, xs = np.where(a > 8)
    x0, x1 = max(xs.min() - PAD, 0), min(xs.max() + PAD, im.width - 1)
    y0, y1 = max(ys.min() - PAD, 0), min(ys.max() + PAD, im.height - 1)
    im = im.crop((x0, y0, x1 + 1, y1 + 1))

    if max_width and im.width > max_width:
        ratio = max_width / im.width
        im = im.resize((max_width, round(im.height * ratio)), Image.LANCZOS)
    if max_height and im.height > max_height:
        ratio = max_height / im.height
        im = im.resize((round(im.width * ratio), max_height), Image.LANCZOS)

    return im


def make_favicon(emblem_rgba, size, bg_hex='#0b0c11'):
    """Emblema sobre uma base quadrada arredondada escura (fundo sólido) —
    favicons ficam ilegíveis totalmente transparentes em abas claras."""
    bg = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    # fundo quadrado com cantos levemente arredondados, cor da marca
    from PIL import ImageDraw
    r, g, b = tuple(int(bg_hex.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4))
    mask = Image.new('L', (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=round(size * 0.18), fill=255)
    plate = Image.new('RGBA', (size, size), (r, g, b, 255))
    bg.paste(plate, (0, 0), mask)

    ratio = min(size * 0.86 / emblem_rgba.width, size * 0.86 / emblem_rgba.height)
    ew, eh = round(emblem_rgba.width * ratio), round(emblem_rgba.height * ratio)
    emblem_small = emblem_rgba.resize((ew, eh), Image.LANCZOS)
    ex, ey = (size - ew) // 2, (size - eh) // 2
    bg.alpha_composite(emblem_small, (ex, ey))
    return bg


if __name__ == '__main__':
    wordmark = detransparentize('assets/logos-original/dragforce-wordmark-final.png', max_width=900)
    wordmark.save('assets/logos/dragforce-logo.png')
    print('dragforce-logo.png ->', wordmark.size)

    boost = detransparentize('assets/logos-original/boostclub-logo-final.png', max_width=900)
    boost.save('assets/logos/boostclub-logo.png')
    print('boostclub-logo.png ->', boost.size)

    emblem = detransparentize('assets/logos-original/dragforce-emblem-final.png', max_width=700, threshold=60)
    emblem.save('assets/logos/dragforce-emblem.png')
    print('dragforce-emblem.png ->', emblem.size)

    fav192 = make_favicon(emblem, 192)
    fav192.save('assets/logos/favicon.png')
    fav32 = make_favicon(emblem, 32)
    fav32.save('assets/logos/favicon-32.png')
    print('favicons ok')
