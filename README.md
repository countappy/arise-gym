# ⟁ ARISE — Sistema de Entrenamiento

App local de gimnasio con estética **Solo Leveling**: entrenas, registras tu cuerpo y tu dieta, y el Sistema te recompensa con XP, niveles, rangos (E → S) y títulos.

## Cómo abrirla

Doble clic en **`index.html`**. Se abre en tu navegador (Edge o Chrome). No necesita internet ni instalación.

> Consejo: una vez abierta, puedes anclarla — en Edge: menú ⋯ → *Aplicaciones* → *Instalar este sitio como aplicación*. Así tendrás icono propio y se abre como app de escritorio.

## Cómo funciona el Sistema

| Acción | XP |
|---|---|
| Completar un entrenamiento | 50 + 10 por ejercicio |
| Nuevo récord personal (peso máximo en un ejercicio) | +100 |
| Registrar peso corporal (del día) | +25 |
| Registrar dieta (del día) | +20 |
| Cumplir el objetivo de proteína | +30 |
| Completar la misión diaria entera | +50 y +1 Disciplina |
| Desbloquear un título | +100 |

- **Puerta semanal (mazmorras)**: cada lunes se abre una Puerta con un jefe de la serie (Estatua del Dios → Cerbero → Vulcan → Igris → Kargalgan → Baruka → Beru → Kamish, y vuelta a empezar más fuerte). Su vida se calcula según tu volumen semanal medio, y **cada kg que levantas le hace 1 de daño**. Derrótalo antes del domingo → XP + botín. Si escapa → −50 XP. Derrotarlo hace avanzar la campaña al siguiente jefe.
- **Inventario y botín**: los jefes sueltan su reliquia (coleccionable) y un consumible: *Poción del Monarca* (XP×2 en el próximo entreno), *Piedra de la Bendición* (un día de descanso cuenta como registro: protege racha y castigo) o *Esencia de Maná* (+100 XP). Se usan desde la pestaña INVENTARIO.
- **Tarjeta de cazador**: en ESTADO → Datos del jugador, el botón 🪪 genera una imagen de tu estado (nivel, rango, stats, marcas, jefes) lista para compartir.
- **Misión especial de cardio**: si registras más calorías que tu objetivo, el Sistema te asigna cardio en el acto — 1 minuto por cada 10 kcal de exceso (mínimo 10, máximo 60). Completarla da +50 XP (botón COMPLETADA en la Misión Diaria). Si el día acaba y la ignoraste, cuenta como misión fallida: −50 XP. El rechazo no es una opción.
- **Castigo del Sistema**: si un día completo termina sin **ningún** registro (ni entreno, ni peso, ni dieta), al volver a abrir la app el Sistema te castiga con **−50 XP por cada día ignorado** — puedes bajar de nivel e incluso de rango. Registrar la dieta o el peso en días de descanso te libra del castigo (y mantiene la racha). La regla cuenta desde el día que estrenaste la app, nunca hacia atrás.
- **Entrenamiento (estilo Hevy)**: pulsa *▶ ENTRENAMIENTO VACÍO* o *▶ EMPEZAR* en una rutina — el entreno siempre es de hoy, sin fechas. Los ejercicios se eligen en un selector con **foto y grupo muscular** (214 ejercicios: barra, mancuernas, poleas, máquinas, multipower, kettlebells, gomas, pliométricos... + los personalizados que escribas), con buscador (ignora acentos) y filtros por grupo. Cada ejercicio se prefija con las series de tu última sesión (columna "ANTERIOR"). El entreno en curso **se guarda solo**: si cierras la app a medias, al volver sigue ahí.
- **Durante el entreno**: cronómetro de sesión en vivo, **temporizador de descanso** (1:00–3:00, suena el ding del Sistema al acabar), **calculadora de discos** (botón 🏋 DISCOS, con colores olímpicos) y campo de notas. La duración y las notas se guardan en el historial.
- **Estadísticas** (pestaña ENTRENAMIENTO): volumen semanal de las últimas 8 semanas y reparto por grupo muscular de los últimos 30 días. La gráfica de progresión permite elegir métrica: peso máximo, **1RM estimado** (fórmula de Epley, también en la tabla de récords) o volumen.
- **Misión secundaria**: cada día el Sistema propone un reto extra (estirar, pasos, agua...) por +15 XP. Sin castigo: es voluntaria.
- **Objetivos del Cazador** (ESTADO): metas de peso en ejercicio, peso corporal o racha, con barra de progreso. Cumplirlas da +150 XP con pop-up dorado.
- **Calendario** (ENTRENAMIENTO): vista mensual — días de entreno en azul, registros con punto, castigos en rojo, hoy en dorado.
- **Rangos de fuerza** (ENTRENAMIENTO): tu 1RM estimado frente a tu peso corporal según estándares reales — cada levantamiento grande con rango E→S y el peso que te falta para el siguiente.
- **Plantillas de rutina**: Full Body, Push, Pull, Leg, Torso y Pierna listas para importar (botón 📋 PLANTILLAS).
- **Recordatorio de copia**: si llevas más de 7 días sin exportar y ya tienes datos, el Sistema te lo recuerda al abrir.
- **Corregir entrenos**: lápiz ✎ en el historial — corrige pesos o notas de sesiones pasadas y los récords se recalculan (el XP no cambia).
- **Fotos de progreso** (CUERPO): galería con comparativa automática primera-VS-última. Viven en el navegador (IndexedDB) y **no van en la copia JSON**. +25 XP por día con foto.
- **Informe semanal**: cada lunes, al abrir, el Sistema resume tu semana anterior (entrenos, volumen, récords, peso, proteína y el destino del jefe).
- **Evolución corporal**: la gráfica de CUERPO permite elegir cualquier medida (peso, grasa, cintura, brazo...).
- **QoL**: buscador en el historial (por ejercicio o nota), reordenar ejercicios con ↑↓, duplicar rutinas con ⧉.
- **Títulos**: en LOGROS puedes elegir qué título lucir con USAR TÍTULO (por defecto, el último desbloqueado).
- **Rutinas**: *+ NUEVA RUTINA* abre el editor (elige ejercicios y marca series/kg/reps objetivo), cada rutina tiene *▶ EMPEZAR*, *EDITAR* y eliminar. También puedes guardar un entrenamiento en curso como rutina. Las fotos de ejercicios vienen de free-exercise-db (dominio público) y viven en `img/ex/`.
- **Rangos**: E (nivel 1) → D (10) → C (20) → B (30) → A (40) → **S (50)**.
- **Stats**: Fuerza sube con récords, Resistencia con sesiones, Disciplina con misiones diarias completas, Voluntad con tu mejor racha.
- **Racha**: días seguidos con al menos un registro (entreno, peso o dieta). Registrar la dieta en día de descanso mantiene la racha viva.

