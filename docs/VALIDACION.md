# Protocolo de validación

Objetivo: mostrar con evidencia si la Escala de Standley se comporta como un índice de desarrollo sostenible
local, contrastándola con índices oficiales y midiendo su fiabilidad. La web (pantalla **Validación**) y la línea de
comandos (`node tools/validate.js`) hacen los mismos cálculos, verificados contra scipy en `tests/validation.test.js`.

> Importante: ningún número de este repositorio sobre validación es resultado real. Los ejemplos de la pantalla
> («datos simulados») sirven solo para probar el programa.

## 1. Qué se compara y por qué

| Índice externo | Quién | Nivel | Por qué es un buen contraste |
|---|---|---|---|
| **IDS distrital** (el «IDSD» de la tesis) | MIDEPLAN, edición 2023 | 490 distritos, 84 cantones | Es el único con datos por distrito: permite evaluar zonas pequeñas, que es el propósito de la escala |
| **IDH cantonal** (IDHc) | PNUD–UCR, Atlas 2026 | 84 cantones | Referencia de desarrollo humano |
| **IPS cantonal** | INCAE-CLACDS | 81 cantones (edición 2019) | Incluye dimensión ambiental; es el más cercano en concepto |

Los tres miden conceptos **cercanos pero distintos** a «desarrollo sostenible» (desarrollo humano, progreso social,
desarrollo social). Se espera una asociación positiva, no idéntica. Si el IDS correlacionara perfectamente con uno,
sería redundante; si no correlacionara con ninguno, no estaría midiendo desarrollo.

## 2. Diseño de la muestra

- **Unidad:** distrito (para comparar con MIDEPLAN) o cantón (para el IDHc y el IPS). Anotar el distrito/cantón en cada evaluación (la web lo guarda).
- **Tamaño mínimo:** para detectar ρ ≥ 0,5 con 80 % de potencia y α = 0,05 hacen falta unas **29 zonas** (aprox. de Fisher: n ≈ ((1,96 + 0,84)/atanh(0,5))² + 3). Con menos de 10 zonas los intervalos son tan amplios que casi no informan. La web avisa cuando n < 10 o n < 30.
- **Selección de zonas:** que cubran todo el rango del índice externo (no solo zonas parecidas). Un muestreo estratificado por quintil del índice de MIDEPLAN es lo ideal; si todas las zonas son similares la correlación se infravalora (restricción de rango).
- **Evaluadores:** idealmente 3 o más personas por zona, de perfiles distintos (institución, profesional, comunidad); esto permite medir fiabilidad entre evaluadores y promediar. Que cada persona responda **de forma independiente**.
- **Protocolo de respuesta:** mismas instrucciones para todos (ver la guía de la app) y marcar el rol de quien responde.
- **Fechas:** evaluar cerca del año del índice externo (los índices cantonales usan datos de 2020-2023).

## 3. Datos externos

**MIDEPLAN ya está incluido en la app** (`data/external/`, proporcionado como «Tablas - IDS 2023.xlsx»; ver su README): IDS de los 490 distritos y 84 cantones, con las 5 dimensiones y códigos oficiales. Para los otros dos índices: al 12 de octubre de 2026, MIDEPLAN publica una hoja de cálculo (XLS) con el IDS 2023; el Atlas del PNUD se encontró solo como PDF y herramienta interactiva (sin CSV directo); del IPS cantonal no se encontró una tabla descargable. Hay que preparar un CSV con lo que se obtenga:

- **MIDEPLAN IDS 2023:** la página oficial publica el paquete de datos con valores distritales, cantonales y regionales (hoja de cálculo y PDF metodológico): https://www.mideplan.go.cr/indice-desarrollo-social
- **Atlas de Desarrollo Humano Cantonal:** PDF e herramienta interactiva en https://www.undp.org/es/costa-rica/atlas-de-desarrollo-humano-cantonal ; para la base completa, solicitar a la Escuela de Estadística (UCR) o a Sinirube.
- **IPS cantonal:** CLACDS–INCAE y Social Progress Imperative (verificar el sitio oficial).

Preparar un CSV con una fila por zona (ver [`plantillas/validacion-externa.csv`](plantillas/validacion-externa.csv)): `zona;ids;mideplan_ids;idhc;ips`.
Los nombres deben coincidir entre fuentes; la web ignora tildes y mayúsculas. Si la columna `ids` no se incluye, la web la toma de
las evaluaciones completas guardadas, cruzando por distrito, cantón o nombre.

**Cuidado con los cambios de territorio:** el IPS 2019 cubre 81 cantones y hoy hay 84; el IDS 2023 tiene 490 distritos (siete más que 2017). Excluir lo que no coincida y documentarlo.

## 4. Qué se calcula (y qué responde cada medida)

