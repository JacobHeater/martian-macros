#!/usr/bin/env python3
"""The app icon's rasters, from the vector masters in design/ (MM-109).

Run on a Mac: python3 scripts/app-icons.py

The masters are SVG: icon.svg (the icon on its violet ground), icon-dark.svg
and icon-tinted.svg (iOS 18's dark and tinted icons) and launch-mark.svg (the
mark alone, for the launch screen). Android needs no raster: minSdk is 26, so
its launcher icon, themed icon and launch screen are the vector drawables in
android/app/src/main/res/drawable/, the twins of these masters.

This writes the iOS 1024 px icons (opaque: the App Store refuses an icon with
an alpha channel), the iOS launch mark at 1x, 2x and 3x, the web shell's
favicon in public/, and the Play store's 512 px icon in design/store/.

macOS's Quick Look (qlmanage) draws the SVG, so nothing is installed; the PNGs
are decoded and re-encoded here to drop the alpha channel where it must go.
Quick Look fills transparency with white, so a transparent master is drawn on
black and on white and its alpha recovered from the difference.

The owner's illustrations (app-icon.png, loading-screen.png,
landscape-loading-screen.png) stay in design/ as art; nothing is generated
from them any more.
"""
import struct
import subprocess
import sys
import tempfile
import zlib
from pathlib import Path

mobile = Path(__file__).resolve().parent.parent
design = mobile / 'design'
catalog = mobile / 'ios/App/App/Assets.xcassets'

# (master, pixel size, output, keeps alpha)
RASTERS = [
    ('icon.svg', 1024, catalog / 'AppIcon.appiconset/AppIcon-1024.png', False),
    ('icon-dark.svg', 1024, catalog / 'AppIcon.appiconset/AppIcon-1024-dark.png', False),
    ('icon-tinted.svg', 1024, catalog / 'AppIcon.appiconset/AppIcon-1024-tinted.png', False),
    ('launch-mark.svg', 192, catalog / 'LaunchMark.imageset/launch-mark.png', True),
    ('launch-mark.svg', 384, catalog / 'LaunchMark.imageset/launch-mark@2x.png', True),
    ('launch-mark.svg', 576, catalog / 'LaunchMark.imageset/launch-mark@3x.png', True),
    ('icon.svg', 192, mobile / 'public/app-icon.png', False),
    ('icon.svg', 512, design / 'store/play-icon-512.png', False),
]


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


def render(master: Path, size: int, scratch: Path):
    """Quick Look's drawing of the SVG at size by size, as decoded pixels."""
    subprocess.run(['qlmanage', '-t', '-s', str(size), '-o', str(scratch), str(master)], check=True, capture_output=True)
    width, height, pixels = read_png(scratch / f'{master.name}.png')
    assert (width, height) == (size, size), f'{master.name} drew {width}x{height}, not {size}'
    return pixels


def on_ground(master: Path, ground: str, scratch: Path) -> Path:
    """A copy of the master with a solid ground under the drawing."""
    svg = master.read_text()
    assert '</defs>' in svg, f'{master.name} has no <defs> to put the ground after'
    copy = scratch / f'{master.stem}-{ground.strip("#")}.svg'
    copy.write_text(svg.replace('</defs>', f'</defs><rect x="-1000" y="-1000" width="3000" height="3000" fill="{ground}"/>', 1))
    return copy


def transparent(master: Path, size: int, scratch: Path):
    """The master's pixels with alpha: drawn on black and on white, alpha is one minus their difference."""
    black = render(on_ground(master, '#000000', scratch), size, scratch)
    white = render(on_ground(master, '#ffffff', scratch), size, scratch)
    out = []
    for row_b, row_w in zip(black, white):
        row = []
        for b, w in zip(row_b, row_w):
            a = 255 - round(sum(w[i] - b[i] for i in range(3)) / 3)
            a = max(0, min(255, a))
            row.append(tuple(min(255, round(b[i] * 255 / a)) for i in range(3)) + (a,) if a else (0, 0, 0, 0))
        out.append(row)
    return out


def main() -> None:
    with tempfile.TemporaryDirectory() as scratch:
        for name, size, out, alpha in RASTERS:
            draw = transparent if alpha else render
            write_png(out, draw(design / name, size, Path(scratch)), alpha=alpha)
            print(f'{out.relative_to(mobile)} ({size} px) from {name}')


if __name__ == '__main__':
    sys.exit(main())
