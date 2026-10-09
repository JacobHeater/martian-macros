"""MM-51 question 7: how many barcodes from a real pantry does a pack find?

    python pantry_coverage.py PACK.db barcodes.txt

barcodes.txt has one barcode per line (UPC-A, EAN-13 or EAN-8 as printed).
PACK.db is any SQLite pack in format version 1 (for example the one written by
4_pack_sizes.py). Barcodes are normalized to GTIN-14 the same way as
`normalizeBarcode` in mm_domain (UPC-E is not handled: give the UPC-A).
"""
import re
import sqlite3
import sys


def gtin14(raw):
    digits = re.sub(r"\D", "", raw)
    if not 8 <= len(digits) <= 14:
        return None
    padded = digits.rjust(14, "0")
    total = sum(int(d) * (3 if i % 2 == 0 else 1) for i, d in enumerate(padded[:13]))
    return padded if (10 - total % 10) % 10 == int(padded[13]) else None


def main(pack, codes_file):
    db = sqlite3.connect(f"file:{pack}?mode=ro", uri=True)
    found = missing = invalid = 0
    for line in open(codes_file, encoding="utf-8"):
        line = line.strip()
        if not line:
            continue
        g = gtin14(line)
        if g is None:
            invalid += 1
            print("invalid   ", line)
        elif db.execute("select 1 from barcodes where gtin = ?", (g,)).fetchone():
            found += 1
        else:
            missing += 1
            print("not found ", line)
    total = found + missing + invalid
    print(f"{found} of {total} found, {missing} not found, {invalid} invalid")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
