import csv
import os
from pathlib import Path

ROOT = Path(r"c:\Users\hanus\OneDrive\Desktop\ip")
INPUT_FILE = ROOT / "game_products_review_manual.csv"
OUTPUT_FILE = ROOT / "data" / "processed" / "game_products.csv"

def verify_foods():
    if not INPUT_FILE.exists():
        print(f"File not found: {INPUT_FILE}")
        return

    processed_rows = []
    approved_rows = []
    seen_codes = set()
    
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            code = row.get("code", "").strip()
            name = row.get("display_name", "").strip()
            ingredients = row.get("ingredients_text", "").strip()
            nova_group = row.get("nova_group", "").strip()
            
            is_valid = True
            
            # Rule 1: Valid Code
            if not code:
                is_valid = False
            # Rule 2: Valid Name
            elif not name:
                is_valid = False
            # Rule 3: Valid Ingredients
            elif not ingredients or len(ingredients) < 5:
                is_valid = False
            # Rule 4: Valid NOVA Group
            elif not nova_group.isdigit() or not (1 <= int(nova_group) <= 4):
                is_valid = False
            # Rule 5: Deduplication
            elif code in seen_codes:
                is_valid = False
            
            if is_valid:
                seen_codes.add(code)
                row["game_ready"] = "TRUE"
                row["review_status"] = "approved"
                approved_rows.append(row)
            else:
                row["game_ready"] = "FALSE"
                row["review_status"] = "rejected"
            
            processed_rows.append(row)

    # Write back the original file with updated status
    with open(INPUT_FILE, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(processed_rows)
        
    print(f"Updated {INPUT_FILE} with review statuses.")

    # Write the processed file
    os.makedirs(OUTPUT_FILE.parent, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(approved_rows)
        
    print(f"Created {OUTPUT_FILE} with {len(approved_rows)} approved items.")
    print(f"Rejected items: {len(processed_rows) - len(approved_rows)}")

if __name__ == "__main__":
    verify_foods()
