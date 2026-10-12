---
title: "Escala de Standley: una calculadora de código abierto del Índice de Desarrollo Sostenible para zonas locales"
author: "Standley Moïse"
affiliation: "Universidad EARTH, Guácimo, Limón, Costa Rica"
advisor: "MSc. Victor Hugo Morales Peña"
status: "Borrador / preprint — no sometido a revisión por pares"
license: "CC BY 4.0"
---

# Escala de Standley: una calculadora de código abierto del Índice de Desarrollo Sostenible para zonas locales

**Standley Moïse**¹ · asesor: MSc. Victor Hugo Morales Peña¹
¹ Universidad EARTH, Guácimo, Limón, Costa Rica

*Borrador (preprint). Código y datos: <https://github.com/standleymoise/ids-sostenible> · Aplicación: <https://standleymoise.github.io/ids-sostenible/>*

## Resumen

Los índices de desarrollo sostenible suelen calcularse a escala de país, lo que oculta las diferencias entre territorios dentro de un mismo país. Este trabajo presenta la *Escala de Standley*, un método para estimar el Índice de Desarrollo Sostenible (IDS) de **zonas locales** mediante 41 indicadores y 180 afirmaciones de respuesta Sí/No, agrupados en cuatro dimensiones (ambiental, social, económica y política) y combinados con promedios ponderados. El método se desarrolló en una plantilla de Excel, se implementó como aplicación Android (Kotlin, 2020) y se reimplementa aquí como aplicación web progresiva (PWA) de código abierto que funciona sin conexión y sin servidor. Al portar el modelo se auditaron fórmulas y pesos y se corrigieron cuatro inconsistencias entre el Excel y la app. Se añade una escala normalizada 0–1, necesaria porque los pesos negativos impiden que el índice original alcance 1. La validación reportada en la tesis comparó el IDS con tres índices existentes (concordancia del 100 %, 90 % y 65 % según un criterio de «rango de cercanía») y arrojó un alfa de Cronbach de 0,87 con 10 ciudades evaluadas por 10 personas. La versión web añade análisis de sensibilidad de los pesos, una lectura de equilibrio entre dimensiones, medidas de acuerdo entre evaluadores y una propuesta de alineación con los ODS. Las limitaciones incluyen una muestra pequeña, la subjetividad de las respuestas y la ausencia de una validación externa independiente.

**Palabras clave:** índice de desarrollo sostenible; indicadores locales; promedio ponderado; aplicación web progresiva; ciencia abierta; Costa Rica.

## Abstract

Sustainable development indices are usually computed at country level, which hides differences between territories within a country. We present the *Standley Scale*, a method that estimates a Sustainable Development Index (IDS) for **local areas** from 41 indicators and 180 yes/no statements grouped into four dimensions (environmental, social, economic, political) and combined through weighted averages. The method was built as an Excel template, implemented as an Android app (Kotlin, 2020), and is re-implemented here as an open-source offline-capable progressive web app (PWA) with no server. Porting the model involved auditing formulas and weights and fixing four inconsistencies between the spreadsheet and the app. A normalized 0–1 scale is added, since negative weights prevent the original index from reaching 1. The validation reported in the thesis compared the IDS against three existing indices (100%, 90% and 65% agreement under a "closeness range" criterion) and yielded a Cronbach's alpha of 0.87 for 10 cities assessed by 10 people. The web version adds weight-sensitivity analysis, a dimension-balance reading, inter-rater agreement measures and a proposed SDG alignment. Limitations include a small sample, subjectivity of the answers and the lack of independent external validation.

**Keywords:** sustainable development index; local indicators; weighted average; progressive web app; open science; Costa Rica.

## 1. Introducción

El desarrollo sostenible se define como el proceso capaz de satisfacer las necesidades de las generaciones presentes sin comprometer la capacidad de las futuras para satisfacer las suyas (Naciones Unidas, 1987). Su medición suele organizarse en dimensiones económica, social, ambiental y político-institucional (Sepúlveda et al., 2001), y se ha concretado en marcos como el modelo presión-estado-respuesta de la OCDE y los Objetivos de Desarrollo Sostenible (ONU, 2015).

