"""Gera a imagem de compartilhamento. Requer Pillow e NumPy; não faz parte do build."""

from pathlib import Path
from tempfile import gettempdir
from urllib.request import urlretrieve

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
FONT = Path(gettempdir()) / "pomodoro-manrope-variable.ttf"
if not FONT.exists():
    urlretrieve(
        "https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/Manrope%5Bwght%5D.ttf",
        FONT,
    )

W, H, SCALE = 1200, 630, 2


def fract(x):
    return x - np.floor(x)


def noise(p):
    i = np.floor(p)
    f = fract(p)
    u = f * f * (3 - 2 * f)

    def corner(dx, dy):
        cell = i + [dx, dy]
        dots = np.stack(
            (cell[..., 0] * 127.1 + cell[..., 1] * 311.7,
             cell[..., 0] * 269.5 + cell[..., 1] * 183.3),
            axis=-1,
        )
        gradient = -1 + 2 * fract(np.sin(dots) * 43758.5453)
        return np.sum(gradient * (f - [dx, dy]), axis=-1)

    low = corner(0, 0) * (1 - u[..., 0]) + corner(1, 0) * u[..., 0]
    high = corner(0, 1) * (1 - u[..., 0]) + corner(1, 1) * u[..., 0]
    return low * (1 - u[..., 1]) + high * u[..., 1]


def smooth(a, b, value):
    k = np.clip((value - a) / (b - a), 0, 1)
    return (k * k * (3 - 2 * k))[..., None]


# Mesmo desenho do shader do app, congelado em um instante e sem WebGL.
y, x = np.mgrid[0:H, 0:W]
uv = np.stack((x / W, 1 - y / H), axis=-1)
p = uv * [W / H, 1]
t = 6 * 0.12
down_right, up_right, up_left = np.array([t, -t]), np.array([t * .7, t * .9]), np.array([-t * .6, t * .5])
q = np.stack((noise(p * 1.1 - down_right), noise(p * 1.1 - up_right + 4.7)), axis=-1)
n = noise(p * .9 + q * 1.8 - up_left)
n2 = noise(p * 1.7 - up_right * 1.3 + 9.1) * .35
sway = np.sin(t * .7) * .08
d = (1 - uv[..., 0]) * (.55 + sway) + uv[..., 1] * (.45 - sway) + (n + n2) * .6
c1, c2, c3 = np.array([47, 123, 255]), np.array([238, 245, 255]), np.array([169, 207, 255])
k = smooth(.15, .6, d)
rgb = c1 * (1 - k) + c3 * k
k = smooth(.55, 1, d)
rgb = rgb * (1 - k) + c2 * k
grain = np.random.default_rng(25).normal(0, 2.6, (H, W, 1))
canvas = Image.fromarray(np.clip(rgb + grain, 0, 255).astype('uint8')).convert('RGBA')
canvas = canvas.resize((W * SCALE, H * SCALE), Image.Resampling.LANCZOS)


def box(coords):
    return tuple(round(v * SCALE) for v in coords)


def font(size, weight):
    face = ImageFont.truetype(str(FONT), round(size * SCALE))
    face.set_variation_by_axes([weight])
    return face


def centered(text, x, y, size, weight, color):
    ImageDraw.Draw(canvas).text((x * SCALE, y * SCALE), text, font=font(size, weight), fill=color, anchor='mm')


centered('Pomodoro', 600, 88, 46, 650, '#101820')
centered('Foque. Faça uma pausa. Recomece.', 600, 143, 23, 500, '#33475f')

# Superfícies e proporções do timer, com mais presença para a prévia do link.
shadow = Image.new('RGBA', canvas.size)
ImageDraw.Draw(shadow).rounded_rectangle(box((240, 278, 960, 558)), radius=44 * SCALE, fill=(0, 0, 0, 65))
canvas = Image.alpha_composite(canvas, shadow.filter(ImageFilter.GaussianBlur(24 * SCALE)))
draw = ImageDraw.Draw(canvas)
draw.rounded_rectangle(box((421, 192, 779, 241)), radius=25 * SCALE, fill='#080808')
draw.rounded_rectangle(box((426, 197, 516, 236)), radius=20 * SCALE, fill='#292929')
centered('Foco', 471, 215, 17, 600, '#f5f5f7')
centered('Pausa', 579, 215, 17, 500, '#a1a1aa')
centered('Pausa longa', 706, 215, 17, 500, '#a1a1aa')

draw.rounded_rectangle(box((240, 266, 960, 554)), radius=44 * SCALE, fill='#080808')
draw.rounded_rectangle(box((672, 266, 960, 554)), radius=44 * SCALE, fill='#151515')
centered('25:00', 456, 404, 132, 300, '#f5f5f7')

draw.ellipse(box((718, 312, 914, 508)), outline='#409cff', width=17 * SCALE)
points = [(800, 387), (840, 410), (800, 433)]
draw.polygon([tuple(v * SCALE for v in pt) for pt in points], fill='#f5f5f7')
draw.line([tuple(v * SCALE for v in pt) for pt in points + [points[0]]], fill='#f5f5f7', width=9 * SCALE, joint='curve')
for px, py in points:
    draw.ellipse(box((px - 4.5, py - 4.5, px + 4.5, py + 4.5)), fill='#f5f5f7')

output = ROOT / 'public' / 'og-image.jpg'
canvas.convert('RGB').resize((W, H), Image.Resampling.LANCZOS).save(output, quality=93, subsampling=0, optimize=True)
print(f'{output}: {W} x {H}, {output.stat().st_size:,} bytes')
