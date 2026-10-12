# Otros índices de desarrollo: qué hay hoy y qué implica para este proyecto

Revisión hecha el 12 de octubre de 2026. La Escala de Standley es de 2020; esto resume lo que existe a
escala cantonal, municipal y local, y qué se aprendió de ello. **Lo que no pude abrir o verificar en la fuente
original está marcado como «sin verificar»**: antes de citarlo en el artículo, consulta el documento oficial.

## 1. Índices cantonales y distritales de Costa Rica

| Índice | Quién | Escala | Qué mide | Notas verificadas |
|---|---|---|---|---|
| **Atlas de Desarrollo Humano Cantonal** (IDHc y familia) | PNUD Costa Rica, con ICD y Sinirube | 84 cantones | IDH (conocimiento, esperanza de vida, bienestar material) adaptado a registros administrativos; IDH ajustado por desigualdad; índices de género; pobreza multidimensional; seguridad ciudadana | La edición **2026** (presentada a fines de julio de 2026) añade un **Índice de Vulnerabilidad a las Drogas y Actividades Conexas**. Fuentes: INEC, Aresep, ICE, CCSS, TSE, Sinirube, ICD, Seguridad Pública, OIJ y CGR. Plataforma interactiva con tendencias históricas. |
| **Índice de Progreso Social cantonal** | INCAE-CLACDS (socio local de Social Progress Imperative) | cantones | Tres dimensiones: necesidades humanas básicas, fundamentos del bienestar y oportunidades | **Solo** indicadores sociales y ambientales (no usa variables económicas), mide resultados y no esfuerzos, con indicadores accionables por política pública. Ediciones cantonales 2016 y 2019. Número exacto de componentes: sin verificar (fuentes discrepan: 12 vs 15). |
| **Índice de Desarrollo Social (IDS)** | MIDEPLAN | 490 distritos, 84 cantones, regiones | Desarrollo social relativo; valor 0–100 y quintiles | Edición **2023** (sexta desde 1987); es el único que da datos **distritales**; **no es comparable con 2017**. **2023 (verificado en el libro de tablas):** 5 dimensiones —económica 28,1 %, salud 25,5 %, educación 24,0 %, participación electoral 15,9 %, seguridad 6,5 %—, 20 indicadores y 14 subíndices, estandarizados de 0 a 100; la edición de 2017 ya tenía las mismas dimensiones. Ojo: comparte siglas con el IDS de esta tesis. |
| **Índice de Competitividad Cantonal** | UCR (Escuela de Economía, Observatorio del Desarrollo) | cantones | 7 pilares: economía, emprendimiento, mercado laboral, infraestructura, innovación, gobierno y calidad de vida; escala 0–1 | En la edición 2022-2023 solo 10 cantones tienen competitividad alta. Variables y pesos: sin verificar. |
| **Índice de Gestión de Servicios Municipales (IGSM)** | Contraloría General de la República | gobiernos locales | Madurez de los servicios que prestan las municipalidades (inicial, básico, intermedio, avanzado) | Edición 2025: ninguna municipalidad alcanzó el nivel avanzado. Sustituyó al antiguo Índice de Gestión Municipal (61 indicadores, 5 ejes). |

**Crítica relevante.** El Observatorio del Desarrollo de la UCR cuestionó que el IDHc mida el bienestar material con el
consumo eléctrico residencial; al recalcular con otra variable económica, la proporción de cantones con nota
insuficiente pasó de 25 % a 69 %. Es un ejemplo de cuánto pesa una decisión metodológica sobre el resultado.

**Posible identificación de las siglas de la tesis.** En el PowerPoint se compara con «IPS», «IDHC» e «IDSD». Por lo anterior,
IPS sería el Índice de Progreso Social, IDHC el desarrollo humano cantonal, e IDSD podría ser el IDS distrital de MIDEPLAN.
**Esto es una hipótesis**: debe confirmarlo la autora.

## 2. Índices y marcos internacionales de escala local

| Marco | Qué aporta | Notas |
|---|---|---|
| **IDSC-BR** (Brasil, Instituto Cidades Sustentáveis + SDSN) | Índice de ODS para los 5 570 municipios; unos 100 indicadores; puntaje 0–100 global y **por ODS** | Casi todos los datos son estadísticas oficiales (según una presentación del propio programa). Es el antecedente más cercano a un «IDS local» alineado con ODS. Detalles de normalización: sin verificar (el PDF no se pudo leer). |
| **City Prosperity Initiative / Urban Monitoring Framework** (ONU-Hábitat) | CPI con 6 dimensiones: productividad, infraestructura, calidad de vida, equidad e inclusión social, sostenibilidad ambiental, gobernanza y legislación | El UMF fue respaldado por la Comisión de Estadística de la ONU en marzo de 2022 y armoniza índices existentes. |
| **Voluntary Local Reviews (VLR)** | Informes locales voluntarios sobre los ODS | En Costa Rica: Atenas, Belén, Escazú, Goicoechea, Sarchí y Puriscal presentaron los suyos. Dificultad conocida: los ODS se diseñaron para gobiernos nacionales. |
| **Red de Cantones Promotores de los ODS** | MIDEPLAN + IFAM + ONU; 48 de 84 cantones (mayo de 2024) | Una presentación de CEPAL señalaba como paso pendiente un **sistema estandarizado de indicadores cantonales vinculado a los ODS**. Es justo el hueco donde podría encajar esta escala. |
| **Sustainable Development Report / SDG Index** (SDSN) | Índice 0–100 por país con los 17 ODS | Un preprint de 2025 critica que promediar los 17 ODS permite que el desarrollo compense la degradación ambiental (sin verificar si fue revisado por pares). |

