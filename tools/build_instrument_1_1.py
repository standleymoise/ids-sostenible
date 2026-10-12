"""Compila el instrumento 1.1 (dimensión política ampliada) a partir del instrumento 1.0 (tesis) y
data/src/political-1.1.json.

Genera:
  data/indicators-1.1.json          instrumento completo 1.1
  data/i18n-1.1.es.json / .en.json  textos de los indicadores nuevos (se combinan con data/i18n.*.json al cargar)
  actualiza data/sdg-map.json       con los ODS de los indicadores nuevos

Uso (desde la raíz): python tools/build_instrument_1_1.py
El instrumento 1.0 (data/indicators.json) no se modifica: se conserva tal como salió del Excel de la tesis.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
D = ROOT / "data"


def load(p):
    return json.loads(p.read_text(encoding="utf-8"))


def dump(p, o):
    p.write_text(json.dumps(o, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def main():
    base = load(D / "indicators.json")
    src = load(D / "src" / "political-1.1.json")
    texts = {"es": {}, "en": {}}
    sdg = load(D / "sdg-map.json")

    pol = next(d for d in base["dimensions"] if d["id"] == "political")
    kept = next(i for i in pol["indicators"] if i["id"] == src["keep"]["id"])
    new_pol = [{**kept, "weight": src["keep"]["weight"]}]
    for ind in src["indicators"]:
        items = []
        for k, it in enumerate(ind["items"], 1):
            iid = f"{ind['id']}_{k}"
            items.append({"id": iid, "weight": it["weight"]})
            texts["es"][f"item.{iid}"] = it["es"]
            texts["en"][f"item.{iid}"] = it["en"]
        # comprobaciones de diseño: los pesos positivos suman 1 y los negativos son pocos y moderados
        pos = round(sum(i["weight"] for i in items if i["weight"] > 0), 6)
        neg = [i["weight"] for i in items if i["weight"] < 0]
        assert abs(pos - 1) < 1e-9, (ind["id"], pos)
        assert len(neg) <= 1 and all(-0.3 <= n < 0 for n in neg), (ind["id"], neg)
        new_pol.append({"id": ind["id"], "weight": ind["weight"], "items": items})
        texts["es"][f"ind.{ind['id']}"] = ind["name"]["es"]
        texts["en"][f"ind.{ind['id']}"] = ind["name"]["en"]
        sdg["map"][ind["id"]] = ind["sdg"]
    for iid, names in src.get("rename", {}).items():  # el indicador original conserva sus afirmaciones, solo cambia su nombre
        texts["es"][f"ind.{iid}"] = names["es"]
        texts["en"][f"ind.{iid}"] = names["en"]
    total = round(sum(i["weight"] for i in new_pol), 6)
    assert abs(total - 1) < 1e-9, total

    inst = json.loads(json.dumps(base))
    inst["instrument"] = "1.1"
    inst["dimensions"] = [d if d["id"] != "political" else {**d, "indicators": new_pol} for d in inst["dimensions"]]
    dump(D / "indicators-1.1.json", inst)
    dump(D / "i18n-1.1.es.json", dict(sorted(texts["es"].items())))
    dump(D / "i18n-1.1.en.json", dict(sorted(texts["en"].items())))
    dump(D / "sdg-map.json", sdg)
    n_ind = sum(len(d["indicators"]) for d in inst["dimensions"])
    n_items = sum(len(i["items"]) for d in inst["dimensions"] for i in d["indicators"])
    print(f"instrumento 1.1: {n_ind} indicadores, {n_items} afirmaciones; política: {len(new_pol)} indicadores")


if __name__ == "__main__":
    main()
