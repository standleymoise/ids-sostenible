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

Los índices de desarrollo sostenible suelen calcularse a escala de país, lo que oculta las diferencias entre territorios dentro de un mismo país. Este trabajo presenta la *Escala de Standley*, un método para estimar el Índice de Desarrollo Sostenible (IDS) de **zonas locales** mediante 41 indicadores y 180 afirmaciones de respuesta Sí/No, agrupados en cuatro dimensiones (ambiental, social, económica y política) y combinados con promedios ponderados. El método se desarrolló en una plantilla de Excel, se implementó como aplicación Android (Kotlin, 2020) y se reimplementa aquí como aplicación web progresiva (PWA) de código abierto que funciona sin conexión y sin servidor. Al portar el modelo se auditaron fórmulas y pesos y se corrigieron cuatro inconsistencias entre el Excel y la app. Se añade una escala normalizada 0–1, necesaria porque los pesos negativos impiden que el índice original alcance 1. La validación reportada en la tesis comparó el IDS con tres índices existentes (concordancia del 100 %, 90 % y 65 % según un criterio de «rango de cercanía») y arrojó un alfa de Cronbach de 0,87 con 10 ciudades evaluadas por 10 personas. Las limitaciones incluyen una muestra pequeña, la subjetividad de las respuestas y la ausencia de una validación externa independiente.

**Palabras clave:** índice de desarrollo sostenible; indicadores locales; promedio ponderado; aplicación web progresiva; ciencia abierta; Costa Rica.

## Abstract

Sustainable development indices are usually computed at country level, which hides differences between territories within a country. We present the *Standley Scale*, a method that estimates a Sustainable Development Index (IDS) for **local areas** from 41 indicators and 180 yes/no statements grouped into four dimensions (environmental, social, economic, political) and combined through weighted averages. The method was built as an Excel template, implemented as an Android app (Kotlin, 2020), and is re-implemented here as an open-source offline-capable progressive web app (PWA) with no server. Porting the model involved auditing formulas and weights and fixing four inconsistencies between the spreadsheet and the app. A normalized 0–1 scale is added, since negative weights prevent the original index from reaching 1. The validation reported in the thesis compared the IDS against three existing indices (100%, 90% and 65% agreement under a "closeness range" criterion) and yielded a Cronbach's alpha of 0.87 for 10 cities assessed by 10 people. Limitations include a small sample, subjectivity of the answers and the lack of independent external validation.

**Keywords:** sustainable development index; local indicators; weighted average; progressive web app; open science; Costa Rica.

## 1. Introducción

El desarrollo sostenible se define como el proceso capaz de satisfacer las necesidades de las generaciones presentes sin comprometer la capacidad de las futuras para satisfacer las suyas (Naciones Unidas, 1987). Su medición suele organizarse en dimensiones económica, social, ambiental y político-institucional (Sepúlveda et al., 2001), y se ha concretado en marcos como el modelo presión-estado-respuesta de la OCDE y los Objetivos de Desarrollo Sostenible (ONU, 2015).

Los índices disponibles se calculan casi siempre para países. Estas cifras agregadas no reflejan la situación de comunidades concretas: un país con índice alto puede tener zonas muy rezagadas. Además, el desarrollo humano y el sostenible no coinciden: países de alto desarrollo humano pueden figurar entre los de peor desempeño ecológico (Hickel, 2020; Sachs et al., 2019). Sepúlveda (2008) propuso el *Biograma*, una metodología en hoja de cálculo para territorios; sin embargo, algunos de sus indicadores no capturan con precisión las dimensiones que pretenden representar.

Siguiendo los criterios de que los indicadores sean medibles, con datos disponibles, claros, de costo razonable y aceptados en su entorno (OCDE, 1993), y que sean relevantes, exactos, comprensibles y comparables (Bermejo, 2001), este trabajo propone una escala con indicadores **puntuales, de respuesta Sí/No** y utilizables por una persona conocedora de la zona sin necesidad de mediciones costosas. El objetivo es ofrecer una herramienta gratuita, abierta y reproducible que calcule el IDS de una zona local.

## 2. Método

### 2.1 Estructura del instrumento

El instrumento se compone de **41 indicadores** y **180 afirmaciones** de respuesta binaria (Sí = 1, No = 0) distribuidas en cuatro dimensiones:

| Dimensión | Peso en el IDS | Indicadores | Afirmaciones |
|---|---|---|---|
| Ambiental | 0,40 | 18 | 68 |
| Social | 0,30 | 9 | 51 |
| Económica | 0,20 | 13 | 54 |
| Política | 0,10 | 1 | 7 |

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