Los índices disponibles se calculan casi siempre para países. Estas cifras agregadas no reflejan la situación de comunidades concretas: un país con índice alto puede tener zonas muy rezagadas. Además, el desarrollo humano y el sostenible no coinciden: países de alto desarrollo humano pueden figurar entre los de peor desempeño ecológico (Hickel, 2020; Sachs et al., 2019). Sepúlveda (2008) propuso el *Biograma*, una metodología en hoja de cálculo para territorios; sin embargo, algunos de sus indicadores no capturan con precisión las dimensiones que pretenden representar.

**Estado actual a escala local en Costa Rica.** Desde 2020 el panorama cantonal se ha ampliado. El *Atlas de Desarrollo Humano Cantonal* del PNUD, que adapta el IDH a registros administrativos de los 84 cantones, publicó en 2026 una edición que añade un índice de vulnerabilidad a las drogas a su familia de índices (desarrollo humano, desigualdad, género, pobreza multidimensional y seguridad ciudadana) (PNUD Costa Rica, 2026). El Índice de Progreso Social cantonal, de INCAE-CLACDS, usa solo indicadores sociales y ambientales y mide resultados y no esfuerzos (INCAE-CLACDS, s. f.). El Índice de Desarrollo Social de MIDEPLAN llegó en 2023 a 490 distritos y es el único con detalle distrital; combina 20 indicadores de cinco dimensiones —económica (28,1 %), salud (25,5 %), educación (24,0 %), participación electoral (15,9 %) y seguridad (6,5 %)— estandarizados de 0 a 100, y no es comparable con la edición de 2017 (MIDEPLAN, 2024). La Contraloría General de la República evalúa desde 2021 la madurez de los servicios municipales (IGSM). A nivel internacional, el IDSC-BR califica con ODS a los 5 570 municipios de Brasil (Instituto Cidades Sustentáveis, s. f.), y el Marco de Monitoreo Urbano de ONU-Hábitat armoniza indicadores locales (UN-Habitat, 2022). En Costa Rica, la Red de Cantones Promotores de los ODS (MIDEPLAN, IFAM y la ONU) reunía a 48 de los 84 cantones en 2024, y se ha señalado la falta de un sistema estandarizado de indicadores cantonales vinculado a los ODS. Estos índices se construyen, en su mayoría, con **estadística oficial** agregada por cantón o distrito, lo que difícilmente refleja la situación de una comunidad pequeña; la Escala de Standley ocupa un nicho complementario: **autodiagnóstico participativo** de zonas pequeñas, sin depender de estadística oficial desagregada.

Siguiendo los criterios de que los indicadores sean medibles, con datos disponibles, claros, de costo razonable y aceptados en su entorno (OCDE, 1993), y que sean relevantes, exactos, comprensibles y comparables (Bermejo, 2001), este trabajo propone una escala con indicadores **puntuales, de respuesta Sí/No** y utilizables por una persona conocedora de la zona sin necesidad de mediciones costosas. El objetivo es ofrecer una herramienta gratuita, abierta y reproducible que calcule el IDS de una zona local.

## 2. Método

### 2.1 Estructura del instrumento

El instrumento se compone de **41 indicadores** y **180 afirmaciones** de respuesta binaria (Sí = 1, No = 0) distribuidas en cuatro dimensiones:

| Dimensión | Peso en el IDS | Indicadores | Afirmaciones |
|---|---|---|---|
| Ambiental | 0,40 | 18 | 68 |
| Social | 0,30 | 9 | 51 |
| Económica | 0,20 | 13 | 54 |
| Política | 0,10 | 1 (v1.0) / 6 (v1.1) | 7 (v1.0) / 30 (v1.1) |

Las dimensiones se eligieron siguiendo la literatura (§1). Cada afirmación recibe un peso; las que describen un factor negativo (por ejemplo, «Homicidios frecuentes») tienen peso negativo y restan al resultado cuando la respuesta es Sí. El instrumento completo, con sus pesos, está en `data/indicators.json` del repositorio.

