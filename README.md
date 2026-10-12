# Calculadora IDS · Escala de Standley

Calculadora web (PWA) del **Índice de Desarrollo Sostenible (IDS)** para zonas locales
—comunidades, distritos, cantones—, basada en el Proyecto de Graduación de
**Standley Moïse** (Licenciatura en Ciencias Agrícolas, Universidad EARTH, Costa Rica, 2020),
asesorado por MSc. Victor Hugo Morales Peña.

> English summary: a static, offline-capable web app (PWA) that computes a local
> Sustainable Development Index from 41 indicators (180 yes/no statements) across
> four dimensions. Bilingual UI (es/en), no server, no accounts, data stays on the device.

**Usarla:** https://standleymoise.github.io/ids-sostenible/ · funciona sin conexión y se puede instalar en el celular.

## Qué hace

- 41 indicadores y 180 afirmaciones Sí/No en cuatro dimensiones: **ambiental (40 %)**, **social (30 %)**, **económica (20 %)** y **política (10 %)**.
- IDS por indicador, por dimensión y global, en la **escala original** de la tesis y en una **escala normalizada 0–1**.
- Varias evaluaciones guardadas en el dispositivo; exportar a JSON/CSV, importar, e imprimir a PDF.
- Español e inglés. Sin servidor, sin cuentas, sin rastreo: los datos no salen del dispositivo.

## Modelo

```
indicador  = Σ peso_ítem · respuesta            (respuesta ∈ {0, 1}; hay pesos negativos)
dimensión  = Σ peso_indicador · indicador
IDS        = 0,4·ambiental + 0,3·social + 0,2·económica + 0,1·política
```

Los pesos están en [`data/indicators.json`](data/indicators.json) (se generan desde el Excel original con
[`tools/build_data.py`](tools/build_data.py)). El motor de cálculo es [`js/engine.js`](js/engine.js), sin
dependencias, y se verifica contra el Excel en [`tests/`](tests/).

## Correcciones respecto a la app Android y al Excel

Al portar el modelo se encontraron y corrigieron errores (una fórmula de Excel, una pregunta
omitida y tres pesos en cero en la app) y queda una duda abierta sobre el signo de «Inflación».
Detalle en [`docs/CORRECCIONES.md`](docs/CORRECCIONES.md).

## Desarrollo

Requiere solo Node ≥ 20 (no hay dependencias ni paso de compilación).

```bash
npm test          # pruebas del motor y de los datos
npm run serve     # http://127.0.0.1:8080
```

Para regenerar los datos desde el Excel: `pip install openpyxl && python tools/build_data.py`.

## Estructura

```
index.html · css/ · js/ (app, engine, i18n) · data/ · icons/ · sw.js · manifest.webmanifest
tests/        pruebas automáticas (node:test)
tools/        generador de datos y servidor local
reference/    material original: Excel 1.0, strings.xml y modelo Kotlin de la app Android
paper/        artículo científico (borrador)
docs/         correcciones y notas
```

## Advertencia

El resultado es **aproximado y orientativo**: no sustituye un estudio técnico. El instrumento fue validado con
una muestra pequeña (ver el artículo); se recomienda un uso responsable.

## Licencia y cita

Código: [MIT](LICENSE). Artículo y documentación en `paper/` y `docs/`: [CC BY 4.0](paper/LICENSE).
Para citar, usa [`CITATION.cff`](CITATION.cff) (botón «Cite this repository» de GitHub).