## 3. Validación reportada

La validación se realizó durante la tesis (Moïse, 2020) y se resume aquí tal como se presentó; **los datos crudos no se incluyen en este repositorio** [CONFIRMAR si pueden publicarse, anonimizados].

**Comparación con otros índices.** El IDS se comparó con el Índice de Progreso Social (IPS), el Índice de Desarrollo Humano Cantonal (IDHC) y el IDSD [CONFIRMAR nombre completo de cada índice]. Se definió un *rango de cercanía* (RC): dos resultados se consideran equivalentes si su diferencia está en el intervalo −10 < Z < +10, y la validación se consideró aceptable cuando al menos el 80 % de las comparaciones cumplía el criterio. Resultados reportados: IDS vs. IDHC, 90 %; IDS vs. IPS, 100 %; IDS vs. IDSD, 65 %. Los dos primeros superan el umbral de 80 %; **el tercero no**.

**Confiabilidad.** Se calculó el alfa de Cronbach (Cronbach, 1951), que mide la consistencia interna: cuanto más cercano a 1, más confiable el instrumento. Con 10 ciudades evaluadas por 10 personas se obtuvo α = 0,87 [CONFIRMAR cómo se construyó la matriz: personas como ítems y ciudades como observaciones, o viceversa].

## 4. Discusión

Los resultados sugieren que el IDS local es coherente con índices existentes de otra escala o enfoque (IPS e IDHC) y consistente entre evaluadores. La baja concordancia con el IDSD (65 %) muestra que el instrumento no coincide con todos los índices; las posibles causas son diferencias de escala, de definición de la unidad de análisis y la subjetividad de las respuestas, pero esto **no se contrastó** en el estudio.

Un valor de α = 0,87 con 10 evaluadores es alentador, pero mide acuerdo entre quienes respondieron, no *validez*: varias personas pueden coincidir y estar igualmente equivocadas. Una evaluación más sólida requeriría zonas con medidas objetivas independientes y mayor número de evaluadores y territorios, como ya recomendaba la tesis.

## 5. Limitaciones

- **Muestra pequeña** (10 ciudades, 10 evaluadores) y sin contraste con datos objetivos de campo.
- **Subjetividad:** las respuestas Sí/No dependen de quien conozca la zona; la tesis no documenta una guía operativa que defina cuándo cada afirmación debe responderse «Sí».
- **Pesos asignados por la autora** sin un análisis de sensibilidad ni un procedimiento formal (p. ej., panel de expertos o AHP). No se evaluó cuánto cambia el IDS al variar los pesos.
- **Dimensión política con un solo indicador** (7 afirmaciones), justificada por el peso limitado de las decisiones locales frente a acuerdos internacionales, pero que debería discutirse.
- **Inconsistencias conocidas** del modelo original (§2.5), incluida la cuestión abierta de «Inflación».
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
- García Vílchez, E. J., & Sánchez Báscones, I. (2011). Medida del desarrollo sostenible mediante el uso de indicadores e índices. *Técnica Industrial*.
- Hammond, A., et al. (1995). *Environmental indicators: a systematic approach to measuring and reporting on the environment in the context of sustainable development*. World Resources Institute. ISBN 1-56973-026-1.
- Hickel, J. (2020). The Sustainable Development Index: Measuring the ecological efficiency of human development in the Anthropocene. *Ecological Economics*, 167. https://www.sciencedirect.com/science/article/pii/S0921800919303386 [CONFIRMAR DOI]
- Moïse, S. (2020). *Diseño de una aplicación Android para calcular el Índice de Desarrollo Sostenible (IDS)*. Proyecto de Graduación, Licenciatura en Ciencias Agrícolas, Universidad EARTH, Guácimo, Costa Rica.
- Naciones Unidas (1987). *Informe de la Comisión Mundial sobre el Medio Ambiente y el Desarrollo (Informe Brundtland)*.
- Organización de las Naciones Unidas (2015). *Objetivos de Desarrollo Sostenible*. https://www.un.org/sustainabledevelopment/es/
- OCDE (1993). *Core set of indicators for environmental performance reviews*. Environment Monographs No. 83. París.
- Sachs, J., Schmidt-Traub, G., Kroll, C., Lafortune, G., & Fuller, G. (2019). *Sustainable Development Report 2019*. Bertelsmann Stiftung y SDSN, New York.
- Sepúlveda, S. (2008). *Biograma: metodología para estimar el nivel de desarrollo sostenible de territorios*. IICA, San José, Costa Rica.
- Sepúlveda, S., et al. (2001). *Metodología para estimar el nivel de desarrollo sostenible en espacios territoriales*. IICA.
