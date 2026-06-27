#!/usr/bin/env python3
"""Generate placeholder PNG icons (pure stdlib, no Pillow).

Draws a rounded LinkedIn-blue square with a white horizontal "blocked feed"
bar crossed out. Output: icons/icon-{16,32,48,128}.png.

Re-run after tweaking if you want different placeholder art. For a store
submission, replace these with designed assets at the same sizes.
"""
import struct
import zlib
import os

BLUE = (10, 102, 194)
WHITE = (255, 255, 255)
SLASH = (220, 80, 80)

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "icons")
SIZES = [16, 32, 48, 128]


def make_image(size):
    px = [[(0, 0, 0, 0) for _ in range(size)] for _ in range(size)]
    radius = max(2, size // 6)

    def in_rounded(x, y):
        # rounded-rect membership test
        if x < radius and y < radius:
            return (radius - x) ** 2 + (radius - y) ** 2 <= radius ** 2
        if x >= size - radius and y < radius:
            return (x - (size - radius - 1)) ** 2 + (radius - y) ** 2 <= radius ** 2
        if x < radius and y >= size - radius:
            return (radius - x) ** 2 + (y - (size - radius - 1)) ** 2 <= radius ** 2
        if x >= size - radius and y >= size - radius:
            return (x - (size - radius - 1)) ** 2 + (y - (size - radius - 1)) ** 2 <= radius ** 2
        return True

    bar_h = max(1, size // 12)
    gap = max(2, size // 7)
    bars_y = [size // 3 + i * gap for i in range(3)]
    pad = size // 4

    for y in range(size):
        for x in range(size):
            if not in_rounded(x, y):
                continue
            color = BLUE
            for by in bars_y:
                if by <= y < by + bar_h and pad <= x < size - pad:
                    color = WHITE
            # diagonal slash (blocked)
            if abs((x) - (size - 1 - y)) <= max(1, size // 16):
                color = SLASH
            px[y][x] = (color[0], color[1], color[2], 255)
    return px


def write_png(path, px):
    size = len(px)
    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filter type 0
        for x in range(size):
            r, g, b, a = px[y][x]
            raw += bytes((r, g, b, a))

    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        c += struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        return c

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    png = sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for s in SIZES:
        out = os.path.join(OUT_DIR, f"icon-{s}.png")
        write_png(out, make_image(s))
        print("wrote", out)


if __name__ == "__main__":
    main()
