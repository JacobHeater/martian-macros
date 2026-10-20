#!/usr/bin/env python3
"""Every app icon and splash from design/ (run: python3 scripts/app-icons.py).

The icon master, app-icon.png, is a square PNG with the art filling the
frame. iOS takes it at 1024 px. Android takes a square launcher at each
density, a round one (the same art under a circle), and an adaptive
foreground: the art at two thirds on a canvas of the art's own corner
colour, which is also the adaptive background, so the system's mask shows
a seamless edge. The web shell takes a 192 px favicon.

The splash masters are loading-screen.png (portrait) and
landscape-loading-screen.png. Each platform's splash is the art fitted
whole inside the frame that platform wants, on the art's own corner colour,
so the bars on a taller or wider screen match the sky: iOS one 2732 px
square of the portrait art (shown aspect-fit by the launch storyboard),
Android the portrait art at each portrait density and the landscape art at
each landscape density.

Pure Python: it decodes and encodes the PNGs itself, so it needs nothing
installed.
"""
import struct
import sys
import zlib
from pathlib import Path

mobile = Path(__file__).resolve().parent.parent
master = mobile / 'design' / 'app-icon.png'
splash_master = mobile / 'design' / 'loading-screen.png'
landscape_master = mobile / 'design' / 'landscape-loading-screen.png'