### 2.2 Cálculo

Con $a_{ij}\in\{0,1\}$ la respuesta a la afirmación $j$ del indicador $i$, y $w$ los pesos:

$$I_i=\sum_j w_{ij}\,a_{ij},\qquad D_d=\sum_{i\in d} w_i\,I_i,\qquad \mathrm{IDS}=0{,}4\,D_{amb}+0{,}3\,D_{soc}+0{,}2\,D_{eco}+0{,}1\,D_{pol}.$$

Es el promedio ponderado implementado en la plantilla de Excel con `SUMAPRODUCTO` (Moïse, 2020). El IDS solo se calcula cuando se responden todas las afirmaciones.

### 2.3 Escala normalizada

Como existen pesos negativos y algunos conjuntos de pesos no suman 1, el índice original puede ser negativo y su máximo alcanzable es menor que 1. Se añade una escala normalizada mediante reescalado lineal al rango realmente alcanzable en cada nivel (indicador, dimensión, global), calculado por aritmética de intervalos:

$$\widehat{X}=\frac{X-X_{\min}}{X_{\max}-X_{\min}}\in[0,1].$$

0 corresponde al peor caso posible y 1 al mejor. Ambas escalas se muestran en la aplicación. Los rangos cualitativos de la app original (0–0,2 «Colapso», 0,2–0,4 «Deficiente», 0,4–0,6 «Regular», 0,6–0,8 «Bueno», 0,8–1 «Excelente») se aplican ahora sobre la escala normalizada.

### 2.4 Implementación

El método pasó por tres implementaciones: (i) plantilla de Excel (2020), base del cálculo; (ii) aplicación Android en Kotlin, publicada en Google Play; y (iii) la aplicación web progresiva presentada aquí: HTML, CSS y JavaScript sin dependencias, con un motor de cálculo independiente de la interfaz (`js/engine.js`), almacenamiento local en el dispositivo (sin servidor ni cuentas), interfaz en español e inglés, exportación a JSON/CSV e impresión a PDF. El código se verifica con 14 pruebas automáticas que reproducen el cálculo del Excel.

### 2.5 Auditoría al portar el modelo

Al reimplementar el modelo se compararon uno a uno los pesos del Excel y del código Kotlin, y las fórmulas del Excel. Se encontraron y corrigieron cuatro inconsistencias (detalle en `docs/CORRECCIONES.md`):

1. **Fórmula del Excel:** el índice ambiental usaba `BO16*B18` en lugar de `BO16*BO18`, por lo que el indicador «Estado de ríos» (5 %) no contribuía.
2. **App Android:** la dimensión política mostraba 6 de sus 7 afirmaciones (faltaba el diálogo entre políticos y ciudadanía, 10 %).
3. **App Android:** tres afirmaciones negativas de la dimensión social tenían peso 0 en la app y peso negativo en el Excel.
4. **Escala:** se añade la escala normalizada (§2.3).

Queda una cuestión abierta: el indicador «Inflación» tiene peso −0,05 en la dimensión económica pese a que sus afirmaciones ya llevan signo propio, lo que hace que un buen manejo de la inflación reduzca el índice; con +0,05 los pesos económicos sumarían exactamente 1. Se conservó el valor original para no alterar el modelo validado.

### 2.6 Extensiones de la implementación web (software v1.1; no forman parte de la tesis)

Siguiendo la guía de la OCDE y el JRC para índices compuestos (Nardo et al., 2008), la implementación web añade herramientas de rigor y de fiabilidad, **sin modificar el modelo de la tesis**:

