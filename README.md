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

- **Dos versiones del instrumento:** la **1.0** de la tesis (41 indicadores, 180 afirmaciones) y la **1.1** con la dimensión política ampliada (46 indicadores, 203 afirmaciones; propuesta, ver [`docs/DIMENSION-POLITICA.md`](docs/DIMENSION-POLITICA.md)). Cuatro dimensiones: **ambiental (40 %)**, **social (30 %)**, **económica (20 %)** y **política (10 %)**.
- IDS por indicador, por dimensión y global, en la **escala original** de la tesis y en una **escala normalizada 0–1**.
- **Rigor metodológico** (v1.1): análisis de sensibilidad de los pesos (Monte Carlo ±20 %), equilibrio entre dimensiones (la dimensión más débil), y contribución por ODS (mapeo propuesto).
- **Fiabilidad**: compara evaluaciones de varias personas sobre la misma zona (κ de Fleiss, acuerdo por afirmación, consenso por mayoría) o de fechas distintas.
- **Coherencia** (v1.2): no deja responder «Sí» a dos afirmaciones contradictorias (p. ej. clima húmedo y seco a la vez), exige las dependencias lógicas y copia las afirmaciones repetidas.
- **Validación** (v1.3–1.4): compara el IDS con el **IDS de MIDEPLAN, ediciones 2017 (la de la tesis) y 2023, incluidas (con sus 5 dimensiones por distrito)** y, con tus propios CSV, con el IDH cantonal y el IPS cantonal (Spearman, Kendall, CCC, Bland–Altman, rango de cercanía, quintiles, grupos conocidos) y mide fiabilidad (ICC, κ, α de Cronbach). Ver [`docs/VALIDACION.md`](docs/VALIDACION.md).
- Contexto geográfico: provincia y cantón de Costa Rica (84 cantones), rol de quien responde y fecha, para contrastar luego con otros índices.
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
Detalle en [`docs/CORRECCIONES.md`](docs/CORRECCIONES.md). La revisión frente a otros índices
(IDH cantonal, IPS, IDS de MIDEPLAN, IDSC-BR, CPI…) está en [`docs/INVESTIGACION-INDICES.md`](docs/INVESTIGACION-INDICES.md),
las dudas de contenido del instrumento en [`docs/AUDITORIA-CONTENIDO.md`](docs/AUDITORIA-CONTENIDO.md) y los próximos pasos en [`docs/HOJA-DE-RUTA.md`](docs/HOJA-DE-RUTA.md).

## Desarrollo

Requiere solo Node ≥ 20 (no hay dependencias ni paso de compilación).

```bash
npm test          # pruebas del motor y de los datos
npm run serve     # http://127.0.0.1:8080
```

Para regenerar los datos desde el Excel: `pip install openpyxl && python tools/build_data.py`.

## Estructura

```
index.html · css/ · js/ (app, engine, consistency, sensitivity, stats, validation, validation-io, i18n) · data/ · icons/ · sw.js · manifest.webmanifest
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

Datos territoriales y del IDS 2023: MIDEPLAN / Registro Nacional (ver [`data/external/README.md`](data/external/README.md)).
Código: [MIT](LICENSE). Artículo y documentación en `paper/` y `docs/`: [CC BY 4.0](paper/LICENSE).
Para citar, usa [`CITATION.cff`](CITATION.cff) (botón «Cite this repository» de GitHub).
