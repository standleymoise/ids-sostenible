# Datos externos de contraste

## MIDEPLAN · Índice de Desarrollo Social 2017 (la edición que usó la tesis)

Archivos: `mideplan-ids-2017-distritos.csv` (482 distritos) y `mideplan-ids-2017-cantones.csv` (82 cantones).
**Fuente:** MIDEPLAN, *Índice de Desarrollo Social 2017*, libro «IDS 2017.xlsx» (hojas «IDS segun PCD», «IDS dimensiones», «IDS AMNDR», «IDS cantonal»).
**Generado con:** `python tools/build_mideplan_2017.py "ruta/IDS 2017.xlsx"`.

- Distritos: `codigo`, `distrito`, `canton`, `provincia`, `ids` (0–100), `posicion`, `area` (Mayor / Medio / Bajo / Muy bajo desarrollo relativo) y las 5 dimensiones (`salud`, `participacion`, `seguridad`, `educacion`, `economico`).
- Cantones: `codigo`, `canton`, `provincia`, `ids`. **No trae dimensiones.**
- **Tres distritos sin dimensiones** (La Amistad 11912, San Lorenzo 20214, Matambú 51105): el libro trae su IDS pero no sus dimensiones; quedan con las dimensiones vacías.
- **Cobertura:** 482 distritos (la tabla comparativa de MIDEPLAN habla de 483) y 82 cantones; no incluye los cantones creados después (612 y 613). 480 de los 482 códigos existen en la división territorial actual (`60109` y `60702` ya no).
- **Pesos 2017:** MIDEPLAN dice que usó pesos distintos para cada dimensión pero el libro no los trae. Ajustando por mínimos cuadrados el IDS sobre sus 5 dimensiones se obtiene R² = 0,99999995 y **pesos implícitos aproximados** (estimación nuestra, no publicada): económica ≈ 0,28, educación ≈ 0,27, salud ≈ 0,22, seguridad ≈ 0,12, participación electoral ≈ 0,12. Sirve como comprobación de integridad.
- **No es comparable con la edición 2023** (más distritos y cambios metodológicos, según MIDEPLAN); por eso se guardan ambas por separado.

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