- **Análisis de sensibilidad.** Los pesos fueron asignados por la autora; para medir su influencia, el cálculo se repite 1 000 veces variando cada peso al azar hasta ±20 % (los pesos de las dimensiones se renormalizan) y se reporta el rango del 90 % central de los resultados y la proporción de simulaciones que conservan la categoría cualitativa.
- **Equilibrio entre dimensiones.** El promedio ponderado es plenamente compensatorio. Se reportan la dimensión más débil y un IDS equilibrado, definido como la media entre el IDS normalizado y la dimensión más débil (enfoque de co-limitación), además de una alerta si alguna dimensión queda por debajo de 0,4.
- **Acuerdo entre evaluadores.** Para n ≥ 2 evaluaciones de una misma zona se calculan el porcentaje de acuerdo por afirmación, el κ de Fleiss (Fleiss, 1971; interpretación según Landis y Koch, 1977) y el IDS por consenso de mayoría. Las afirmaciones con menor acuerdo señalan ítems ambiguos que deben reformularse.
- **Alineación con los ODS.** Cada indicador se vinculó a los ODS más afines; esta tabla es una **propuesta aún no validada** y cubre 16 de los 17 ODS (no el 14).
- **Metadatos.** Cada evaluación registra provincia, cantón, fecha, rol de quien responde y versión del instrumento, para poder contrastar con otros índices cantonales y repetir mediciones en el tiempo.

El código incluye además el α de Cronbach y la correlación de Spearman, previstos para la validación externa contra índices cantonales.

### 2.7 Ampliación de la dimensión política (instrumento 1.1)

La tesis dedicó a la dimensión política un solo indicador de 7 afirmaciones (10 % del IDS). A escala local, la gobernanza es justamente lo que una comunidad puede observar y mejorar, y es central en el ODS 16 (instituciones eficaces, transparentes, participativas y que rinden cuentas), en los ejes del Índice de Gestión Municipal y del IGSM de la Contraloría General de la República y en la dimensión de gobernanza del *City Prosperity Index*. El instrumento 1.1 conserva el indicador original y añade cinco: participación ciudadana, transparencia y rendición de cuentas, planificación y ordenamiento territorial (incluida la gestión del riesgo), capacidad de gestión local, y justicia y no discriminación, con 23 afirmaciones nuevas (30 en total en la dimensión; 203 en el instrumento). Se redactaron con cuatro criterios: afirmaciones verificables en documentos o instituciones, restringidas a la escala local, sin solapes con otras dimensiones y aplicables a cualquier zona; y se mantuvo el formato de la tesis (pesos positivos que suman 1 por indicador y a lo más una afirmación negativa moderada). Las otras tres dimensiones y el peso de la dimensión política no cambian, y la versión 1.0 se conserva para reproducir la tesis. Los pesos son provisionales y la propuesta requiere validación de contenido por expertos (§3.3).

### 2.8 Coherencia de las respuestas (software v1.2)

Un instrumento de afirmaciones Sí/No es vulnerable a respuestas contradictorias (por ejemplo, declarar a la vez un clima tropical húmedo y uno seco). La aplicación incorpora reglas de coherencia en `data/constraints.json`, de cuatro tipos: *exclusión* (a lo más una afirmación del grupo puede ser «Sí»), *exactamente una* (el clima), *dependencia* (p. ej. «mantenimiento de espacios verdes» exige que existan espacios verdes) e *igualdad* (una afirmación que aparece en dos indicadores —«Homicidios frecuentes»— se responde una sola vez). Las reglas lógicamente inevitables **bloquean** la respuesta; las probables pero no imposibles (p. ej. ríos limpios y contaminados a la vez) piden confirmación y dejan una advertencia en el informe. Estas reglas son una propuesta no validada por la autora.

## 3. Validación reportada

La validación se realizó durante la tesis (Moïse, 2020) y se resume aquí tal como se presentó; **los datos crudos no se incluyen en este repositorio** [CONFIRMAR si pueden publicarse, anonimizados].

**Comparación con otros índices.** El IDS se comparó con el Índice de Progreso Social (IPS), el Índice de Desarrollo Humano Cantonal (IDHC) [CONFIRMAR ediciones usadas] y el Índice de Desarrollo Social Distrital (IDSD) de MIDEPLAN. Se definió un *rango de cercanía* (RC): dos resultados se consideran equivalentes si su diferencia está en el intervalo −10 < Z < +10, y la validación se consideró aceptable cuando al menos el 80 % de las comparaciones cumplía el criterio. Resultados reportados: IDS vs. IDHC, 90 %; IDS vs. IPS, 100 %; IDS vs. IDSD, 65 %. Los dos primeros superan el umbral de 80 %; **el tercero no**.

