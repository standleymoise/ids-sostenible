# Hoja de ruta

## Hecho

- **1.0** — Portado desde Excel y Android: motor, pruebas contra el Excel, PWA offline, es/en, exportar/importar, PDF.
- **1.1** — Rigor metodológico y fiabilidad: análisis de sensibilidad de pesos, equilibrio entre dimensiones, acuerdo entre evaluadores (κ de Fleiss, consenso), mapeo propuesto a ODS, provincia/cantón/fecha/rol, versión del instrumento, estadísticas de validación (α de Cronbach, Spearman).

- **1.2** — Coherencia entre respuestas: bloqueo de contradicciones, dependencias y duplicados (`data/constraints.json`).
- **1.3** — Kit de validación: Spearman/Kendall/Pearson con IC y permutación, CCC de Lin, Bland–Altman, rango de cercanía, quintiles (κ ponderado), grupos conocidos, ICC, α de Cronbach por ítem y dos mitades; pantalla *Validación*, CLI `tools/validate.js` y [protocolo](VALIDACION.md). Campo *distrito* para cruzar con el IDS de MIDEPLAN.
- **1.4** — IDS 2023 de MIDEPLAN incluido (490 distritos, 84 cantones, 5 dimensiones) con cruce por código oficial, selector provincia › cantón › distrito y matriz de validez convergente/discriminante por dimensión.
- **1.5** — Instrumento 1.1: dimensión política ampliada de 1 a 6 indicadores (30 afirmaciones; propuesta). La 1.0 de la tesis se conserva; cada evaluación guarda su versión.
- **1.6** — IDS 2017 de MIDEPLAN incluido (482 distritos, 82 cantones; la edición de la tesis); selector de edición y filtro por versión del instrumento (1.1 por defecto) en la validación.

## Siguiente (requiere decisiones o datos de la autora)

1. **Decidir «Inflación»** y los puntos de [AUDITORIA-CONTENIDO.md](AUDITORIA-CONTENIDO.md).
2. **Datos de validación** de la tesis (ciudades, evaluadores, índices de contraste) para reproducir α de Cronbach y concordancias y publicarlos anonimizados.
3. **Pilotos de campo**: 3+ evaluadores por cantón en varios cantones; usar «Comparar evaluaciones» para medir acuerdo.
4. **Validación externa**: correlación de Spearman entre el IDS y el Atlas de Desarrollo Humano Cantonal, el IPS cantonal y el IDS de MIDEPLAN (hay datos públicos por cantón/distrito).

## Ideas técnicas (no urgentes)

- Campo de **evidencia/fuente** por afirmación y exportarlo.
- **Definiciones operativas** por afirmación (texto de ayuda) una vez revisadas por expertos.
- Panel de **comparación en el tiempo** de la misma zona con gráfico por indicador.
- Instrumento **2.0** versionado en `data/` (hoy hay una sola versión; las evaluaciones ya guardan `instrument`).
- Pruebas de interfaz automatizadas (Playwright) y auditoría Lighthouse/accesibilidad en CI.
- Publicar el instrumento como datos abiertos con DOI (Zenodo).