## Tus datos

- Se guardan **en el navegador** (localStorage), no en archivos de la carpeta. Si borras los datos de navegación, se pierden.
- Usa **EXPORTAR COPIA** (pestaña ESTADO → Datos del jugador) de vez en cuando para descargar un `.json` de respaldo, e **IMPORTAR COPIA** para restaurarlo.
- Si abres la app en otro navegador u otro PC, empieza vacía: importa ahí tu copia.

## Logros y pop-ups

Hay **88 títulos** repartidos en 9 categorías (entrenamientos, récords, rachas, niveles, tonelaje, hazañas, cuerpo, dieta y misión diaria). Cada uno otorga 100 XP. Al desbloquear un título o subir de nivel aparece un **pop-up del Sistema con sonido**; si desbloqueas varios a la vez, salen en cola uno tras otro (los de logro se cierran solos, el de nivel espera tu clic).

**Sonido**: suena el **"ding" real del Sistema de la serie** (`snd/levelup.m4a`). Si quieres cambiarlo, mira `snd/LEEME.txt`; si el archivo falta, la app sintetiza un chime parecido con WebAudio.

## Personaje

Al crear tu perfil eliges **Cazador** (Sung Jin-Woo) o **Cazadora** (Cha Hae-In). Tu personaje aparece en el panel de ESTADO y en la ventana de subida de nivel, y **evoluciona con tu nivel**:

| Nivel | Jin-Woo | Cha Hae-In |
|---|---|---|
| 1–9 (rango E) | débil, con tiritas (`jinwoo-t1.avif`) | entrenando con espada (`cha-t1.jpg`) |
| 10–29 (rangos D y C) | pose de batalla, daga roja (`jinwoo-t2.png`) | armadura de caballero (`cha-t2.png`) |
| 30–49 (rangos B y A) | manhwa bajo la lluvia (`jinwoo-t3.jpg`) | campo de batalla (`cha-t3.jpg`) |
| 50+ (rango S) | Monarca de las Sombras, aura púrpura (`jinwoo-t4.png`) | — (usa la anterior) |

Para cambiar una imagen, sustituye el archivo en `img/` manteniendo el nombre. Si añades `cha-t4.*`, recuerda añadirla también a `CHAR_TIERS` en `app.js`.

## Archivos

- `index.html` — estructura de la app
- `style.css` — tema visual "Sistema"
- `app.js` — toda la lógica (XP, niveles, misiones, rutinas, gráficas)
- `img/` — imágenes de personaje para las subidas de nivel
