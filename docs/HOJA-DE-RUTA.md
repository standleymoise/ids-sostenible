# Hoja de ruta

## Hecho

- **1.0** — Portado desde Excel y Android: motor, pruebas contra el Excel, PWA offline, es/en, exportar/importar, PDF.
- **1.1** — Rigor metodológico y fiabilidad: análisis de sensibilidad de pesos, equilibrio entre dimensiones, acuerdo entre evaluadores (κ de Fleiss, consenso), mapeo propuesto a ODS, provincia/cantón/fecha/rol, versión del instrumento, estadísticas de validación (α de Cronbach, Spearman).

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
