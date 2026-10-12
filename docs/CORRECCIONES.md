# Correcciones respecto a la tesis (2020) y la app Android

Al portar la app Android (Kotlin) y la plantilla Excel a la web se auditaron las
fórmulas, los pesos y los textos. Esto es lo que se encontró.
**Los pesos de esta versión web salen del Excel `reference/escala-ids-1.0.xlsx`**,
y se verificaron uno a uno contra el código Kotlin (`reference/*Values.kt`).

## Corregido en la versión web

| # | Dónde estaba | Problema | Corrección |
|---|---|---|---|
| 1 | Excel, celda `HO17` | La fórmula del índice ambiental usa `BO16*B18` en vez de `BO16*BO18`. `B18` está vacía, por lo que el indicador «Estado de ríos» (peso 5 %) no aportaba nada al índice ambiental. La app Android sí usaba el peso correcto, así que Excel y app daban resultados distintos. | Se usa el peso correcto (0,05). Hay una prueba automática que lo verifica (`tests/engine.test.js`). |
| 2 | App Android, `PoliticsValues.getLisPol1` | La dimensión política tiene 7 afirmaciones y 7 pesos, pero la app solo mostraba 6: faltaba «Existencia de diálogo entre políticos y el pueblo» (peso 10 %). | Se muestran las 7. |
| 3 | App Android, `SocialValues.values6` y `values7` | Tres afirmaciones negativas de la dimensión social tenían peso `0` en la app y peso negativo en el Excel: «Existencia de grupos que ensucian la fama de la zona» (−0,1), «Homicidios frecuentes» (−0,1) en *Bienestar del pueblo*, y «Presencia de indigentes en las calles» (−0,05) en *Protección a la gente*. Contradice la guía de usuario («los factores negativos tienen pesos negativos»). | Se usan los pesos del Excel. |
| 4 | Escala | Con pesos negativos, la escala original no va de 0 a 1 (puede ser negativa y su máximo es < 1). | Se añade una **escala normalizada 0–1** (reescalado lineal al rango alcanzable en cada nivel). La escala original se sigue mostrando para poder comparar con la tesis. |

## Pendiente de decisión de la autora

**«Inflación» (dimensión económica) tiene peso −0,05.** Sus tres afirmaciones ya llevan
signo propio («Aumento constante» −0,1, «Acciones para pararla» +0,7, «Afecta la calidad
de vida» −0,2), de modo que un buen manejo de la inflación *resta* puntos al índice
económico (doble negativo). Además, los pesos de la dimensión económica suman 0,90 y
con +0,05 sumarían exactamente 1,00. Es probable que sea un error de signo, pero se
conserva **tal como está en la tesis** (`data/indicators.json`, indicador `eco05`) para no
alterar el modelo que se validó. Cambiarlo es una línea; hay una prueba
(`tests/data.test.js`) que documenta el valor actual y habría que actualizarla.

Otras dudas de contenido (Clima, Minería, especies exóticas, etc.) están en [AUDITORIA-CONTENIDO.md](AUDITORIA-CONTENIDO.md).

## Observaciones menores (no cambian el cálculo)

- La política tiene un solo indicador con peso interno 1,0; su peso en el IDS es 0,1.
- Erratas en los textos originales de la app y el Excel («Servicos», «alfatadas»,
  «Organuismos», «delagación», «cazamiento»…). Los textos de `data/` provienen de los
  `strings.xml` de la app y se les aplicó una lista explícita de correcciones
  (`TYPOS_ES` en `tools/build_data.py`); los originales siguen intactos en `reference/`.
- La guía original menciona «Universidad EATH» (errata de EARTH).
