# Dimensión política ampliada (instrumento 1.1)

**Estado: propuesta de la implementación web, no forma parte de la tesis.** Los indicadores, las afirmaciones y los pesos fueron
redactados a partir de la investigación descrita abajo y deben validarse con la autora y un panel de expertos antes de
usarse como resultado científico. El instrumento **1.0** (tesis, un solo indicador político) se conserva intacto y sigue
disponible: al crear una evaluación se elige la versión.

## Por qué ampliar

La tesis justificó un solo indicador político (7 afirmaciones) porque «la política no tiene tanto peso» frente a los acuerdos
internacionales. Pero a escala **local**, la gobernanza es justamente lo que una comunidad puede ver y mejorar:

- El **ODS 16** (paz, justicia e instituciones sólidas) es uno de los 17 objetivos y sus metas hablan de instituciones eficaces, transparentes y que rinden cuentas (16.6), de participación en las decisiones (16.7), acceso a la información (16.10), estado de derecho y acceso a la justicia (16.3), lucha contra la corrupción (16.5) y no discriminación (16.b). Con un solo indicador, la escala cubría muy poco de eso.
- El **Índice de Gestión Municipal** de la Contraloría General de la República (el antecesor del IGSM) se organizaba en cinco ejes, uno de ellos «planificación, participación ciudadana y rendición de cuentas» y otro «desarrollo y gestión institucional»; el **IGSM 2025** evalúa la madurez de los servicios municipales (inicial, básico, intermedio, avanzado). Es decir, los instrumentos oficiales miden con detalle la gestión local, y la escala no.
- El **City Prosperity Index** de ONU-Hábitat incluye «gobernanza y legislación urbana» como una de sus 6 dimensiones.
- La **gestión de riesgos** (comisión de emergencias, ordenamiento territorial) era un hueco señalado en la [auditoría de contenido](AUDITORIA-CONTENIDO.md); encaja aquí.

## Criterios de diseño

1. **Afirmaciones verificables** (un documento, un sitio web, una acta, una comisión que existe o no), no opiniones: reduce la subjetividad, el mayor problema del instrumento.
2. **Solo escala local** (municipalidad, concejos de distrito, comunidad): nada de política nacional ni partidaria.
3. **Sin solapes** con las 7 afirmaciones originales ni con la dimensión social (p. ej. la corrupción y el diálogo ya están en `pol01`; la seguridad y la violencia en `soc09`).
4. **Aplicables a cualquier zona:** se evitaron afirmaciones que penalizarían a zonas donde un grupo no existe (por ejemplo, una afirmación sobre pueblos indígenas obligaría a responder «No» donde no hay pueblos indígenas).
5. **Mismo formato que la tesis:** Sí/No, pesos positivos que suman 1 por indicador y a lo más **una** afirmación negativa moderada (−0,20) por indicador. Un generador (`tools/build_instrument_1_1.py`) y pruebas automáticas verifican estas reglas.
6. **Sin cambiar nada más:** las otras tres dimensiones y el peso de la dimensión política (10 %) son idénticos a la 1.0 (hay una prueba que lo comprueba).

## Los indicadores

`pol01` es el indicador original (sus 7 afirmaciones y sus pesos internos no cambian); pasó a llamarse «Política general».

| Id | Indicador | Peso en la dimensión | ODS | Afirmaciones |
|---|---|---|---|---|
| `pol01` | **Política general** (original) | 0,25 | 16 | Estabilidad política · Transición pacífica · Metas políticas claras · Corrupción (−) · Satisfacción de la población · Políticos electos contribuyen · Diálogo políticos-pueblo |
| `pol02` | **Participación ciudadana** | 0,20 | 16, 11 | Concejos sesionan abiertos (0,25) · Audiencias/cabildos anuales (0,25) · Comunidad define prioridades de inversión (0,25) · Organizaciones comunales activas (0,15) · Espacios para jóvenes y mujeres (0,10) |
| `pol03` | **Transparencia y rendición de cuentas** | 0,20 | 16 | Presupuesto y planes publicados (0,30) · Actas públicas (0,20) · Informe anual de rendición de cuentas (0,25) · Canal de quejas con respuesta (0,25) · **(−0,20)** Entes de control señalan incumplimientos graves sin corregir |
| `pol04` | **Planificación y ordenamiento territorial** | 0,15 | 11, 13 | Plan de desarrollo local vigente (0,30) · Plan regulador vigente (0,25) · Seguimiento con metas e indicadores (0,20) · Plan de gestión de riesgo y comisión de emergencias (0,25) · **(−0,20)** Permisos en zonas de riesgo o protegidas |
| `pol05` | **Capacidad de gestión local** | 0,10 | 16, 11 | Servicios básicos con regularidad (0,35) · Trámites en plazos razonables (0,25) · Personal técnico (0,25) · Alianzas y convenios (0,15) |
| `pol06` | **Justicia y no discriminación** | 0,10 | 16, 10 | Acceso a servicios de justicia (0,40) · Resolución alterna de conflictos (0,30) · Servicios sin discriminación (0,30) · **(−0,20)** Denuncias frecuentes de abuso de autoridad o discriminación |

