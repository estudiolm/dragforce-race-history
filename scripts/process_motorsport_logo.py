#!/usr/bin/env python3
"""
Processa a logo "DragForce Motorsport" enviada pelo usuário (JPEG 548x203,
fundo preto sólido, com ruído de compressão JPEG):

  1. Upscale 4x com o modelo EDSR (super-resolução, cv2.dnn_superres) —
     resultado bem melhor que um resize bicúbico simples, reconstrói bordas
     das letras em vez de só esticar pixels.
  2. Suavização leve (denoise) para reduzir o "bloco" de artefatos JPEG que
     o upscale amplificaria.
  3. Unsharp mask para recuperar nitidez das bordas do texto/traçado.
  4. Remoção do fundo preto (chroma-key por luminância + flood-fill a partir
     das bordas, igual ao pipeline usado nas outras logos) -> PNG RGBA.
  5. Recorte (crop) na "bounding box" do conteúdo não-transparente, com
     margem, para não sobrar moldura preta/vazia.

Saída:
  assets/logos-original/dragforce-motorsport-upscaled.png  (master em alta)
  assets/logos/dragforce-motorsport.png                    (versão pro site)
"""
import cv2
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import gaussian_filter
from collections import deque
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, "assets/logos-original/dragforce-motorsport-original.jpeg")
MODEL = "/tmp/EDSR_x4.pb"
MASTER_OUT = os.path.join(BASE, "assets/logos-original/dragforce-motorsport-upscaled.png")
SITE_OUT = os.path.join(BASE, "assets/logos/dragforce-motorsport.png")

# ---- 1) super-resolução 4x (EDSR) ----
img_bgr = cv2.imread(SRC, cv2.IMREAD_COLOR)
sr = cv2.dnn_superres.DnnSuperResImpl_create()
sr.readModel(MODEL)
sr.setModel("edsr", 4)
upscaled = sr.upsample(img_bgr)  # 2192 x 812
print("upscaled:", upscaled.shape)

# ---- 2) denoise leve (remove blocagem JPEG amplificada) ----
denoised = cv2.bilateralFilter(upscaled, d=7, sigmaColor=45, sigmaSpace=45)

# ---- 3) unsharp mask ----
blur = cv2.GaussianBlur(denoised, (0, 0), sigmaX=2.2)
sharpened = cv2.addWeighted(denoised, 1.6, blur, -0.6, 0)
sharpened = np.clip(sharpened, 0, 255).astype(np.uint8)

rgb = cv2.cvtColor(sharpened, cv2.COLOR_BGR2RGB)
im = Image.fromarray(rgb).convert("RGBA")
im.save(MASTER_OUT)
print("master salvo:", MASTER_OUT, im.size)

# ---- 4) remoção do fundo preto (flood-fill 4-conn a partir das bordas) ----
arr = np.array(im).astype(np.float64)
h, w = arr.shape[:2]
lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]

THRESH = 42  # abaixo disso conta como "fundo preto"
is_dark = lum < THRESH

visited = np.zeros((h, w), dtype=bool)
q = deque()
for x in range(w):
    for y in (0, h - 1):
        if is_dark[y, x] and not visited[y, x]:
            visited[y, x] = True
            q.append((x, y))
for y in range(h):
    for x in (0, w - 1):
        if is_dark[y, x] and not visited[y, x]:
            visited[y, x] = True
            q.append((x, y))

while q:
    x, y = q.popleft()
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h and not visited[ny, nx] and is_dark[ny, nx]:
            visited[ny, nx] = True
            q.append((nx, ny))

alpha = np.where(visited, 0, 255).astype(np.float64)
# suaviza a borda da máscara pra não ficar serrilhado
alpha_smooth = gaussian_filter(alpha, sigma=1.4)
arr[:, :, 3] = np.clip(alpha_smooth, 0, 255)

# elimina qualquer resíduo escuro que sobrou colado no traçado (halo preto)
dark_leftover = (lum < THRESH) & (~visited)
arr[dark_leftover, 3] = 0

out = Image.fromarray(arr.astype(np.uint8), "RGBA")

# ---- 5) crop na bounding box do conteúdo + margem ----
bbox = out.split()[3].getbbox()
if bbox:
    pad = 14
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(out.width, r + pad)
    b = min(out.height, b + pad)
    out = out.crop((l, t, r, b))

out.save(SITE_OUT, optimize=True)
print("site salvo:", SITE_OUT, out.size)