## 3. Metodología: qué piden las guías

La guía **OECD/JRC *Handbook on Constructing Composite Indicators*** (2008) recomienda: marco teórico, selección de
indicadores, datos faltantes, análisis multivariado, normalización, ponderación y agregación, **análisis de incertidumbre y
sensibilidad**, y revisión de los datos. Problemas de fondo para índices como este:

- **Compensabilidad.** El promedio ponderado deja que una dimensión excelente tape una pésima. Se discuten alternativas
  (media geométrica, que depende de la escala, o enfoques de «eslabón más débil»).
- **Pesos.** Deberían ser razones de sustitución, pero se usan como coeficientes de importancia; conviene probar cuánto
  cambia el resultado al variarlos.
- **Fiabilidad y validez.** Acuerdo entre evaluadores, consistencia interna y contraste con medidas independientes.

## 4. Qué se hizo con esto en la versión 1.1

| Hallazgo | Respuesta en el proyecto |
|---|---|
| Sin análisis de sensibilidad | `js/sensitivity.js`: Monte Carlo sobre los pesos (±20 %, 1 000 simulaciones, semilla fija) → intervalo del IDS y estabilidad de la categoría |
| Compensabilidad total | `balance()` en `js/engine.js`: dimensión más débil, IDS equilibrado (media entre el IDS y la dimensión más débil) y alerta de dimensiones < 40 % |
| Subjetividad / fiabilidad sin medir | `js/stats.js` + pantalla «Comparar evaluaciones»: κ de Fleiss, acuerdo por afirmación, consenso por mayoría, afirmaciones ambiguas; también α de Cronbach y Spearman para validación |
| Sin alineación con ODS | `data/sdg-map.json`: **mapeo propuesto** de los 41 indicadores a ODS y vista «Contribución por ODS» (cubre 16 de 17; no cubre ODS 14) |
| Sin contexto geográfico | Provincia y cantón (84 cantones, `data/cr-cantones.json`), rol de quien responde, fecha e instrumento versionado en cada evaluación, para poder contrastar luego con IDHc, IPSc e IDS-MIDEPLAN |

Lo que **no** se resolvió porque requiere decisiones científicas de la autora está en
[`AUDITORIA-CONTENIDO.md`](AUDITORIA-CONTENIDO.md) y [`HOJA-DE-RUTA.md`](HOJA-DE-RUTA.md).

## Fuentes consultadas

- PNUD Costa Rica, *Atlas de desarrollo humano cantonal*: https://www.undp.org/es/costa-rica/atlas-de-desarrollo-humano-cantonal (no se pudo abrir directamente; datos tomados de la cobertura de prensa)
- Delfino.cr, «Atlas de Desarrollo Humano Cantonal 2026 incluye nuevo índice de vulnerabilidad a las drogas» (jul. 2026): https://delfino.cr/2026/07/atlas-de-desarrollo-humano-cantonal-2026-incluye-nuevo-indice-de-vulnerabilidad-a-las-drogas-y-actividades-conexas
- Semanario Universidad, crítica de la UCR al bienestar material del IDHc: https://semanariouniversidad.com/?p=287460
- ICT, IPS 2024 (explicación de los principios del IPS): https://www.ict.go.cr/en/documents/estadísticas/cifras-turísticas/ips/2803-ips-2024/file.html
- MIDEPLAN, Índice de Desarrollo Social 2023: https://www.mideplan.go.cr/indice-desarrollo-social
- Delfino.cr, IDS 2023 (no comparable con 2017): https://delfino.cr/2024/05/mideplan-insta-a-gobiernos-locales-a-utilizar-activamente-el-indice-de-desarrollo-social-2023
- Delfino.cr, ICC-UCR 2022-2023: https://delfino.cr/2025/04/icc-ucr-solo-10-cantones-tienen-un-indice-de-competitividad-alto
- Delfino.cr, IGSM 2025 (CGR): https://delfino.cr/2025/08/contraloria-ni-un-solo-gobierno-local-alcanzo-un-nivel-avanzado-en-gestion-de-servicios-municipales
- Instituto Cidades Sustentáveis, metodología IDSC-BR: https://www.cidadessustentaveis.org.br/arquivos/idsc-br/Metodologia.pdf
- ONU-Hábitat, SDG 11 Monitoring Framework / CPI: https://unhabitat.org/sites/default/files/download-manager-files/SDG%20Goal%2011%20Monitoring%20Framework.pdf
- SDG Cities, Red de Cantones Promotores de los ODS: https://www.sdg-cities.org/stories/articles/localising-the-sdgs-in-costa-rica-with-red-de-cantones-promotores-de-los-ods
- OECD/JRC, *Handbook on Constructing Composite Indicators* (2008): https://knowledge4policy.ec.europa.eu/sites/default/files/jrc47008_handbook_final.pdf
- Revisión comparativa de métodos de agregación (preprint, 2026, sin verificar revisión por pares): https://arxiv.org/pdf/2607.08153