Resultado: la dimensión política pasa de 1 indicador y 7 afirmaciones a **6 indicadores y 30 afirmaciones**; el instrumento completo pasa de 41/180 a **46/203**.
El texto exacto está en español e inglés en [`data/src/political-1.1.json`](../data/src/political-1.1.json).

### Fuentes de verificación sugeridas (para quien responde)

| Indicador | Dónde confirmar la respuesta |
|---|---|
| Participación | Actas y agenda del concejo; convocatorias a audiencias; registros de concejos de distrito; asociaciones de desarrollo |
| Transparencia | Sitio web de la municipalidad (presupuesto, plan operativo, liquidación, actas); informe de labores; contraloría de servicios o buzón de quejas |
| Planificación | Plan cantonal de desarrollo; plan regulador publicado; plan municipal de gestión del riesgo; comisión municipal de emergencias |
| Capacidad de gestión | Resultados del IGSM de la Contraloría para esa municipalidad; plantilla técnica; tiempos de trámites |
| Justicia | Mapa de oficinas del Poder Judicial; casas de justicia o centros de mediación; Defensoría de los Habitantes |
| Control | Informes de la Contraloría General de la República y de la auditoría interna |

## Lo que se decidió no hacer (y por qué)

- **No se subió el peso de la dimensión política (10 %).** Cambiarlo altera el modelo completo y debe decidirse con evidencia (panel de expertos, análisis de sensibilidad). La web ya muestra cuánto cambia el IDS si los pesos varían ±20 %, incluido el de las dimensiones. Con más contenido, mantener 10 % significa que cada indicador político pesa muy poco en el IDS global: **conviene reconsiderarlo**.
- **No se incluyó política partidaria, elecciones ni desempeño de partidos** (fuera de la escala local; en `pol01` ya hay afirmaciones sobre estabilidad y transición).
- **No se midió participación electoral**, aunque el IDS de MIDEPLAN sí la incluye (15,9 %): no está bajo control de las autoridades locales y se obtiene mejor del TSE que de una entrevista.
- **Los pesos son provisionales.** Se asignaron con un criterio simple (lo más verificable y de mayor impacto, mayor peso) y deben sustituirse por pesos elicitados (Delphi/AHP).

## Cómo afecta a los resultados

- Una evaluación 1.0 **no está completa en la 1.1** (faltan las 23 afirmaciones nuevas): no se mezclan versiones; cada evaluación guarda su versión y se calcula con ella.
- Las dimensiones ambiental, social y económica no cambian, así que esas puntuaciones son comparables entre versiones. La dimensión política y el IDS global **no** lo son estrictamente.
- La pantalla *Comparar evaluaciones* calcula el acuerdo solo con las afirmaciones respondidas por todas; para medir fiabilidad con la 1.1, que todas las evaluaciones comparadas usen la 1.1.

## Cómo validar la dimensión política

1. **Contenido:** panel de 5–10 expertos (gestión municipal, administración pública, derecho municipal, participación ciudadana): ¿cada afirmación es relevante, clara y verificable? Calcular el índice de validez de contenido (CVI) por afirmación.
2. **Contra medidas objetivas:** correlación de Spearman entre `pol05` (y el conjunto político) y el **nivel del IGSM de la Contraloría** de cada municipalidad (ordinal); con los resultados del antiguo Índice de Gestión Municipal si hay datos; y, de forma parcial, con la **participación electoral** de MIDEPLAN.
3. **Fiabilidad:** acuerdo entre 3 o más evaluadores por zona (κ de Fleiss e ICC) específicamente en la dimensión política; las afirmaciones con bajo acuerdo se reformulan.
4. **Discriminación:** que las zonas con municipalidades de mayor madurez (IGSM «intermedio» frente a «inicial») obtengan mayor puntaje político (grupos conocidos).

Hipótesis previa propuesta (**H6**): la dimensión política 1.1 correlaciona positivamente (ρ ≥ 0,3) con el nivel del IGSM de la municipalidad y mejora la fiabilidad frente a la 1.0.

## Limitaciones

- Las afirmaciones sobre instituciones costarricenses (concejos de distrito, comités cantonales de la persona joven, planes reguladores, comisiones de emergencia) reflejan la organización local vigente; **verificar la base legal exacta** antes de citarla en el artículo.
- Algunas afirmaciones requieren conocer documentos (p. ej., informes de la Contraloría): pueden exigir que responda alguien de la municipalidad o de una institución, no cualquier vecino. El campo «quién responde» de la web permite analizar la diferencia.
- «Servicios con regularidad» y «plazos razonables» siguen teniendo un componente de juicio; conviene fijar umbrales operativos.
