"""MM-51 question 7: how many barcodes from a real pantry does a pack find?

    python3 pantry_coverage.py barcode_us.pack barcodes.txt

barcodes.txt has one barcode per line (UPC-A, EAN-13 or EAN-8 as printed).
The pack is any SQLite food pack (`apps/mobile/src/foodCatalog/FoodPackFormat.ts`,
table `barcodes(gtin, food_id)`): the `barcode_us-*.pack.gz` asset of the latest
martian-macros-food-data release, gunzipped, or `barcode_us.pack` written by
`./mm food build`. Barcodes are normalized to GTIN-14 as `normalizeBarcode`
does (apps/mobile/src/domain/food/); UPC-E is not handled: give the UPC-A.
Needs only the Python standard library. Restored for MM-51 from the spike of
2026-10-09 (removed with the Flutter tree in MM-232).
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
    try:
        with open(codes_file, encoding="utf-8") as codes:
            for line in codes:
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
    finally:
        db.close()
    total = found + missing + invalid
    print(f"{found} of {total} found, {missing} not found, {invalid} invalid")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("usage: python3 pantry_coverage.py PACK barcodes.txt")
    main(sys.argv[1], sys.argv[2])
