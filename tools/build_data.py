"""Genera data/indicators.json y data/i18n.{es,en}.json a partir del Excel
original de la tesis (reference/escala-ids-1.0.xlsx) y de los strings.xml de
la app Android (reference/strings.*.xml).

Uso (desde la raíz del repositorio):  python tools/build_data.py
Requiere: openpyxl.
"""
import json
import re
import unicodedata
import xml.etree.ElementTree as ET
from pathlib import Path

import openpyxl
from openpyxl.utils import column_index_from_string as ci, get_column_letter as cl

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "reference" / "escala-ids-1.0.xlsx"

# Dimensión -> (columna inicial, columna del índice, prefijo, claves de strings.xml)
DIMS = [
    # id, prefijo, primera col, última col, peso en el IDS (fila 18), strings
    ("environmental", "env", "B", "CI", "HO18", "ambient", "d_ambiental"),
    ("economic", "eco", "CJ", "EX", "HP18", "economic", "d_economica"),
    ("political", "pol", "EY", "FF", "HQ18", "politic", "d_politica"),
    ("social", "soc", "FG", "HN", "HR18", "social", "d_social"),
]


# Erratas de los textos originales de la app (solo español). Lista explícita y auditable.
TYPOS_ES = {
    "Salario minímo": "Salario mínimo",
    "Servicos": "Servicios",
    "alfatadas": "asfaltadas",
    "cazamiento": "caza",
    "Clorificaicón": "Cloración",
    "intalaciones": "instalaciones",
    "Presenciad de": "Presencia de",
    "continuan": "continúan",
    "delagación": "delegación",
    "contrubuye": "contribuye",
    "Organuismos": "Organismos",
    "Nox": "NOx",
}


def fix_typos(s: str) -> str:
    for a, b in TYPOS_ES.items():
        s = s.replace(a, b)
    return s


def unescape(s: str) -> str:
    s = s or ""
    s = s.replace("\\'", "'").replace('\\"', '"').replace("\\n", "\n").replace("\\@", "@")
    return re.sub(r"[ \t]*\n[ \t]*", "\n", s).strip()


def load_strings(path: Path) -> dict:
    out = {}
    for el in ET.parse(path).getroot().iter("string"):
        out[el.get("name")] = unescape("".join(el.itertext()))
    return out


def main() -> None:
    ws = openpyxl.load_workbook(XLSX).active
    ws_v = openpyxl.load_workbook(XLSX, data_only=True).active
    es, en = load_strings(ROOT / "reference" / "strings.es.xml"), load_strings(ROOT / "reference" / "strings.en.xml")

    dims, sample = [], {}
    for dim_id, pre, c0, c1, wcell, skey, dkey in DIMS:
        indicators, items, n = [], [], 0
        for col in range(ci(c0), ci(c1) + 1):
            L = cl(col)
            v16 = ws[f"{L}16"].value
            if isinstance(v16, str) and v16.upper().startswith("=SUMPRODUCT"):
                n += 1
                iid = f"{pre}{n:02d}"
                indicators.append({
                    "id": iid,
                    "weight": ws[f"{L}18"].value,
                    "items": [{"id": f"{iid}_{k}", "weight": w} for k, (_, w) in enumerate(items, 1)],
                })
                for k, (ans, _) in enumerate(items, 1):
                    sample[f"{iid}_{k}"] = ans
                items = []
            else:
                items.append((v16, ws[f"{L}17"].value))
        assert not items, f"columnas sueltas en {dim_id}"
        dims.append({"id": dim_id, "weight": ws[wcell].value, "indicators": indicators})

    # --- textos (es/en) --------------------------------------------------
    texts = {"es": {}, "en": {}}
    for dim_id, pre, _c0, _c1, _w, skey, dkey in DIMS:
        d = next(x for x in dims if x["id"] == dim_id)
        for lang, src in (("es", es), ("en", en)):
            texts[lang][f"dim.{dim_id}"] = src.get(dkey) or es[dkey]
        for n, ind in enumerate(d["indicators"], 1):
            for lang, src in (("es", es), ("en", en)):
                k = f"d_{skey}_sub{n}"
                texts[lang][f"ind.{ind['id']}"] = src.get(k) or es[k]
            for m, it in enumerate(ind["items"], 1):
                k = f"{pre}_value{n}_{m}"
                for lang, src in (("es", es), ("en", en)):
                    texts[lang][f"item.{it['id']}"] = src.get(k) or es[k]

    # --- resto de strings de la app (guía, acerca de, consejos, etc.) ------
    skip = re.compile(r"^(d_|(env|eco|soc|pol)_value|k_|app_name)")
    for lang, src in (("es", es), ("en", en)):
        for k, v in src.items():
            if not skip.match(k):
                texts[lang]["app." + k] = v
        for k, v in es.items():  # respaldo en español
            if not skip.match(k):
                texts[lang].setdefault("app." + k, v)

    for k in list(texts["es"]):
        if k.startswith(("ind.", "item.", "dim.")):
            texts["es"][k] = fix_typos(texts["es"][k])

    out = {
        "schema": 1,
        "instrument": "1.0",
        "scale": {"answers": [0, 1]},
        "dimensions": dims,
    }
    data = ROOT / "data"
    data.mkdir(exist_ok=True)
    (data / "indicators.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    for lang in ("es", "en"):
        (data / f"i18n.{lang}.json").write_text(
            json.dumps(texts[lang], ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf-8")

    # Caso de prueba: respuestas de ejemplo del Excel + resultados en caché
    # (OJO: HO17 en caché contiene el error BO16*B18; se recalcula en las pruebas).
    (ROOT / "tests" / "fixture-excel.json").write_text(json.dumps({
        "answers": sample,
        "cached": {k: ws_v[k].value for k in ("HO17", "HP17", "HQ17", "HR17", "HS17")},
        "cached_BO16": ws_v["BO16"].value,
    }, indent=1) + "\n", encoding="utf-8")

    for d in dims:
        print(d["id"], d["weight"], len(d["indicators"]), "indicadores,",
              sum(len(i["items"]) for i in d["indicators"]), "ítems")


if __name__ == "__main__":
    main()
