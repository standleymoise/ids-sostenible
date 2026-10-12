# Pendientes antes de enviar el artículo a una revista o preprint

Cosas que no pude verificar con el material de la carpeta y que debe confirmar la autora:

1. **Datos de validación.** Los resultados (alfa de Cronbach 0,87; rango de cercanía 100 % / 90 % / 65 %) salen solo del
   PowerPoint de la defensa; el docx de la tesis no tiene texto en «Resultados y Discusión». Hacen falta los datos crudos
   (10 ciudades, respuestas de las 10 personas, valores de IPS/IDHC/IDSD) para poder reportar y reproducir el cálculo.
2. **Nombres completos** de los índices IPS, IDHC e IDSD, y su fuente/año.
3. **Cómo se calculó el alfa de Cronbach** (qué son «ítems» y qué son «observaciones») y el significado exacto de Z en el rango de cercanía.
4. **Cuestión de «Inflación»** (peso −0,05): decidir si se corrige a +0,05 (ver `docs/CORRECCIONES.md`).
5. **Referencias**: verificar DOIs, enlaces y datos de cada una (en particular Hickel 2020).
6. **Autoría y afiliación**: confirmar ortografía de nombres, si el asesor figura como coautor, ORCID si lo tiene (añadir a `CITATION.cff`).
7. **Permisos**: confirmar con la universidad si la tesis puede enlazarse o depositarse en abierto (no se incluye en el repositorio).
8. **Publicar un DOI**: conectar el repositorio con Zenodo (https://zenodo.org) y crear un *release* `v1.0.0`; luego añadir el DOI al README y a `CITATION.cff`.
9. **Revista/preprint**: elegir destino (p. ej. SciELO Preprints, Zenodo/OSF Preprints, o una revista de desarrollo sostenible o de software abierto) y adaptar formato y longitud.

## Añadidos con la versión 1.1

10. ~~Confirmar «IDSD»~~ — confirmado por la autora: Índice de Desarrollo Social Distrital (MIDEPLAN). Falta indicar qué edición se usó en 2020 (la actual es 2023 y no es comparable con 2017).
11. **Validar el mapeo a ODS** (`data/sdg-map.json`) con la autora o un panel; hoy es una propuesta.
12. **Verificar las referencias nuevas** (PNUD 2026, MIDEPLAN 2024, INCAE-CLACDS, IDSC-BR, ONU-Hábitat UMF): varias se tomaron de la prensa o de páginas que no se pudieron abrir completas; sustituirlas por el documento oficial.
13. **Decidir los puntos de `docs/AUDITORIA-CONTENIDO.md`** antes de hablar de una versión 2.0 en el artículo.
14. **Probar con datos reales** el acuerdo entre evaluadores y la sensibilidad: hoy solo se probaron con respuestas simuladas.

## Añadidos con las versiones 1.2 y 1.3

15. **Confirmar la definición de «rango de cercanía» (Z)**: se interpretó como diferencia en escala 0–100 con tolerancia ±10 y umbral 80 % (`docs/VALIDACION.md`).
16. **Revisar las reglas de coherencia** (`data/constraints.json`): ¿qué pares son realmente excluyentes? Decidir también si «Homicidios frecuentes» se deja una sola vez.
17. **Conseguir los datos externos** (IDS distrital 2023, Atlas cantonal, IPS) y **hacer el estudio de seguimiento** siguiendo `docs/VALIDACION.md`: ≥ 29 zonas, 3+ evaluadores por zona. Hasta entonces el artículo no puede afirmar resultados.
18. **Fijar las hipótesis H1–H4** antes de ver los datos (idealmente registrarlas en OSF).

## Con los datos de MIDEPLAN (v1.4)

19. ✅ IDS 2023 de MIDEPLAN integrado (distritos y cantones, 5 dimensiones). Falta el **estudio de campo**: evaluar distritos reales (≥ 29, idealmente cubriendo los 5 quintiles) con 3+ evaluadores cada uno.
20. Decidir si la tesis comparó con el IDS **2017** o el de **2023**: no son comparables entre sí; el artículo debe decir cuál.
21. **Atlas del PNUD (IDHc) e IPS cantonal**: siguen sin datos tabulares; pedirlos a la Escuela de Estadística (UCR)/Sinirube e INCAE-CLACDS. Con MIDEPLAN solo ya se puede hacer la validación principal.
22. Citar la fuente de MIDEPLAN con el documento oficial (el repositorio reproduce solo valores numéricos; ver `data/external/README.md`).
