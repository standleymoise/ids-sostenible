# Auditoría de contenido del instrumento (41 indicadores / 180 afirmaciones)

El contenido científico del instrumento —qué se pregunta y cuánto pesa— es de la autora. **No lo cambié.**
Aquí se anotan, al contrastarlo con otros índices ([INVESTIGACION-INDICES.md](INVESTIGACION-INDICES.md)), los puntos que
conviene decidir antes de una versión 2.0. Son observaciones, no veredictos.

## A. Ítems o indicadores cuya lógica conviene revisar

| Dónde | Observación |
|---|---|
| `eco05` Inflación | Peso −0,05 como indicador **y** signo propio en sus afirmaciones (doble negativo). Con +0,05 los pesos económicos suman 1,00. Ver [CORRECCIONES.md](CORRECCIONES.md). |
| `env13` Clima | Puntúa el *tipo* de clima («Tropical húmedo» +0,5, «Tropical seco» +0,4, «Ni uno ni otro» −0,1). Es contexto, no desempeño: una zona no mejora ni empeora su sostenibilidad por su clima. Se marcó como `context_only` en el mapeo a ODS. |
| `eco06` Minería | La afirmación «Explotación del subsuelo» suma (+0,5) y «Poca explotación minera» y «Políticas que impiden explotación minera» restan. La minería queda premiada en un índice de sostenibilidad; conviene confirmar que sea la intención y qué tipo de minería se entiende. |
| `env08` Especies | «Buena presencia de especies exóticas» suma (+0,1). Las exóticas suelen ser un riesgo (especies invasoras); revisar el sentido. |
| `env04` Parques | «Abierto al turismo» (−0,05) y «Comunidad dentro del parque» (−0,15) restan; discutible sin matices (turismo ordenado, comunidades que conservan). |
| `eco07`, `eco11` | Agricultura mecanizada y fábricas pesan 10 % y 15 % de la dimensión económica (fábricas es el mayor peso de la dimensión). `eco11` incluye «Contamina la zona», que se solapa con la dimensión ambiental (doble conteo). |
| `eco09` Aerolínea nacional | Depende de la geografía y no aplica a la mayoría de zonas pequeñas. Peso bajo (3 %), pero introduce sesgo contra zonas sin aeropuerto. |
| `soc06` | Mezcla percepciones («el pueblo se siente bien») con hechos («homicidios frecuentes»). Las percepciones dependen de quién responde. |
| `soc06_5` / `soc09_5` | **«Homicidios frecuentes» aparece dos veces** (Bienestar del pueblo y Seguridad): cuenta doble en el IDS (−0,1 × 0,10 + −0,05 × 0,15 en la dimensión social). La web las mantiene iguales (se responden a la vez) para evitar contradicciones, pero conviene decidir si se deja una sola. |
| `pol01` | Un solo indicador (7 afirmaciones) con 10 % del IDS. La justificación de la tesis (poco margen local frente a acuerdos internacionales) es discutible: gobernanza local, participación y transparencia son centrales en índices como el IGSM y el CPI. |

## B. Temas que otros índices cubren y esta escala no

Contrastado con el IDH cantonal, IPS, IDS-MIDEPLAN, ICC, IGSM, IDSC-BR y el CPI (verificar el detalle en cada metodología oficial):

- **Pobreza, ingreso y desigualdad** (IDH ajustado por desigualdad, pobreza multidimensional).
- **Resultados de salud y educación** (esperanza de vida, mortalidad infantil, años de escolaridad): la escala mide sobre todo *existencia de servicios*, no resultados.
- **Vivienda y servicios básicos** (saneamiento, electricidad, conectividad a internet).
- **Riesgo de desastres y adaptación al cambio climático** (solo hay mitigación de CO₂/NOx).
- **Movilidad y transporte público**, **gestión integral de residuos** (solo hay reciclaje y compostaje).
- **Gestión municipal y transparencia** (IGSM), **participación ciudadana** estructurada.
- **Cultura y patrimonio**, **pueblos indígenas** (relevante en Costa Rica), **ODS 14** (vida submarina; el mapeo no lo cubre).

## C. Calidad de las afirmaciones

1. **No hay definiciones operativas.** «Buena cobertura forestal» o «Seguridad» pueden responderse distinto según la persona. Cada afirmación debería tener un criterio verificable (por ejemplo, un umbral con fuente oficial).
2. **Sin trazabilidad.** No se pide fuente o evidencia por respuesta; programas como el IDSC-BR se apoyan casi por completo en estadística oficial.
3. **Afirmaciones sobre «todo» o «nada»** («Acceso fácil para todos», «Se compostea todo el material orgánico») empujan a respuestas «No» sistemáticas; los umbrales graduales serían más sensibles.
4. **Pesos sin procedimiento formal** (panel de expertos, Delphi, AHP) ni justificación escrita. La versión 1.1 mide la sensibilidad, pero no sustituye la elicitación de pesos.

## D. Cómo abordarlo (propuesta)

1. Decidir los puntos de la tabla A (la autora).
2. Panel de expertos (Delphi, 2–3 rondas) para revisar contenido, redactar definiciones operativas y asignar pesos (p. ej. AHP).
3. Piloto en varios cantones con 3 o más evaluadores por cantón (la web ya calcula el acuerdo entre evaluadores).
4. Validar contra IDHc, IPS cantonal e IDS-MIDEPLAN con correlación de Spearman (`js/stats.js`) y reportar el α de Cronbach.
5. Publicar el instrumento revisado como **versión 2.0**, conservando la 1.0 para poder reproducir la tesis (cada evaluación ya guarda la versión del instrumento).

## E. Coherencia entre respuestas (reglas propuestas)

La web bloquea respuestas contradictorias con `data/constraints.json` (propuesta, pendiente de revisión por la autora):
- **Bloqueo duro:** el clima es uno solo (exactamente una opción de las 3); mantenimiento constante vs. con intervalos grandes; exportar vs. «no se exporta»; y dependencias (p. ej. «mantenimiento» exige que existan espacios verdes; «turismo seguro» exige atracción turística).
- **Aviso con confirmación (suave):** ríos intermitentes/permanentes y limpios/contaminados, talar sin reemplazar vs. renovar, servicios descentralizados vs. concentrados, «Seguridad» vs. delincuencia u homicidios.
- **Duplicado:** «Homicidios frecuentes» se responde una vez y se copia a ambos indicadores.
Revisar la lista y decidir qué pares son realmente excluyentes.