**Confiabilidad.** Se calculó el alfa de Cronbach (Cronbach, 1951), que mide la consistencia interna: cuanto más cercano a 1, más confiable el instrumento. Con 10 ciudades evaluadas por 10 personas se obtuvo α = 0,87 [CONFIRMAR cómo se construyó la matriz: personas como ítems y ciudades como observaciones, o viceversa].

### 3.3 Protocolo de validación del estudio de seguimiento (propuesto)

La validación de la tesis es limitada (§5). Para el estudio de seguimiento se fija un plan de análisis previo, implementado y probado en el repositorio (`docs/VALIDACION.md`, `js/validation.js`; las funciones estadísticas se verificaron contra scipy):

- **Validez convergente:** correlación de Spearman, con IC al 95 % (Fisher con error de Bonett y Wright y bootstrap) y prueba de permutación, entre el IDS de cada zona (distrito o cantón) y el IDSD, el IDHC y el IPS; además τ-b de Kendall y, para el acuerdo en valor, el coeficiente de concordancia de Lin y los límites de Bland–Altman sobre una escala común 0–100.
- **Clasificación:** κ ponderado en quintiles (MIDEPLAN clasifica en quintiles) y proporción de zonas a ±1 quintil.
- **Rango de cercanía** de la tesis (diferencia < 10 puntos en ≥ 80 % de las zonas), con la interpretación explícita del estadístico Z [CONFIRMAR definición original].
- **Grupos conocidos:** el IDS de las zonas del quintil externo más alto debe superar al del más bajo (Mann–Whitney).
- **Fiabilidad:** ICC(2,1) e ICC(2,k) (Shrout y Fleiss, 1979) y κ de Fleiss entre evaluadores independientes; α de Cronbach y análisis de ítems de los 41 indicadores.
- **Tamaño de muestra:** unas 29 zonas permiten detectar ρ = 0,5 con 80 % de potencia (α = 0,05); se recomienda cubrir todo el rango del índice externo.
- **Ediciones de MIDEPLAN:** el contraste principal se hace con el IDS 2017 —la edición que usó la tesis (482 distritos, 82 cantones, cinco dimensiones)— y la sensibilidad con la edición 2023, que no es comparable con la anterior por el cambio de cobertura y de método. El estudio usa el instrumento 1.1.
- **Validez convergente y discriminante frente a MIDEPLAN:** como su IDS no mide ambiente ni política en sentido estricto, se espera que la dimensión social de la escala correlacione con salud, educación y seguridad; la económica con la económica; la política con participación electoral; y que la ambiental correlacione poco con todas (H5).
- **Validez de contenido de la dimensión política 1.1:** panel de expertos con índice de validez de contenido por afirmación, y contraste con el nivel del IGSM de la municipalidad (H6).
- **Hipótesis previas:** H1 ρ ≥ 0,5 con cada índice; H2 κ ponderado ≥ 0,4 y ≥ 85 % a ±1 quintil; H3 ICC(2,k) ≥ 0,75 y α ≥ 0,7; H4 IDS mayor en el quintil externo 5 que en el 1; H5 correlaciones dimensión a dimensión según lo anterior; H6 (solo versión 1.1) la dimensión política correlaciona con el nivel del IGSM (ρ ≥ 0,3); con corrección de Holm por comparaciones múltiples.

Una correlación alta indicaría validez convergente, no que el instrumento mida «sostenibilidad» en sentido estricto, pues los índices de contraste miden conceptos cercanos pero distintos (desarrollo humano, progreso social y desarrollo social). **Este borrador no contiene todavía resultados del estudio de seguimiento.**

## 4. Discusión

