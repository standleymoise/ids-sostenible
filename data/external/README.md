# Datos externos de contraste

## MIDEPLAN · Índice de Desarrollo Social 2017 (la edición que usó la tesis)

Archivos: `mideplan-ids-2017-distritos.csv` (483 distritos) y `mideplan-ids-2017-cantones.csv` (82 cantones).

**Fuentes** (ambas de MIDEPLAN, Área de Análisis del Desarrollo):
1. Libro «IDS 2017.xlsx» (hojas «IDS segun PCD», «IDS dimensiones», «IDS AMNDR», «IDS cantonal»): valores.
2. Informe *Índice de Desarrollo Social 2017* (PDF, 128 páginas, marzo de 2018): metodología, pesos, distritos imputados y el distrito que falta en el libro.

**Generado con:** `python tools/build_mideplan_2017.py "ruta/IDS 2017.xlsx"`.

### Metodología (informe, §1.6–1.10)
- **5 dimensiones, 19 indicadores y 14 índices.** Período de referencia 2011–2016. Cada indicador se estandariza de 0 a 100 (mín–máx, invertido si es negativo).
- **Pesos oficiales (Ecuación 2, p. 25):** IDS 2017 = **0,279**·Económica + **0,266**·Educación + **0,216**·Salud + **0,116**·Participación electoral + **0,123**·Seguridad. Se obtuvieron estadísticamente (correlaciones, covarianzas y componentes principales), no por criterio de expertos. El resultado se vuelve a estandarizar a 0–100. Con estos pesos se reproduce el IDS de los datos con r > 0,9999 (`tests/mideplan.test.js`).
- **Es un índice relativo:** el informe aclara que no establece umbrales; compara distritos y cantones entre sí. Por eso conviene validar con medidas de orden (Spearman, quintiles) y no con diferencias absolutas.
- **El IDS cantonal no se obtiene agregando distritos:** se calcula de nuevo para cada indicador a nivel de cantón.
- Cobertura: **483 distritos** (excluye la Isla del Coco, deshabitada) y **82 cantones** (Río Cuarto es nuevo en 2017). No comparable con 2013 ni con 2023.

### Columnas
- Distritos: `codigo`, `distrito`, `canton`, `provincia`, `ids` (0–100), `posicion`, `area` (Mayor / Medio / Bajo / Muy bajo desarrollo relativo), **`imputado`** (1 si MIDEPLAN imputó el IDS) y las 5 dimensiones (`salud`, `participacion`, `seguridad`, `educacion`, `economico`).
- Cantones: `codigo`, `canton`, `provincia`, `ids`. **No trae dimensiones.**

### Salvedades
- **5 distritos tienen el IDS imputado, no medido** (informe, Tabla 1): Quitirrisí (promedio de Jaris y Tarbaca), La Amistad (promedio de Pejibaye y Platanares), San Lorenzo de San Ramón (igual a Ángeles), Matambú (mínimo de Hojancha) y Caldera (promedio de Espíritu Santo, San Juan Grande y Puntarenas centro). Están marcados `imputado = 1` y **la pantalla de validación los excluye**.
- **Río Cuarto (21601)** no está en el libro de Excel, pero sí en el informe (IDS 44,75; posición 434; nivel «muy bajo»): se añadió desde el PDF (2 decimales) y no tiene dimensiones. El informe dice que su código es 21601 «en lugar de 20306».
- Otros 3 distritos (La Amistad, San Lorenzo, Matambú) no traen dimensiones en el libro.
- 481 de los 483 códigos existen en la división actual; `60109` (Monteverde) y `60702` (Puerto Jiménez) hoy son cantones (612 y 613).
- **Cita:** MIDEPLAN (2018). *Índice de Desarrollo Social 2017*. San José: Ministerio de Planificación Nacional y Política Económica, Área de Análisis del Desarrollo.

## MIDEPLAN · Índice de Desarrollo Social 2023

Archivos: `mideplan-ids-2023-distritos.csv` (490 distritos) y `mideplan-ids-2023-cantones.csv` (84 cantones).
También `../cr-distritos.json` (provincias › cantones › distritos con códigos oficiales).

**Fuente:** Ministerio de Planificación Nacional y Política Económica (MIDEPLAN), *Índice de Desarrollo Social 2023*, libro de tablas «Tablas - IDS 2023.xlsx»
(https://www.mideplan.go.cr/indice-desarrollo-social). La división territorial es la del Registro Nacional / IGN 2022 (Anexo 1 del mismo libro).
Se reproducen solo los valores numéricos publicados, para análisis de validación; el documento oficial es la referencia citable.

**Generado con:** `python tools/build_mideplan.py "ruta/Tablas - IDS 2023.xlsx"`.

### Columnas
- Distritos: `codigo` (PCD: provincia-cantón-distrito, 5 dígitos), `distrito`, `canton`, `provincia`, `ids` (0–100), `posicion` (nacional), `quintil` (I–V), y los índices por dimensión (0–100): `salud`, `participacion` (electoral), `seguridad`, `educacion`, `economico`.
- Cantones: `codigo` (3 dígitos), `canton`, `provincia`, `ids` (final, 0–100) y las mismas 5 dimensiones.

### Cómo se construye el IDS de MIDEPLAN (Tabla 1 del libro)
Cada indicador se estandariza de 0 a 100 con mín–máx (invertido si es negativo); cada dimensión es el promedio de sus indicadores
(20 indicadores en total, 14 subíndices) y el IDS es la suma ponderada de las dimensiones, re-estandarizada a 0–100:

| Dimensión | Peso |
|---|---|
| Económica | 28,1 % |
| Salud | 25,5 % |
| Educación | 24,0 % |
| Participación electoral | 15,9 % |
| Seguridad | 6,5 % |

Comprobación hecha al extraer los datos: recalculando el IDS con estos pesos a partir de las cinco dimensiones se reproduce el IDS publicado
con r = 0,999998 (distritos) y 0,9999998 (cantones), lo que confirma que las columnas están bien identificadas (`tests/mideplan.test.js`).

### Notas y salvedades
- **«Isla del Coco»** (código 60110) figura en la división territorial pero MIDEPLAN no le calcula IDS: se excluyó. Quedan 490 distritos.
- En un distrito (**Reventazón, Siquirres, 70307**) el IDS de la Tabla 4 (31,62) difiere del de la tabla regional (≈ 32,3). Se usó el de la Tabla 4 (IDS distrital oficial); el efecto es mínimo.
- Los nombres de distrito **se repiten** entre cantones (p. ej. «San Juan»), por eso el cruce con las evaluaciones se hace por **código**, no por nombre.
- El IDS 2023 **no es comparable con el de 2017** (más distritos y cambios metodológicos), según MIDEPLAN.
- Este IDS mide **desarrollo social**: no incluye dimensión ambiental ni política. Es de esperar que la dimensión ambiental de la Escala de Standley correlacione poco con él (validez discriminante).