| Pregunta | Medida | Lectura orientativa |
|---|---|---|
| ¿Las zonas se ordenan igual? | **Spearman ρ** (+ IC 95 %, bootstrap, p por permutación) y **Kendall τ-b** | ρ ≥ 0,5 «fuerte»; ≥ 0,7 «muy fuerte» (convención). Depende del orden, no de la escala |
| ¿Concuerdan en valor? | **CCC de Lin**, **Bland–Altman**, error medio y RMSE | Requiere llevar ambos a la misma escala 0–100 (percentil o mín–máx). Con percentil, el sesgo es 0 por construcción; mirar los límites de acuerdo |
| ¿Quedan en la misma categoría? | **κ ponderado** y % mismo quintil / ±1 quintil | κ ≥ 0,6 «sustancial». MIDEPLAN clasifica en quintiles |
| ¿Cumple el criterio de la tesis? | **Rango de cercanía**: % de zonas con |diferencia| < 10 puntos (0–100); aceptable ≥ 80 % | Ver el supuesto de abajo |
| ¿Distingue zonas muy distintas? | **Grupos conocidos**: IDS de las zonas del quintil externo 5 frente al 1 (Mann–Whitney) | p pequeño y P(IDS mayor en el grupo alto) cercana a 100 % |
| ¿Cada dimensión se relaciona con lo que debería? | **Validez convergente por dimensión** (Spearman) | Esperable: social con IDS-MIDEPLAN/IPS, ambiental con IPS |
| ¿Es fiable entre personas? | **ICC(2,1)**, **ICC(2,k)**, κ de Fleiss y α de Cronbach entre evaluadores | ICC ≥ 0,75 «buena»; α ≥ 0,7 «aceptable» |
| ¿Son coherentes los indicadores? | **α de Cronbach** de los 41 indicadores, 2 mitades (Spearman–Brown), correlación ítem-total | α alto sugiere un constructo único, pero un índice formativo puede tener α bajo sin ser un problema |

### Supuesto sobre el «rango de cercanía»
La presentación de la tesis define: «RC: −10 < Z < +10 y 80 %». Se interpretó como **Z = diferencia entre el IDS y el índice externo en
escala 0–100** y se exige que el 80 % de las zonas queden dentro de ±10 puntos. **Debe confirmarla la autora**: si Z se definió
de otro modo (p. ej. diferencia de posiciones en el ranking), cambia el cálculo. La tolerancia (10) es configurable.

## 4b. Qué esperar de la comparación con MIDEPLAN (validez convergente y discriminante)

El IDS de MIDEPLAN tiene **5 dimensiones sociales y económicas** (económica 28,1 %, salud 25,5 %, educación 24,0 %, participación electoral 15,9 %, seguridad 6,5 %) y **no mide ambiente**. Por eso la pantalla muestra, además de la comparación global, una **matriz dimensión × dimensión**:

| Dimensión de la escala | Debería correlacionar con (convergente) | Debería correlacionar poco (discriminante) |
|---|---|---|
| Social | salud, educación, seguridad | — |
| Económica | económica | participación electoral |
| Política | participación electoral | salud, educación |
| Ambiental | — | todas (MIDEPLAN no mide ambiente) |

Si la dimensión ambiental correlacionara fuerte con todo, sugeriría que el instrumento mide sobre todo «nivel de desarrollo general» (efecto halo) y no sostenibilidad ambiental.

**Cruce por código.** Al crear la evaluación elegí provincia → cantón → distrito (lista oficial, 490 distritos). El cruce usa el código oficial; no los nombres, que se repiten («San Juan» existe en varios cantones). Evaluaciones de un distrito se comparan con el IDS distrital; las de un cantón completo, con el IDS cantonal. No se promedian distritos para obtener un cantón.

## 5. Plan de análisis previo (propuesta; fijarlo antes de ver los datos)

- **H1.** ρ de Spearman ≥ 0,5 entre el IDS y cada índice externo (IC 95 % que excluya 0,3).
- **H2.** κ ponderado (cuadrático) en quintiles ≥ 0,4 y ≥ 85 % de las zonas a ±1 quintil.
- **H3.** ICC(2,k) entre evaluadores ≥ 0,75 y α de Cronbach ≥ 0,7.
- **H4.** En el contraste de grupos conocidos, el IDS del quintil 5 es mayor que el del quintil 1 (p < 0,05).
- **H5 (convergente/discriminante).** ρ ≥ 0,4 entre la dimensión social de la escala y salud, educación y seguridad de MIDEPLAN; ρ ≥ 0,4 entre económica y económica; ρ < 0,3 entre ambiental y cada dimensión de MIDEPLAN.
- Analizar cada índice por separado; **corregir por comparaciones múltiples** (Holm) al declarar «significativo» en varios.
- Reportar siempre n, intervalos y los resultados no favorables. Si H1 se cumple solo con un índice, decirlo.

## 6. Cómo ejecutarlo

Web: **Validación** → cargar el CSV → *Calcular validación* → *Descargar informe*. Línea de comandos:

```bash
node tools/validate.js datos.csv --scale=percentile --tol=10 --out=informe.md
```

Todos los números son reproducibles (semilla fija para bootstrap y permutaciones).

## 7. Qué no demuestra
Una buena correlación indica **validez convergente**, no que el instrumento mida «sostenibilidad». Los índices de referencia tienen sus
propias limitaciones (p. ej., la crítica de la UCR al bienestar material del IDHc) y miden otras cosas. Un resultado débil con el IDH
cantonal puede ser incluso esperable: la tesis misma señala que desarrollo humano y sostenible no coinciden.