def read_png(path: Path):
    data = path.read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'not a PNG'
    pos, width, height, channels, idat = 8, 0, 0, 0, b''
    while pos < len(data):
        length, kind = struct.unpack('>I4s', data[pos:pos + 8])
        body = data[pos + 8:pos + 8 + length]
        if kind == b'IHDR':
            width, height, depth, colour, _, _, interlace = struct.unpack('>IIBBBBB', body)
            assert depth == 8 and interlace == 0, 'only 8-bit, non-interlaced PNGs'
            channels = {2: 3, 6: 4}[colour]
        elif kind == b'IDAT':
            idat += body
        pos += 12 + length
    raw = zlib.decompress(idat)
    stride = width * channels
    rows, previous = [], bytearray(stride)
    at = 0
    for _ in range(height):
        kind = raw[at]
        line = bytearray(raw[at + 1:at + 1 + stride])
        at += 1 + stride
        for i in range(stride):
            a = line[i - channels] if i >= channels else 0
            b = previous[i]
            c = previous[i - channels] if i >= channels else 0
            if kind == 1:
                line[i] = (line[i] + a) & 255
            elif kind == 2:
                line[i] = (line[i] + b) & 255
            elif kind == 3:
                line[i] = (line[i] + (a + b) // 2) & 255
            elif kind == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[i] = (line[i] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        rows.append(line)
        previous = line
    pixels = [[tuple(row[x * channels:x * channels + 3]) + ((row[x * channels + 3],) if channels == 4 else (255,)) for x in range(width)] for row in rows]
    return width, height, pixels


def write_png(path: Path, pixels, alpha: bool):
    height, width = len(pixels), len(pixels[0])
    channels = 4 if alpha else 3
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for p in row:
            raw.extend(p[:channels])
    chunks = [(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6 if alpha else 2, 0, 0, 0)), (b'IDAT', zlib.compress(bytes(raw), 9)), (b'IEND', b'')]
    out = bytearray(b'\x89PNG\r\n\x1a\n')
    for kind, body in chunks:
        out += struct.pack('>I', len(body)) + kind + body + struct.pack('>I', zlib.crc32(kind + body) & 0xFFFFFFFF)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(out)


def resize(pixels, size: int, width=None):
    """A box filter over the source area each target pixel covers: clean downscaling, no library."""
    source_h, source_w = len(pixels), len(pixels[0])
    height, width = size, width if width is not None else size
    out = []
    for y in range(height):
        y0, y1 = y * source_h / height, (y + 1) * source_h / height
        row = []
        for x in range(width):
            x0, x1 = x * source_w / width, (x + 1) * source_w / width
            total = [0.0, 0.0, 0.0, 0.0]
            weight = 0.0
            for sy in range(int(y0), min(source_h, int(y1) + 1)):
                wy = min(y1, sy + 1) - max(y0, sy)
                if wy <= 0:
                    continue
                for sx in range(int(x0), min(source_w, int(x1) + 1)):
                    wx = min(x1, sx + 1) - max(x0, sx)
                    if wx <= 0:
                        continue
                    w = wx * wy
                    p = pixels[sy][sx]
                    for i in range(4):
                        total[i] += p[i] * w
                    weight += w
            row.append(tuple(int(round(t / weight)) for t in total))
        out.append(row)
    return out


def on_canvas(art, size: int, scale: float, fill):
    inner = resize(art, int(round(size * scale)))
    offset = (size - len(inner)) // 2
    canvas = [[fill for _ in range(size)] for _ in range(size)]
    for y, row in enumerate(inner):
        canvas[offset + y][offset:offset + len(inner)] = row
    return canvas


def fitted(art, width: int, height: int, fill):
    """The art whole inside width by height, centred, on `fill`."""
    art_h, art_w = len(art), len(art[0])
    scale = min(width / art_w, height / art_h)
    inner = resize(art, max(1, int(round(art_h * scale))), max(1, int(round(art_w * scale))))
    top, left = (height - len(inner)) // 2, (width - len(inner[0])) // 2
    canvas = [[fill for _ in range(width)] for _ in range(height)]
    for y, row in enumerate(inner):
        canvas[top + y][left:left + len(row)] = row
    return canvas


def rounded(pixels):
    size = len(pixels)
    r = size / 2
    return [[p if (x + 0.5 - r) ** 2 + (y + 0.5 - r) ** 2 <= r * r else (0, 0, 0, 0) for x, p in enumerate(row)] for y, row in enumerate(pixels)]


def main() -> None:
    width, height, art = read_png(master)
    assert width == height, 'the master must be square'
    corner = art[4][4][:3] + (255,)
    write_png(mobile / 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', resize(art, 1024), alpha=False)
    res = mobile / 'android/app/src/main/res'
    for density, launcher, foreground in [('mdpi', 48, 108), ('hdpi', 72, 162), ('xhdpi', 96, 216), ('xxhdpi', 144, 324), ('xxxhdpi', 192, 432)]:
        square = resize(art, launcher)
        write_png(res / f'mipmap-{density}/ic_launcher.png', square, alpha=False)
        write_png(res / f'mipmap-{density}/ic_launcher_round.png', rounded(square), alpha=True)
        write_png(res / f'mipmap-{density}/ic_launcher_foreground.png', on_canvas(art, foreground, 2 / 3, corner), alpha=False)
    colour = '#%02X%02X%02X' % corner[:3]
    (res / 'values/ic_launcher_background.xml').write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">%s</color>\n</resources>\n' % colour
    )
    write_png(mobile / 'public/app-icon.png', resize(art, 192), alpha=False)
    print(f'icons written from {master.name} ({width} px); adaptive background {colour}')

    splash_w, splash_h, splash = read_png(splash_master)
    sky = splash[4][4][:3] + (255,)
    square = fitted(splash, 2732, 2732, sky)
    for name in ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']:
        write_png(mobile / 'ios/App/App/Assets.xcassets/Splash.imageset' / name, square, alpha=False)
    land_w, land_h, landscape = read_png(landscape_master)
    land_sky = landscape[4][4][:3] + (255,)
    write_png(res / 'drawable/splash.png', fitted(landscape, 480, 320, land_sky), alpha=False)
    for density, w, h in [('mdpi', 320, 480), ('hdpi', 480, 800), ('xhdpi', 720, 1280), ('xxhdpi', 960, 1600), ('xxxhdpi', 1280, 1920)]:
        write_png(res / f'drawable-port-{density}/splash.png', fitted(splash, w, h, sky), alpha=False)
        write_png(res / f'drawable-land-{density}/splash.png', fitted(landscape, h, w, land_sky), alpha=False)
    print(f'splashes written from {splash_master.name} ({splash_w}x{splash_h} px) and {landscape_master.name} ({land_w}x{land_h} px); sky {"#%02X%02X%02X" % sky[:3]}')


if __name__ == '__main__':
    sys.exit(main())