Los resultados sugieren que el IDS local es coherente con índices existentes de otra escala o enfoque (IPS e IDHC) y consistente entre evaluadores. La baja concordancia con el IDSD (65 %) muestra que el instrumento no coincide con todos los índices; las posibles causas son diferencias de escala, de definición de la unidad de análisis y la subjetividad de las respuestas, pero esto **no se contrastó** en el estudio.

Un valor de α = 0,87 con 10 evaluadores es alentador, pero mide acuerdo entre quienes respondieron, no *validez*: varias personas pueden coincidir y estar igualmente equivocadas. Una evaluación más sólida requeriría zonas con medidas objetivas independientes y mayor número de evaluadores y territorios, como ya recomendaba la tesis.

## 5. Limitaciones

- **Muestra pequeña** (10 ciudades, 10 evaluadores) y sin contraste con datos objetivos de campo.
- **Subjetividad:** las respuestas Sí/No dependen de quien conozca la zona; la tesis no documenta una guía operativa que defina cuándo cada afirmación debe responderse «Sí».
- **Pesos asignados por la autora** sin un análisis de sensibilidad ni un procedimiento formal (p. ej., panel de expertos o AHP). No se evaluó cuánto cambia el IDS al variar los pesos.
- **Dimensión política con un solo indicador** (7 afirmaciones), justificada por el peso limitado de las decisiones locales frente a acuerdos internacionales, pero que debería discutirse (atendido parcialmente en el instrumento 1.1, §2.7).
- **Inconsistencias conocidas** del modelo original (§2.5), incluida la cuestión abierta de «Inflación».
- **Validez de contenido.** Una auditoría posterior (`docs/AUDITORIA-CONTENIDO.md`) señala indicadores que describen contexto y no desempeño (p. ej. el tipo de clima), afirmaciones de sentido discutible y temas de otros índices que la escala no cubre (pobreza y desigualdad, resultados de salud y educación, riesgo climático, gobernanza municipal), además de la ausencia de definiciones operativas por afirmación.
- Las extensiones de la implementación web (§2.6–2.8) y el instrumento 1.1 **no se han probado con datos reales de campo**: el análisis de sensibilidad solo considera la incertidumbre de los pesos, no la del contenido del instrumento, y el mapeo a ODS no está validado.
- La escala normalizada es una herramienta de interpretación y **no sustituye** una calibración empírica de los rangos cualitativos.

## 6. Conclusiones

Se presenta una escala abierta para estimar el desarrollo sostenible de zonas locales con indicadores simples, y una implementación web reproducible, verificada contra la plantilla original y que corrige inconsistencias de la versión de 2020. Es una herramienta **orientativa** para diagnóstico y comparación de zonas. Los siguientes pasos son: validar con más zonas y evaluadores, publicar datos anonimizados, estudiar la sensibilidad a los pesos, redactar una guía operativa por afirmación y resolver la cuestión de «Inflación».

## Disponibilidad de código y datos

Código (MIT), datos del instrumento y pruebas: <https://github.com/standleymoise/ids-sostenible>. Artículo y documentación bajo CC BY 4.0.

## Agradecimientos

A mi asesor, MSc. Victor Hugo Morales Peña; a los profesores; a Kellogg Foundation; a mis padres y amistades.

## Referencias

> Las referencias de la tesis se reproducen tal como ahí aparecen. Verificar enlaces y fechas de consulta antes de enviar a una revista.

