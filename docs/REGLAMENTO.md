# PRODE Mundial FIFA 2026 — Reglamento del Juego

> Especificación del **reglamento oficial** del PRODE, tal como se publica en el sitio
> (`#reglamento`) y como lo aplica el sistema de puntuación. Fuente del puntaje:
> `js/config.js` (`CONFIG.PUNTOS`) y la corrección automática `as_recalcular_ranking()`
> en `sql/setup.sql`. Página en vivo: <https://robpaz.github.io/PRODE_S.A/#reglamento>.
> Última actualización: 2026-06-14.

---

## 1. Objetivo del juego

Cada participante pronostica el **marcador final** de los partidos disponibles de la
**fase de grupos** del Mundial FIFA 2026 y suma puntos según su acierto. Gana quien acumule
más puntos en la tabla de posiciones (ranking).

- Partidos a pronosticar: **64** (fase de grupos; la jornada 1 de los grupos A–D ya se jugó
  y queda excluida — ver [`SPECS.md`](./SPECS.md) §4).
- Se pronostica el marcador exacto de cada partido (goles del local y del visitante).

---

## 2. Cómo sumar puntos

| Caso | Definición | Puntos |
|------|------------|:------:|
| **Acierto Exacto** | Pronosticás el resultado exacto del partido (ej.: pronóstico **2-1** y el partido termina **2-1**). | **+3** |
| **Ganador o Empate** | Acertás el resultado general (quién gana o si empatan) pero **no** el marcador exacto (ej.: pronóstico 2-0 y termina 3-1; o pronóstico 1-1 y termina 2-2). | **+1** |
| **Sin Aciertos** | No acertás ni el ganador ni el empate del encuentro. | **0** |

> Los valores de puntaje viven en `js/config.js` (`CONFIG.PUNTOS`: `EXACTO=3`,
> `RESULTADO=1`, `SIN_ACIERTO=0`) y el reglamento de la UI se completa desde ahí, de modo
> que existe un **único lugar** para modificarlos.

### 2.1 Definición formal del puntaje (la que aplica el sistema)

Para un partido con pronóstico `(pl, pv)` y resultado real `(rl, rv)`:

```
signo(a, b) = +1 si a > b ; -1 si a < b ; 0 si a == b   (1 = gana local, -1 = gana visitante, 0 = empate)

si pl == rl  Y  pv == rv            -> +3   (acierto exacto)
si no, si signo(pl,pv) == signo(rl,rv) -> +1 (acierta el 1X2: ganador o empate)
en otro caso                        ->  0
```

Esto se implementa idénticamente en:
- `js/utils.js` → `calcularPuntos()` (cálculo en vivo para "Mi Prode").
- `sql/setup.sql` → función `as_recalcular_ranking()` (corrección oficial).

---

## 3. Criterios de desempate

En caso de **igualdad de puntos** en la tabla de posiciones, el ranking se define, en orden:

1. **Mayor cantidad de Aciertos Exactos** (marcadores acertados, +3 pts).
2. **Diferencia de Goles Acertada** (criterio de desempate): **menor diferencia queda por
   delante** del que tenga más.
3. **Fecha y hora de envío** del formulario: **quien lo envió antes tiene prioridad**.

### 3.1 Cómo se calcula la "Diferencia de Goles" (desempate)

Es un valor donde **menos es mejor**. Para cada partido con resultado cargado se acumula la
distancia entre la diferencia de goles pronosticada y la real:

```
diferencia_goles = Σ | (pl - pv) - (rl - rv) |    sobre todos los partidos con resultado
```

Ejemplo: pronóstico 2-0 (dif +2), resultado 3-1 (dif +2) → aporta `|2 - 2| = 0`.
Pronóstico 1-0 (dif +1), resultado 0-3 (dif -3) → aporta `|1 - (-3)| = 4`.

El ordenamiento del ranking aplica: `puntos` ⬇, luego `aciertos_exactos` ⬇, luego
`diferencia_goles` ⬆ (ascendente, menor primero), luego `fecha_envio` ⬆ (más antiguo primero).
(Ver `obtenerClasificacion()` y la vista `v_ranking`.)

---

## 4. Participación

- **Costo:** **10 Bs** por participación. Se puede pagar por **QR** o en **efectivo**.
  (Valor configurable en `js/config.js` → `CONFIG.COSTO_PARTICIPACION`.)
- **Datos requeridos:** Nombre y Apellido + Curso / Grado.
- **Un Prode por participante:** está limitado a un envío por **navegador / dispositivo**
  (localStorage). **No** se restringe por IP, porque en la red del colegio muchos alumnos
  comparten la misma IP pública. La IP se guarda solo a modo de registro. Ver detalle y
  limitaciones en [`SPECS.md`](./SPECS.md) §6.2 y §10.
- **Cierre por partido:** los partidos cuyo horario de cierre ya pasó quedan bloqueados y no
  se pueden pronosticar (ver `LOCK_BY_KICKOFF` en `js/config.js`).
- **Edición:** si está habilitada (`CONFIG.ALLOW_EDIT`), el participante puede ajustar sus
  pronósticos de partidos aún no cerrados hasta su horario de cierre.

---

## 5. Resolución y publicación de resultados

- Los **resultados oficiales** de cada partido se cargan en el panel de administración
  (`admin.html`) y se guardan en la tabla `resultados`.
- La **corrección** se ejecuta con "Recalcular ranking" (RPC `as_recalcular_ranking()`),
  que actualiza `puntos`, `aciertos_exactos` y `diferencia_goles` de todos los participantes.
- El **ranking** (Inicio y página Ranking) refleja la tabla actualizada; cada participante
  puede ver su detalle partido por partido en **Mi Prode**.

---

## 6. Resumen rápido

- ✅ Marcador exacto → **+3**
- ✅ Acierto de ganador/empate → **+1**
- ❌ Sin acierto → **0**
- 🥇 Desempate: aciertos exactos → diferencia de goles (menor mejor) → orden de envío
- 💵 Participar: **10 Bs** (QR o efectivo), 1 Prode por **navegador/dispositivo** (no por IP)