- Bermejo, R. G. de S. (2001). *Economía sostenible: principios, conceptos e instrumentos*. Bakeaz, Bilbao. ISBN 84-88949-41-3.
- Cendrero Uceda, A. (1997). Indicadores de desarrollo sostenible para la toma de decisiones. *Naturzale*, 12, 5–25. ISSN 1137-8603.
- Costanza, R., Daly, H. E., & Bartholomew, J. A. (1991). *Goals, agenda, and policy recommendations for ecological economics*. Columbia University Press, New York.
- Cronbach, L. J. (1951). Coefficient alpha and the internal structure of tests. *Psychometrika*, 16(3), 297–334. https://doi.org/10.1007/BF02310555
- Bland, J. M., & Altman, D. G. (1986). Statistical methods for assessing agreement between two methods of clinical measurement. *The Lancet*, 327(8476), 307–310.
- Bonett, D. G., & Wright, T. A. (2000). Sample size requirements for estimating Pearson, Kendall and Spearman correlations. *Psychometrika*, 65(1), 23–28.
- Fleiss, J. L. (1971). Measuring nominal scale agreement among many raters. *Psychological Bulletin*, 76(5), 378–382.
- Instituto Cidades Sustentáveis (s. f.). *Metodologia do IDSC-BR*. https://www.cidadessustentaveis.org.br/arquivos/idsc-br/Metodologia.pdf [CONFIRMAR edición y fecha]
- INCAE-CLACDS (s. f.). *Índice de Progreso Social cantonal de Costa Rica*. [CONFIRMAR documento oficial; la descripción se tomó de fuentes secundarias]
- Landis, J. R., & Koch, G. G. (1977). The measurement of observer agreement for categorical data. *Biometrics*, 33(1), 159–174.
- MIDEPLAN (2024). *Índice de Desarrollo Social 2023*. https://www.mideplan.go.cr/indice-desarrollo-social [CONFIRMAR documento metodológico]
- Nardo, M., Saisana, M., Saltelli, A., Tarantola, S., Hoffmann, A., & Giovannini, E. (2008). *Handbook on constructing composite indicators: methodology and user guide*. OECD Publishing / JRC. https://knowledge4policy.ec.europa.eu/sites/default/files/jrc47008_handbook_final.pdf
- PNUD Costa Rica (2026). *Atlas de Desarrollo Humano Cantonal 2026*. https://www.undp.org/es/costa-rica/atlas-de-desarrollo-humano-cantonal [CONFIRMAR documento oficial]
- UN-Habitat (2022). *Urban Monitoring Framework*. [CONFIRMAR referencia oficial]
- García Vílchez, E. J., & Sánchez Báscones, I. (2011). Medida del desarrollo sostenible mediante el uso de indicadores e índices. *Técnica Industrial*.
- Hammond, A., et al. (1995). *Environmental indicators: a systematic approach to measuring and reporting on the environment in the context of sustainable development*. World Resources Institute. ISBN 1-56973-026-1.
- Hickel, J. (2020). The Sustainable Development Index: Measuring the ecological efficiency of human development in the Anthropocene. *Ecological Economics*, 167. https://www.sciencedirect.com/science/article/pii/S0921800919303386 [CONFIRMAR DOI]
- Lin, L. I.-K. (1989). A concordance correlation coefficient to evaluate reproducibility. *Biometrics*, 45(1), 255–268.
- Moïse, S. (2020). *Diseño de una aplicación Android para calcular el Índice de Desarrollo Sostenible (IDS)*. Proyecto de Graduación, Licenciatura en Ciencias Agrícolas, Universidad EARTH, Guácimo, Costa Rica.
- Naciones Unidas (1987). *Informe de la Comisión Mundial sobre el Medio Ambiente y el Desarrollo (Informe Brundtland)*.
- Organización de las Naciones Unidas (2015). *Objetivos de Desarrollo Sostenible*. https://www.un.org/sustainabledevelopment/es/
- OCDE (1993). *Core set of indicators for environmental performance reviews*. Environment Monographs No. 83. París.
- Shrout, P. E., & Fleiss, J. L. (1979). Intraclass correlations: uses in assessing rater reliability. *Psychological Bulletin*, 86(2), 420–428.
- Sachs, J., Schmidt-Traub, G., Kroll, C., Lafortune, G., & Fuller, G. (2019). *Sustainable Development Report 2019*. Bertelsmann Stiftung y SDSN, New York.
- Sepúlveda, S. (2008). *Biograma: metodología para estimar el nivel de desarrollo sostenible de territorios*. IICA, San José, Costa Rica.
- Sepúlveda, S., et al. (2001). *Metodología para estimar el nivel de desarrollo sostenible en espacios territoriales*. IICA.
