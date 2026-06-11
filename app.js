'use strict';

/* ============================================================
   ARISE — Sistema de Entrenamiento (lógica)
   ============================================================ */

/* ---------- Utilidades ---------- */
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');
const dateStr = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const todayStr = () => dateStr(new Date());
const fmtDate = s => { const [y, m, d] = s.split('-'); return d + '/' + m + '/' + y; };
const fmtNum = (n, dec = 1) => Number(n).toLocaleString('es-ES', { maximumFractionDigits: dec });
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const parseNum = v => parseFloat(String(v).replace(',', '.'));

/* ---------- Constantes ---------- */
const XP = {
  workout: 50, perExercise: 10, perExerciseCap: 5,
  pr: 100, body: 25, diet: 20, protein: 30, bonus: 50, achievement: 100,
  penalty: 50, // castigo por cada día sin ningún registro o misión especial ignorada
  special: 50, // recompensa por completar la misión especial de cardio
  side: 15,    // misión secundaria del día
  goal: 150    // objetivo personal cumplido
};

/* Misión secundaria aleatoria del día (rota con la fecha) */
const SIDE_MISSIONS = [
  'Estira 10 minutos',
  'Camina 8.000 pasos',
  'Bebe 2 litros de agua',
  'Duerme 8 horas esta noche',
  'Haz 5 minutos de movilidad de cadera',
  'Come una pieza de fruta',
  'Hoy sin azúcar añadido',
  'Sube siempre por las escaleras',
  'Haz 30 flexiones repartidas en el día',
  'Acumula 3 minutos de plancha',
  'Sal a caminar 20 minutos',
  'Pesa y apunta tu comida principal'
];

/* 1RM estimado (fórmula de Epley) */
const est1RM = (w, r) => r > 1 ? w * (1 + r / 30) : w;

/* Imagen de personaje según nivel: m = Sung Jin-Woo, f = Cha Hae-In.
   Tramos: 1-9 (E) -> t1 débil, 10-29 (D/C) -> t2, 30-49 (B/A) -> t3,
   50+ (S) -> t4 Monarca de las Sombras. Si faltan imágenes se usa la última. */
const CHAR_TIERS = {
  m: ['img/jinwoo-t1.avif', 'img/jinwoo-t2.png', 'img/jinwoo-t3.jpg', 'img/jinwoo-t4.png'],
  f: ['img/cha-t1.jpg', 'img/cha-t2.png', 'img/cha-t3.jpg']
};

function charImgFor(level) {
  const imgs = CHAR_TIERS[data.profile.gender === 'f' ? 'f' : 'm'];
  const tier = level >= 50 ? 3 : level >= 30 ? 2 : level >= 10 ? 1 : 0;
  return imgs[Math.min(tier, imgs.length - 1)];
}

/* ============================================================
   BASE DE DATOS DE EJERCICIOS (imagen + grupo muscular)
   ============================================================ */
const EX_CATS = ['TODOS', 'PECHO', 'ESPALDA', 'HOMBRO', 'BRAZO', 'PIERNA', 'CORE', 'CARDIO'];
const E = (name, group, cat, img) => ({ name, group, cat, img: 'img/ex/' + img + '.jpg' });
const EXERCISE_DB = [
  E('Press banca', 'Pecho', 'PECHO', 'press-banca'),
  E('Press inclinado', 'Pecho', 'PECHO', 'press-inclinado'),
  E('Press declinado', 'Pecho', 'PECHO', 'press-declinado'),
  E('Press banca con mancuernas', 'Pecho', 'PECHO', 'press-banca-mancuernas'),
  E('Press inclinado con mancuernas', 'Pecho', 'PECHO', 'press-inclinado-mancuernas'),
  E('Press de pecho en máquina', 'Pecho', 'PECHO', 'press-maquina'),
  E('Press banca en multipower', 'Pecho', 'PECHO', 'press-smith'),
  E('Press inclinado en multipower', 'Pecho', 'PECHO', 'press-inclinado-smith'),
  E('Press de pecho en polea', 'Pecho', 'PECHO', 'press-pecho-polea'),
  E('Aperturas con mancuernas', 'Pecho', 'PECHO', 'aperturas'),
  E('Aperturas inclinadas', 'Pecho', 'PECHO', 'aperturas-inclinadas'),
  E('Aperturas en máquina (contractor)', 'Pecho', 'PECHO', 'contractor'),
  E('Cruces en polea', 'Pecho', 'PECHO', 'cruces-polea'),
  E('Cruces en polea baja', 'Pecho', 'PECHO', 'cruces-polea-baja'),
  E('Aperturas en polea en banco', 'Pecho', 'PECHO', 'aperturas-polea-banco'),
  E('Pullover con mancuerna', 'Pecho', 'PECHO', 'pullover'),
  E('Fondos', 'Pecho', 'PECHO', 'fondos'),
  E('Flexiones', 'Pecho', 'PECHO', 'flexiones'),
  E('Flexiones abiertas', 'Pecho', 'PECHO', 'flexiones-abiertas'),
  E('Flexiones con pies elevados', 'Pecho', 'PECHO', 'flexiones-pies-elevados'),
  E('Dominadas', 'Espalda', 'ESPALDA', 'dominadas'),
  E('Dominadas supinas', 'Espalda', 'ESPALDA', 'dominadas-supinas'),
  E('Jalón al pecho', 'Espalda', 'ESPALDA', 'jalon-al-pecho'),
  E('Jalón agarre cerrado', 'Espalda', 'ESPALDA', 'jalon-agarre-cerrado'),
  E('Jalón agarre supino', 'Espalda', 'ESPALDA', 'jalon-supino'),
  E('Jalón con agarre en V', 'Espalda', 'ESPALDA', 'jalon-v'),
  E('Remo con barra', 'Espalda', 'ESPALDA', 'remo-con-barra'),
  E('Remo con mancuerna', 'Espalda', 'ESPALDA', 'remo-mancuerna'),
  E('Remo con dos mancuernas', 'Espalda', 'ESPALDA', 'remo-dos-mancuernas'),
  E('Remo en polea baja', 'Espalda', 'ESPALDA', 'remo-polea'),
  E('Remo en polea a un brazo', 'Espalda', 'ESPALDA', 'remo-polea-un-brazo'),
  E('Remo en T', 'Espalda', 'ESPALDA', 'remo-t'),
  E('Remo en T tumbado', 'Espalda', 'ESPALDA', 'remo-t-maquina'),
  E('Remo en máquina', 'Espalda', 'ESPALDA', 'remo-maquina-palanca'),
  E('Remo alto en máquina', 'Espalda', 'ESPALDA', 'remo-alto-maquina'),
  E('Remo en multipower', 'Espalda', 'ESPALDA', 'remo-smith'),
  E('Remo tumbado en banco inclinado', 'Espalda', 'ESPALDA', 'remo-banco-inclinado'),
  E('Pullover en polea', 'Espalda', 'ESPALDA', 'pullover-polea'),
  E('Peso muerto', 'Espalda', 'ESPALDA', 'peso-muerto'),
  E('Hiperextensiones', 'Lumbar', 'ESPALDA', 'hiperextensiones'),
  E('Superman', 'Lumbar', 'ESPALDA', 'superman'),
  E('Encogimientos con barra', 'Trapecio', 'ESPALDA', 'encogimientos-barra'),
  E('Encogimientos con mancuernas', 'Trapecio', 'ESPALDA', 'encogimientos-mancuernas'),
  E('Press militar', 'Hombro', 'HOMBRO', 'press-militar'),
  E('Press militar sentado', 'Hombro', 'HOMBRO', 'press-militar-sentado'),
  E('Press de hombros con mancuernas', 'Hombro', 'HOMBRO', 'press-hombros-mancuernas'),
  E('Press de hombros sentado', 'Hombro', 'HOMBRO', 'press-hombros-sentado'),
  E('Press Arnold', 'Hombro', 'HOMBRO', 'press-arnold'),
  E('Press de hombros en máquina', 'Hombro', 'HOMBRO', 'press-hombro-maquina'),
  E('Press tras nuca', 'Hombro', 'HOMBRO', 'press-tras-nuca'),
  E('Elevaciones laterales', 'Hombro', 'HOMBRO', 'elevaciones-laterales'),
  E('Elevaciones laterales sentado', 'Hombro', 'HOMBRO', 'elevaciones-laterales-sentado'),
  E('Elevaciones laterales en polea', 'Hombro', 'HOMBRO', 'elevaciones-laterales-polea'),
  E('Elevaciones frontales', 'Hombro', 'HOMBRO', 'elevaciones-frontales'),
  E('Elevaciones frontales en polea', 'Hombro', 'HOMBRO', 'elevaciones-frontales-polea'),
  E('Pájaros', 'Hombro', 'HOMBRO', 'pajaros'),
  E('Pájaros en polea', 'Hombro', 'HOMBRO', 'pajaros-polea'),
  E('Pájaros en máquina', 'Hombro', 'HOMBRO', 'pajaros-maquina'),
  E('Face pull', 'Hombro', 'HOMBRO', 'face-pull'),
  E('Remo al mentón', 'Hombro', 'HOMBRO', 'remo-al-menton'),
  E('Rotación externa en polea', 'Hombro', 'HOMBRO', 'rotacion-externa-polea'),
  E('Curl con barra', 'Bíceps', 'BRAZO', 'curl-barra'),
  E('Curl con barra Z', 'Bíceps', 'BRAZO', 'curl-z'),
  E('Curl con mancuernas', 'Bíceps', 'BRAZO', 'curl-mancuernas'),
  E('Curl alterno', 'Bíceps', 'BRAZO', 'curl-alterno'),
  E('Curl martillo', 'Bíceps', 'BRAZO', 'curl-martillo'),
  E('Curl martillo en polea', 'Bíceps', 'BRAZO', 'curl-martillo-cuerda'),
  E('Curl predicador', 'Bíceps', 'BRAZO', 'curl-predicador'),
  E('Curl predicador con mancuernas', 'Bíceps', 'BRAZO', 'curl-predicador-mancuernas'),
  E('Curl concentrado', 'Bíceps', 'BRAZO', 'curl-concentrado'),
  E('Curl en banco inclinado', 'Bíceps', 'BRAZO', 'curl-inclinado'),
  E('Curl en polea', 'Bíceps', 'BRAZO', 'curl-polea'),
  E('Curl en polea alta', 'Bíceps', 'BRAZO', 'curl-polea-alta'),
  E('Curl inverso', 'Bíceps', 'BRAZO', 'curl-inverso'),
  E('Curl en máquina', 'Bíceps', 'BRAZO', 'curl-maquina'),
  E('Curl araña', 'Bíceps', 'BRAZO', 'curl-arana'),
  E('Curl Zottman', 'Bíceps', 'BRAZO', 'curl-zottman'),
  E('Extensión de tríceps en polea', 'Tríceps', 'BRAZO', 'extension-polea'),
  E('Extensión de tríceps con cuerda', 'Tríceps', 'BRAZO', 'extension-cuerda'),
  E('Extensión con barra V', 'Tríceps', 'BRAZO', 'extension-v'),
  E('Extensión agarre inverso', 'Tríceps', 'BRAZO', 'extension-inversa'),
  E('Extensión sobre la cabeza (cuerda)', 'Tríceps', 'BRAZO', 'extension-sobre-cabeza'),
  E('Press francés', 'Tríceps', 'BRAZO', 'press-frances'),
  E('Rompecráneos (barra Z)', 'Tríceps', 'BRAZO', 'skullcrusher'),
  E('Press banca agarre cerrado', 'Tríceps', 'BRAZO', 'press-cerrado'),
  E('Extensión con mancuerna a dos manos', 'Tríceps', 'BRAZO', 'extension-mancuerna-dos-manos'),
  E('Extensión a un brazo', 'Tríceps', 'BRAZO', 'extension-un-brazo'),
  E('Patada de tríceps', 'Tríceps', 'BRAZO', 'patada-triceps'),
  E('Fondos para tríceps', 'Tríceps', 'BRAZO', 'fondos-triceps'),
  E('Fondos en banco', 'Tríceps', 'BRAZO', 'fondos-banco'),
  E('Fondos en máquina', 'Tríceps', 'BRAZO', 'fondos-maquina'),
  E('Extensión de tríceps en máquina', 'Tríceps', 'BRAZO', 'extension-triceps-maquina'),
  E('Flexiones cerradas', 'Tríceps', 'BRAZO', 'flexiones-cerradas'),
  E('Curl de muñeca', 'Antebrazo', 'BRAZO', 'curl-muneca'),
  E('Curl de muñeca inverso', 'Antebrazo', 'BRAZO', 'curl-muneca-inverso'),
  E('Sentadilla', 'Cuádriceps', 'PIERNA', 'sentadilla'),
  E('Sentadilla frontal', 'Cuádriceps', 'PIERNA', 'sentadilla-frontal'),
  E('Sentadilla sin peso', 'Cuádriceps', 'PIERNA', 'sentadilla-libre'),
  E('Sentadilla con mancuernas', 'Cuádriceps', 'PIERNA', 'sentadilla-mancuernas'),
  E('Sentadilla plié', 'Cuádriceps', 'PIERNA', 'sentadilla-plie'),
  E('Sentadilla hack', 'Cuádriceps', 'PIERNA', 'sentadilla-hack'),
  E('Sentadilla en multipower', 'Cuádriceps', 'PIERNA', 'sentadilla-smith'),
  E('Sentadilla búlgara', 'Cuádriceps', 'PIERNA', 'sentadilla-bulgara'),
  E('Sentadilla con salto', 'Cuádriceps', 'PIERNA', 'sentadilla-salto'),
  E('Prensa de piernas', 'Cuádriceps', 'PIERNA', 'prensa'),
  E('Prensa postura estrecha', 'Cuádriceps', 'PIERNA', 'prensa-estrecha'),
  E('Extensión de cuádriceps', 'Cuádriceps', 'PIERNA', 'extension-cuadriceps'),
  E('Extensión a una pierna', 'Cuádriceps', 'PIERNA', 'extension-una-pierna'),
  E('Zancadas con mancuernas', 'Cuádriceps', 'PIERNA', 'zancadas'),
  E('Zancadas con barra', 'Cuádriceps', 'PIERNA', 'zancadas-barra'),
  E('Zancadas caminando', 'Cuádriceps', 'PIERNA', 'zancadas-caminando'),
  E('Zancada atrás', 'Cuádriceps', 'PIERNA', 'zancada-atras'),
  E('Subida al cajón', 'Cuádriceps', 'PIERNA', 'step-up'),
  E('Curl femoral tumbado', 'Femoral', 'PIERNA', 'curl-femoral'),
  E('Curl femoral sentado', 'Femoral', 'PIERNA', 'curl-femoral-sentado'),
  E('Curl femoral de pie', 'Femoral', 'PIERNA', 'curl-femoral-de-pie'),
  E('Peso muerto rumano', 'Femoral', 'PIERNA', 'peso-muerto-rumano'),
  E('Peso muerto piernas rígidas', 'Femoral', 'PIERNA', 'peso-muerto-piernas-rigidas'),
  E('Peso muerto rumano con mancuernas', 'Femoral', 'PIERNA', 'peso-muerto-rumano-mancuernas'),
  E('Buenos días', 'Femoral', 'PIERNA', 'buenos-dias'),
  E('Hip thrust', 'Glúteo', 'PIERNA', 'hip-thrust'),
  E('Puente de glúteo', 'Glúteo', 'PIERNA', 'puente-gluteo'),
  E('Puente a una pierna', 'Glúteo', 'PIERNA', 'puente-gluteo-una-pierna'),
  E('Patada de glúteo', 'Glúteo', 'PIERNA', 'patada-gluteo'),
  E('Patada de glúteo en polea', 'Glúteo', 'PIERNA', 'patada-gluteo-polea'),
  E('Pull through', 'Glúteo', 'PIERNA', 'pull-through'),
  E('Abductores en máquina', 'Abductores', 'PIERNA', 'abductores'),
  E('Aductores en máquina', 'Aductores', 'PIERNA', 'aductores'),
  E('Gemelos de pie', 'Gemelos', 'PIERNA', 'gemelos-pie'),
  E('Gemelos sentado', 'Gemelos', 'PIERNA', 'gemelos-sentado'),
  E('Gemelos en prensa', 'Gemelos', 'PIERNA', 'gemelos-prensa'),
  E('Gemelos con mancuerna', 'Gemelos', 'PIERNA', 'gemelos-mancuerna'),
  E('Gemelos en multipower', 'Gemelos', 'PIERNA', 'gemelos-smith'),
  E('Plancha', 'Core', 'CORE', 'plancha'),
  E('Plancha lateral', 'Core', 'CORE', 'plancha-lateral'),
  E('Crunch abdominal', 'Core', 'CORE', 'crunch'),
  E('Sit-up', 'Core', 'CORE', 'sit-up'),
  E('Crunch declinado', 'Core', 'CORE', 'crunch-declinado'),
  E('Crunch oblicuo', 'Core', 'CORE', 'crunch-oblicuo'),
  E('Crunch inverso', 'Core', 'CORE', 'crunch-inverso'),
  E('Crunch en polea', 'Core', 'CORE', 'crunch-polea'),
  E('Crunch en máquina', 'Core', 'CORE', 'crunch-maquina'),
  E('Elevaciones de piernas colgado', 'Core', 'CORE', 'elevacion-piernas'),
  E('Elevaciones de piernas en banco', 'Core', 'CORE', 'elevacion-piernas-banco'),
  E('Encogimiento de rodillas', 'Core', 'CORE', 'encogimiento-rodillas'),
  E('Bicicleta abdominal', 'Core', 'CORE', 'bicicleta-abdominal'),
  E('Giro ruso', 'Core', 'CORE', 'giro-ruso'),
  E('Toques de talón', 'Core', 'CORE', 'toques-talon'),
  E('Tijeras', 'Core', 'CORE', 'tijeras'),
  E('Leñador en polea', 'Core', 'CORE', 'lenador-polea'),
  E('Press Pallof', 'Core', 'CORE', 'press-pallof'),
  E('Rueda abdominal', 'Core', 'CORE', 'rueda-abdominal'),
  E('Cinta de correr', 'Cardio', 'CARDIO', 'cinta-correr'),
  E('Bicicleta estática', 'Cardio', 'CARDIO', 'bicicleta'),
  E('Elíptica', 'Cardio', 'CARDIO', 'eliptica'),
  E('Remo máquina', 'Cardio', 'CARDIO', 'remo-maquina'),
  E('Escaladora', 'Cardio', 'CARDIO', 'escaladora'),
  E('Saltar a la comba', 'Cardio', 'CARDIO', 'comba'),
  E('Mountain climbers', 'Cardio', 'CARDIO', 'mountain-climbers'),
  E('Press declinado con mancuernas', 'Pecho', 'PECHO', 'press-declinado-mancuernas'),
  E('Aperturas declinadas', 'Pecho', 'PECHO', 'aperturas-declinadas'),
  E('Press en el suelo con kettlebell', 'Pecho', 'PECHO', 'floor-press-kb'),
  E('Flexiones pliométricas', 'Pecho', 'PECHO', 'flexiones-pliometricas'),
  E('Press de banca con gomas', 'Pecho', 'PECHO', 'banda-press-banca'),
  E('Cruces con gomas', 'Pecho', 'PECHO', 'banda-cruces'),
  E('Remo con kettlebell', 'Espalda', 'ESPALDA', 'remo-kettlebell'),
  E('Remo renegado', 'Espalda', 'ESPALDA', 'remo-renegado'),
  E('Tirón sumo con kettlebell', 'Trapecio', 'ESPALDA', 'tiron-sumo-kb'),
  E('Remo al mentón con goma', 'Trapecio', 'ESPALDA', 'banda-remo-menton'),
  E('Press de hombro con kettlebell', 'Hombro', 'HOMBRO', 'press-kettlebell'),
  E('Thruster con kettlebell', 'Hombro', 'HOMBRO', 'thruster-kb'),
  E('Snatch con kettlebell', 'Hombro', 'HOMBRO', 'snatch-kb'),
  E('Cargada y press', 'Hombro', 'HOMBRO', 'clean-press'),
  E('Press de hombro a un brazo', 'Hombro', 'HOMBRO', 'press-un-brazo'),
  E('Flexiones en pino', 'Hombro', 'HOMBRO', 'flexiones-pino'),
  E('Pull apart con goma', 'Hombro', 'HOMBRO', 'banda-pull-apart'),
  E('Elevaciones laterales con goma', 'Hombro', 'HOMBRO', 'banda-elevaciones-laterales'),
  E('Press de hombros con gomas', 'Hombro', 'HOMBRO', 'banda-press-hombros'),
  E('Rotación externa con goma', 'Hombro', 'HOMBRO', 'banda-rotacion-externa'),
  E('Pájaros con goma', 'Hombro', 'HOMBRO', 'pajaros-goma'),
  E('Rompecráneos con goma', 'Tríceps', 'BRAZO', 'banda-skullcrusher'),
  E('Tríceps sobre cabeza con goma', 'Tríceps', 'BRAZO', 'banda-triceps-cabeza'),
  E('Swing con kettlebell', 'Femoral', 'PIERNA', 'swing-kettlebell'),
  E('Sentadilla goblet', 'Cuádriceps', 'PIERNA', 'goblet-squat'),
  E('Sentadilla frontal con kettlebells', 'Cuádriceps', 'PIERNA', 'sentadilla-frontal-kb'),
  E('Sentadilla pistol con kettlebell', 'Cuádriceps', 'PIERNA', 'pistol-kb'),
  E('Clean con kettlebell', 'Femoral', 'PIERNA', 'clean-kb'),
  E('Peso muerto a una pierna con kettlebell', 'Femoral', 'PIERNA', 'peso-muerto-1-pierna-kb'),
  E('Cargada de potencia', 'Femoral', 'PIERNA', 'power-clean'),
  E('Peso muerto en multipower', 'Femoral', 'PIERNA', 'peso-muerto-smith'),
  E('Curl nórdico (GHR)', 'Femoral', 'PIERNA', 'curl-nordico'),
  E('Sentadilla Zercher', 'Cuádriceps', 'PIERNA', 'sentadilla-zercher'),
  E('Sentadilla a una pierna', 'Cuádriceps', 'PIERNA', 'sentadilla-una-pierna'),
  E('Sentadilla sissy', 'Cuádriceps', 'PIERNA', 'sentadilla-sissy'),
  E('Sentadilla al banco', 'Cuádriceps', 'PIERNA', 'sentadilla-al-banco'),
  E('Salto al cajón', 'Pliométrico', 'PIERNA', 'salto-cajon'),
  E('Salto al cajón lateral', 'Pliométrico', 'PIERNA', 'salto-cajon-lateral'),
  E('Salto con rodillas al pecho', 'Pliométrico', 'PIERNA', 'salto-rodillas-pecho'),
  E('Sentadilla con gomas', 'Cuádriceps', 'PIERNA', 'banda-sentadilla'),
  E('Gemelos con gomas', 'Gemelos', 'PIERNA', 'banda-gemelos'),
  E('Extensión de cadera con goma', 'Glúteo', 'PIERNA', 'banda-extension-cadera'),
  E('Aducción con goma', 'Aductores', 'PIERNA', 'banda-aduccion'),
  E('Paseo del monstruo', 'Abductores', 'PIERNA', 'paseo-monstruo'),
  E('Turkish get-up', 'Core', 'CORE', 'turkish-get-up'),
  E('Molino con kettlebell', 'Core', 'CORE', 'molino-kb'),
  E('Slam con balón medicinal', 'Core', 'CORE', 'slam-balon'),
  E('Rueda con barra (de rodillas)', 'Core', 'CORE', 'rollout-barra'),
  E('Pica colgado', 'Core', 'CORE', 'pica-colgado'),
  E('Dead bug', 'Core', 'CORE', 'dead-bug'),
  E('Crunch cruzado', 'Core', 'CORE', 'crunch-cruzado'),
  E('Navaja (jackknife)', 'Core', 'CORE', 'navaja'),
  E('Vacío abdominal', 'Core', 'CORE', 'vacio-abdominal'),
  E('Bicicleta reclinada', 'Cardio', 'CARDIO', 'bici-reclinada'),
  E('Correr en cinta', 'Cardio', 'CARDIO', 'correr-cinta'),
];

const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function exInfo(name) {
  const k = norm(name.trim());
  return EXERCISE_DB.find(e => norm(e.name) === k) || null;
}

/* ============================================================
   MAZMORRAS — jefes semanales (tu volumen de entrenamiento es el daño)
   ============================================================ */
const BOSSES = [
  { id: 'estatua', name: 'La Estatua del Dios', title: 'El que Sonríe', rank: 'E', mult: 0.80, img: 'img/boss/estatua.png' },
  { id: 'cerberus', name: 'Cerbero', title: 'Guardián del Umbral', rank: 'D', mult: 0.90, img: 'img/boss/cerberus.jpg' },
  { id: 'vulcan', name: 'Vulcan', title: 'Demonio del Castillo', rank: 'D', mult: 0.95, img: 'img/boss/vulcan.jpg' },
  { id: 'igris', name: 'Igris', title: 'Caballero de Sangre', rank: 'C', mult: 1.00, img: 'img/boss/igris.jpg' },
  { id: 'kargalgan', name: 'Kargalgan', title: 'Gran Chamán Orco', rank: 'B', mult: 1.05, img: 'img/boss/kargalgan.jpg' },
  { id: 'baruka', name: 'Baruka', title: 'Líder de los Elfos de Hielo', rank: 'A', mult: 1.12, img: 'img/boss/baruka.jpg' },
  { id: 'beru', name: 'Beru', title: 'Rey de las Hormigas', rank: 'A', mult: 1.20, img: 'img/boss/beru.jpg' },
  { id: 'kamish', name: 'Kamish', title: 'El Dragón de la Calamidad', rank: 'S', mult: 1.35, img: 'img/boss/kamish.jpg' }
];

/* ============================================================
   ITEMS — botín de las mazmorras
   ============================================================ */
const ITEMS = {
  // Consumibles
  'pocion-monarca': { icon: '🧪', name: 'Poción del Monarca', desc: 'Duplica el XP de tu próximo entrenamiento', type: 'consumible' },
  'piedra-bendicion': { icon: '💠', name: 'Piedra de la Bendición', desc: 'Hoy cuenta como día con registro: protege tu racha y te libra del castigo', type: 'consumible' },
  'esencia-mana': { icon: '✨', name: 'Esencia de Maná', desc: '+100 XP al instante', type: 'consumible' },
  // Coleccionables (uno por jefe)
  'reliquia-estatua': { icon: '🗿', name: 'Ojo de la Estatua', desc: 'Trofeo de La Estatua del Dios', type: 'coleccionable' },
  'reliquia-cerberus': { icon: '🔥', name: 'Collar de Cerbero', desc: 'Trofeo de Cerbero', type: 'coleccionable' },
  'reliquia-vulcan': { icon: '🌋', name: 'Núcleo de Vulcan', desc: 'Trofeo de Vulcan', type: 'coleccionable' },
  'reliquia-igris': { icon: '⚔️', name: 'Espada de Igris', desc: 'Trofeo de Igris', type: 'coleccionable' },
  'reliquia-kargalgan': { icon: '🪄', name: 'Bastón de Kargalgan', desc: 'Trofeo de Kargalgan', type: 'coleccionable' },
  'reliquia-baruka': { icon: '❄️', name: 'Hacha de Baruka', desc: 'Trofeo de Baruka', type: 'coleccionable' },
  'reliquia-beru': { icon: '🐜', name: 'Caparazón de Beru', desc: 'Trofeo de Beru', type: 'coleccionable' },
  'reliquia-kamish': { icon: '🐉', name: 'Runa de Kamish', desc: 'Trofeo de Kamish, el Dragón de la Calamidad', type: 'coleccionable' }
};
const CONSUMABLE_IDS = ['pocion-monarca', 'piedra-bendicion', 'esencia-mana'];

const QUOTES = [
  'Levántate.',
  'El cazador más débil ya no existe.',
  'No tengo talento, por eso me esfuerzo más que nadie.',
  'Tu único rival es el tú de ayer.',
  'Los límites existen para romperse.',
  'Un día más en la mazmorra.',
  'La disciplina pesa menos que el arrepentimiento.',
  'El Sistema te observa.',
  'Cada serie te acerca al Rango S.',
  'Lo que hoy te aplasta, mañana lo levantas en calentamiento.'
];

/* ---------- Catálogo de logros ----------
   Las condiciones reciben el contexto de achContext(). */
const ACH_CATS = {
  entreno: 'ENTRENAMIENTO', record: 'RÉCORDS', racha: 'RACHA', nivel: 'NIVEL',
  tonelaje: 'TONELAJE', hazana: 'HAZAÑAS', puerta: 'MAZMORRAS',
  cuerpo: 'CUERPO', dieta: 'DIETA', mision: 'MISIÓN DIARIA'
};

const A = (id, cat, name, desc, cond) => ({ id, cat, name, desc, cond });

const ACHIEVEMENTS = [
  // ENTRENAMIENTO (sesiones completadas)
  A('entreno-1', 'entreno', 'El Despertar', 'Completa tu primer entrenamiento', c => c.workouts >= 1),
  A('entreno-5', 'entreno', 'Sin Excusas', 'Completa 5 entrenamientos', c => c.workouts >= 5),
  A('entreno-10', 'entreno', 'Cazador en Prácticas', 'Completa 10 entrenamientos', c => c.workouts >= 10),
  A('entreno-25', 'entreno', 'Hábito de Acero', 'Completa 25 entrenamientos', c => c.workouts >= 25),
  A('entreno-50', 'entreno', 'Cazador de Élite', 'Completa 50 entrenamientos', c => c.workouts >= 50),
  A('entreno-100', 'entreno', 'Monarca del Hierro', 'Completa 100 entrenamientos', c => c.workouts >= 100),
  A('entreno-200', 'entreno', 'Máquina Imparable', 'Completa 200 entrenamientos', c => c.workouts >= 200),
  A('entreno-365', 'entreno', 'Un Año en la Mazmorra', 'Completa 365 entrenamientos', c => c.workouts >= 365),
  A('entreno-500', 'entreno', 'Leyenda del Gimnasio', 'Completa 500 entrenamientos', c => c.workouts >= 500),
  // RÉCORDS PERSONALES
  A('pr-1', 'record', 'Rompe Límites', 'Consigue tu primer récord personal', c => c.prs >= 1),
  A('pr-5', 'record', 'Más Fuerte que Ayer', 'Consigue 5 récords personales', c => c.prs >= 5),
  A('pr-10', 'record', 'Imparable', 'Consigue 10 récords personales', c => c.prs >= 10),
  A('pr-25', 'record', 'Devorador de Récords', 'Consigue 25 récords personales', c => c.prs >= 25),
  A('pr-50', 'record', 'Leyenda Viviente', 'Consigue 50 récords personales', c => c.prs >= 50),
  A('pr-100', 'record', 'El Techo No Existe', 'Consigue 100 récords personales', c => c.prs >= 100),
  // RACHA (días consecutivos con actividad)
  A('racha-3', 'racha', 'La Primera Chispa', 'Mantén una racha de 3 días', c => c.streak >= 3),
  A('racha-7', 'racha', 'Siete Días en la Mazmorra', 'Mantén una racha de 7 días', c => c.streak >= 7),
  A('racha-14', 'racha', 'Dos Semanas de Hierro', 'Mantén una racha de 14 días', c => c.streak >= 14),
  A('racha-30', 'racha', 'Voluntad Inquebrantable', 'Mantén una racha de 30 días', c => c.streak >= 30),
  A('racha-60', 'racha', 'Sin Días Libres', 'Mantén una racha de 60 días', c => c.streak >= 60),
  A('racha-100', 'racha', 'Cien Amaneceres', 'Mantén una racha de 100 días', c => c.streak >= 100),
  A('racha-180', 'racha', 'Medio Año en Guerra', 'Mantén una racha de 180 días', c => c.streak >= 180),
  A('racha-365', 'racha', 'El Eterno', 'Mantén una racha de 365 días', c => c.streak >= 365),
  // NIVEL
  A('nivel-5', 'nivel', 'Despertar del Poder', 'Alcanza el nivel 5', c => c.level >= 5),
  A('nivel-10', 'nivel', 'Sombra Naciente', 'Alcanza el nivel 10 (Rango D)', c => c.level >= 10),
  A('nivel-15', 'nivel', 'Cazador Reconocido', 'Alcanza el nivel 15', c => c.level >= 15),
  A('nivel-20', 'nivel', 'Doble Despertar', 'Alcanza el nivel 20 (Rango C)', c => c.level >= 20),
  A('nivel-25', 'nivel', 'Élite Nacional', 'Alcanza el nivel 25', c => c.level >= 25),
  A('nivel-30', 'nivel', 'Cazador de Rango Nacional', 'Alcanza el nivel 30 (Rango B)', c => c.level >= 30),
  A('nivel-35', 'nivel', 'Temido por los Gremios', 'Alcanza el nivel 35', c => c.level >= 35),
  A('nivel-40', 'nivel', 'Autoridad de Rango A', 'Alcanza el nivel 40 (Rango A)', c => c.level >= 40),
  A('nivel-45', 'nivel', 'Rozando la Cima', 'Alcanza el nivel 45', c => c.level >= 45),
  A('nivel-50', 'nivel', 'Monarca de las Sombras', 'Alcanza el nivel 50 (Rango S)', c => c.level >= 50),
  A('nivel-60', 'nivel', 'Más Allá del Sistema', 'Alcanza el nivel 60', c => c.level >= 60),
  A('nivel-75', 'nivel', 'Soberano', 'Alcanza el nivel 75', c => c.level >= 75),
  A('nivel-100', 'nivel', 'Dios de la Guerra', 'Alcanza el nivel 100', c => c.level >= 100),
  // TONELAJE ACUMULADO
  A('ton-1', 'tonelaje', 'Primera Tonelada', 'Acumula 1 tonelada levantada', c => c.volume >= 1000),
  A('ton-5', 'tonelaje', 'Grúa Humana', 'Acumula 5 toneladas levantadas', c => c.volume >= 5000),
  A('ton-10', 'tonelaje', 'Excavadora', 'Acumula 10 toneladas levantadas', c => c.volume >= 10000),
  A('ton-25', 'tonelaje', 'Demoledor', 'Acumula 25 toneladas levantadas', c => c.volume >= 25000),
  A('ton-50', 'tonelaje', 'Titán', 'Acumula 50 toneladas levantadas', c => c.volume >= 50000),
  A('ton-100', 'tonelaje', 'Atlas', 'Acumula 100 toneladas levantadas', c => c.volume >= 100000),
  A('ton-250', 'tonelaje', 'Moledor de Mazmorras', 'Acumula 250 toneladas levantadas', c => c.volume >= 250000),
  A('ton-500', 'tonelaje', 'Fuerza Monstruosa', 'Acumula 500 toneladas levantadas', c => c.volume >= 500000),
  A('ton-1000', 'tonelaje', 'Cazador de Dragones', 'Acumula 1.000 toneladas levantadas', c => c.volume >= 1000000),
  // HAZAÑAS
  A('ses-5t', 'hazana', 'Sesión Infernal', 'Levanta 5 toneladas en una sola sesión', c => c.maxSession >= 5000),
  A('ses-10t', 'hazana', 'Modo Berserker', 'Levanta 10 toneladas en una sola sesión', c => c.maxSession >= 10000),
  A('sets-100', 'hazana', 'Cien Series', 'Acumula 100 series', c => c.sets >= 100),
  A('sets-500', 'hazana', 'Quinientas Series', 'Acumula 500 series', c => c.sets >= 500),
  A('sets-1000', 'hazana', 'Mil Series', 'Acumula 1.000 series', c => c.sets >= 1000),
  A('sets-5000', 'hazana', 'Cinco Mil Series', 'Acumula 5.000 series', c => c.sets >= 5000),
  A('reps-1000', 'hazana', 'Mil Repeticiones', 'Acumula 1.000 repeticiones', c => c.reps >= 1000),
  A('reps-5000', 'hazana', 'Cinco Mil Repeticiones', 'Acumula 5.000 repeticiones', c => c.reps >= 5000),
  A('reps-10000', 'hazana', 'Diez Mil Golpes', 'Acumula 10.000 repeticiones', c => c.reps >= 10000),
  A('reps-50000', 'hazana', 'Cincuenta Mil Golpes', 'Acumula 50.000 repeticiones', c => c.reps >= 50000),
  A('ex-5', 'hazana', 'Explorador', 'Entrena 5 ejercicios distintos', c => c.exCount >= 5),
  A('ex-10', 'hazana', 'Arsenal Completo', 'Entrena 10 ejercicios distintos', c => c.exCount >= 10),
  A('ex-20', 'hazana', 'Maestro de Armas', 'Entrena 20 ejercicios distintos', c => c.exCount >= 20),
  A('ex-30', 'hazana', 'Enciclopedia del Hierro', 'Entrena 30 ejercicios distintos', c => c.exCount >= 30),
  A('dias-7', 'hazana', 'Los Siete Días', 'Entrena los 7 días de la semana (acumulado)', c => c.weekdays >= 7),
  A('peso-60', 'hazana', 'Calentando Motores', 'Levanta 60 kg en un ejercicio', c => c.maxPr >= 60),
  A('peso-80', 'hazana', 'Un Disco por Lado', 'Levanta 80 kg en un ejercicio', c => c.maxPr >= 80),
  A('peso-100', 'hazana', 'El Club de los Cien', 'Levanta 100 kg en un ejercicio', c => c.maxPr >= 100),
  A('peso-140', 'hazana', 'Bestia de Carga', 'Levanta 140 kg en un ejercicio', c => c.maxPr >= 140),
  A('peso-180', 'hazana', 'Monstruo', 'Levanta 180 kg en un ejercicio', c => c.maxPr >= 180),
  A('peso-220', 'hazana', 'Sobrehumano', 'Levanta 220 kg en un ejercicio', c => c.maxPr >= 220),
  // CUERPO (registros corporales)
  A('cuerpo-1', 'cuerpo', 'Autoconocimiento', 'Haz tu primer registro corporal', c => c.bodyCount >= 1),
  A('cuerpo-5', 'cuerpo', 'Bajo Control', 'Haz 5 registros corporales', c => c.bodyCount >= 5),
  A('cuerpo-10', 'cuerpo', 'Conócete a Ti Mismo', 'Haz 10 registros corporales', c => c.bodyCount >= 10),
  A('cuerpo-25', 'cuerpo', 'Los Datos Son Poder', 'Haz 25 registros corporales', c => c.bodyCount >= 25),
  A('cuerpo-50', 'cuerpo', 'Escáner del Sistema', 'Haz 50 registros corporales', c => c.bodyCount >= 50),
  A('cuerpo-100', 'cuerpo', 'Biometría Total', 'Haz 100 registros corporales', c => c.bodyCount >= 100),
  // DIETA
  A('dieta-1', 'dieta', 'Combustible', 'Registra tu dieta por primera vez', c => c.dietCount >= 1),
  A('dieta-7', 'dieta', 'Una Semana Limpia', 'Registra tu dieta 7 días', c => c.dietCount >= 7),
  A('dieta-30', 'dieta', 'Disciplina de Acero', 'Registra tu dieta 30 días', c => c.dietCount >= 30),
  A('dieta-60', 'dieta', 'Nutrición de Élite', 'Registra tu dieta 60 días', c => c.dietCount >= 60),
  A('dieta-100', 'dieta', 'Cien Días de Dieta', 'Registra tu dieta 100 días', c => c.dietCount >= 100),
  A('dieta-180', 'dieta', 'Metabolismo de Cazador', 'Registra tu dieta 180 días', c => c.dietCount >= 180),
  A('dieta-365', 'dieta', 'Chef del Sistema', 'Registra tu dieta 365 días', c => c.dietCount >= 365),
  A('prot-1', 'dieta', 'Dosis de Proteína', 'Cumple tu objetivo de proteína 1 día', c => c.protCount >= 1),
  A('prot-7', 'dieta', 'Semana Proteica', 'Cumple tu objetivo de proteína 7 días', c => c.protCount >= 7),
  A('prot-30', 'dieta', 'Constructor de Músculo', 'Cumple tu objetivo de proteína 30 días', c => c.protCount >= 30),
  A('prot-100', 'dieta', 'Fábrica de Músculo', 'Cumple tu objetivo de proteína 100 días', c => c.protCount >= 100),
  // MISIÓN DIARIA (días con las 3 misiones completas)
  A('mision-1', 'mision', 'Primera Misión', 'Completa la misión diaria entera 1 día', c => c.bonusCount >= 1),
  A('mision-7', 'mision', 'Siervo del Sistema', 'Completa la misión diaria 7 días', c => c.bonusCount >= 7),
  A('mision-30', 'mision', 'La Rutina es Poder', 'Completa la misión diaria 30 días', c => c.bonusCount >= 30),
  A('mision-100', 'mision', 'Elegido del Sistema', 'Completa la misión diaria 100 días', c => c.bonusCount >= 100),
  A('mision-365', 'mision', 'El Jugador', 'Completa la misión diaria 365 días', c => c.bonusCount >= 365),
  // MAZMORRAS (jefes semanales y botín)
  A('puerta-1', 'puerta', 'La Primera Puerta', 'Derrota a tu primer jefe semanal', c => c.bossKills >= 1),
  A('puerta-5', 'puerta', 'Asaltante de Puertas', 'Derrota 5 jefes semanales', c => c.bossKills >= 5),
  A('puerta-10', 'puerta', 'Limpiador de Mazmorras', 'Derrota 10 jefes semanales', c => c.bossKills >= 10),
  A('puerta-25', 'puerta', 'Pesadilla de los Jefes', 'Derrota 25 jefes semanales', c => c.bossKills >= 25),
  A('puerta-ciclo', 'puerta', 'Matadragones', 'Derrota a Kamish y completa el ciclo de las 8 Puertas', c => c.bossCycles >= 1),
  A('botin-1', 'puerta', 'Primer Botín', 'Consigue tu primer item', c => c.itemsFound >= 1),
  A('botin-10', 'puerta', 'Saqueador', 'Consigue 10 items', c => c.itemsFound >= 10),
  A('botin-museo', 'puerta', 'Museo del Cazador', 'Reúne las 8 reliquias de los jefes', c => c.collectibles >= 8)
];

/* ---------- Almacenamiento ---------- */
const KEY = 'arise-data-v1';

function defaultData() {
  return {
    profile: { name: '', gender: 'm', createdAt: todayStr() },
    xp: 0,
    stats: { fue: 0, res: 0, dis: 0 },
    maxStreak: 0,
    prCount: 0,
    achOrder: 0,
    workouts: [],      // {id, date, exercises:[{name, sets:[{weight,reps}]}], xp}
    routines: [],      // {id, name, exercises:[{name, sets:[{weight,reps}]}]}
    bodyLog: {},       // {fecha: {weight, fat, pecho, cintura, cadera, brazo, muslo, gemelo}}
    dietLog: {},       // {fecha: {kcal, prot, carb, fat}}
    dietGoals: { kcal: 2200, protein: 140 },
    prs: {},           // {ejercicio: {weight, reps, date}}
    bonusDays: {},     // {fecha: true}
    protDays: {},      // {fecha: true}
    penaltyDays: {},   // {fecha: true} días ya castigados
    penaltyChecked: '',// primera fecha aún sin evaluar (todo lo anterior ya se evaluó)
    specialQuests: {}, // {fecha: {minutes, excess, done, failed}} misiones especiales de cardio
    builder: null,     // entrenamiento/rutina a medias (se restaura al abrir la app)
    dungeons: {},      // {lunesSemana: {bossId, hp, defeated, failed}}
    bossProgress: 0,   // índice de jefe en la campaña (avanza al derrotar; cicla cada 8)
    bossKills: 0,
    inventory: {},     // {itemId: cantidad}
    itemsFound: 0,
    buffs: {},         // {doubleWorkout: true}
    blessedDays: {},   // {fecha: true} días protegidos con Piedra de la Bendición
    sideMissions: {},  // {fecha: true} misiones secundarias completadas
    activeTitle: null, // id del logro cuyo título luce el cazador (null = el último)
    goals: [],         // [{id, type:'lift'|'weight'|'streak', exercise?, start?, target, done}]
    lastBackup: '',    // fecha de la última copia exportada
    photoDays: {},     // {fecha: true} días con foto de progreso (las fotos viven en IndexedDB)
    lastReport: '',    // semana del último informe semanal mostrado
    achievements: {}   // {id: {date, order}}
  };
}

/* Formato antiguo: {name, weight, sets:N, reps} -> {name, sets:[{weight,reps}...]} */
function migrateWorkouts(list) {
  for (const w of list || []) {
    w.exercises = (w.exercises || []).map(ex => Array.isArray(ex.sets)
      ? ex
      : { name: ex.name, sets: Array.from({ length: ex.sets || 1 }, () => ({ weight: ex.weight, reps: ex.reps })) });
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = Object.assign(defaultData(), JSON.parse(raw));
      if (!d.profile.gender) d.profile.gender = 'm';
      migrateWorkouts(d.workouts);
      return d;
    }
  } catch (e) { /* datos corruptos -> empezar de cero */ }
  return defaultData();
}

function save() { localStorage.setItem(KEY, JSON.stringify(data)); }

let data = load();
/* Entrenamiento en curso o rutina en edición (estilo Hevy). Persiste en
   data.builder para no perder nada si se cierra la app a medias.
   { mode:'workout'|'routine', routineId, exercises:[{name, sets:[{weight,reps}]}] } */
let builder = data.builder || null;

/* ---------- Niveles y rangos ---------- */
const xpForNext = level => 100 + (level - 1) * 60;

function levelInfo(xp) {
  let level = 1, rest = xp;
  while (rest >= xpForNext(level)) { rest -= xpForNext(level); level++; }
  return { level, into: rest, need: xpForNext(level) };
}

function rankFor(level) {
  if (level >= 50) return 'S';
  if (level >= 40) return 'A';
  if (level >= 30) return 'B';
  if (level >= 20) return 'C';
  if (level >= 10) return 'D';
  return 'E';
}

/* ---------- Notificaciones ---------- */
function toast(title, msg, cls = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + cls;
  t.innerHTML = '<div class="toast-title">✦ ' + esc(title) + '</div><div class="toast-msg">' + esc(msg) + '</div>';
  $('toasts').appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 4500);
}

/* ---------- Sonido del Sistema ----------
   Se usa el primer archivo snd/levelup.* que cargue (el sonido real de la
   serie); si no hay ninguno, se sintetiza un "ding" con WebAudio. */
const SFX_SOURCES = ['snd/levelup.mp3', 'snd/levelup.m4a', 'snd/levelup.ogg', 'snd/levelup.wav'];
let sfx = null;
(function probeSfx(i) {
  if (i >= SFX_SOURCES.length) return;
  const a = new Audio(SFX_SOURCES[i]);
  a.volume = 0.7;
  a.addEventListener('canplaythrough', () => { sfx = a; }, { once: true });
  a.addEventListener('error', () => probeSfx(i + 1), { once: true });
})(0);
let audioCtx = null;

function playSystemSound() {
  if (sfx) {
    sfx.currentTime = 0;
    sfx.play().catch(() => {});
    return;
  }
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;
    const master = audioCtx.createGain();
    master.gain.value = 0.5;
    master.connect(audioCtx.destination);
    // Arpegio ascendente A5 -> E6 -> A6, con brillo de octava
    [[880, 0, 0.9], [1318.5, 0.12, 0.9], [1760, 0.24, 1.5]].forEach(([f, dt, dur]) => {
      const o = audioCtx.createOscillator();
      o.type = 'sine'; o.frequency.value = f;
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0, t + dt);
      g.gain.linearRampToValueAtTime(0.35, t + dt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + dt + dur);
      o.connect(g); g.connect(master);
      o.start(t + dt); o.stop(t + dt + dur + 0.05);
      const o2 = audioCtx.createOscillator();
      o2.type = 'triangle'; o2.frequency.value = f * 2;
      const g2 = audioCtx.createGain();
      g2.gain.setValueAtTime(0, t + dt);
      g2.gain.linearRampToValueAtTime(0.07, t + dt + 0.02);
      g2.gain.exponentialRampToValueAtTime(0.001, t + dt + dur * 0.7);
      o2.connect(g2); g2.connect(master);
      o2.start(t + dt); o2.stop(t + dt + dur);
    });
  } catch (e) { /* sin audio disponible */ }
}

/* ---------- Cola de pop-ups del Sistema ----------
   Subidas de nivel y logros salen como ventanas emergentes, en orden. */
const popupQueue = [];
let popupActive = false;
let popupTimer = null;

function queuePopup(item) {
  popupQueue.push(item);
  if (!popupActive) nextPopup();
}

function nextPopup() {
  const it = popupQueue.shift();
  if (!it) { popupActive = false; return; }
  popupActive = true;
  playSystemSound();
  if (it.type === 'level') {
    const img = $('lvlImg');
    img.style.display = 'block';
    img.onerror = () => { img.style.display = 'none'; };
    img.src = charImgFor(it.level);
    $('lvlText').textContent = 'NIVEL ' + it.level;
    const r = $('lvlRank');
    if (it.rank) {
      r.style.display = 'block';
      r.innerHTML = 'NUEVO RANGO: <span class="rank-inline rank-' + it.rank + '">' + it.rank + '</span>';
    } else {
      r.style.display = 'none';
    }
    $('levelOverlay').classList.add('show');
  } else if (it.type === 'penalty') {
    const lines = [];
    if (it.days === 1) lines.push('Ayer terminó sin ningún registro.');
    else if (it.days > 1) lines.push(it.days + ' días terminaron sin ningún registro.');
    if (it.specialFails === 1) lines.push('Ignoraste una misión especial de cardio.');
    else if (it.specialFails > 1) lines.push('Ignoraste ' + it.specialFails + ' misiones especiales de cardio.');
    if (it.bossFails) lines.push('La Puerta se cerró y ' + it.bossNames.join(' y ') + (it.bossFails > 1 ? ' escaparon.' : ' escapó.'));
    $('penText').textContent = lines.join(' ');
    $('penLoss').textContent = '−' + fmtNum(it.loss, 0) + ' XP';
    const pl = $('penLevel');
    if (it.levelDown) {
      pl.style.display = 'block';
      pl.textContent = 'HAS BAJADO AL NIVEL ' + it.levelDown;
    } else {
      pl.style.display = 'none';
    }
    $('penaltyOverlay').classList.add('show');
  } else if (it.type === 'special') {
    $('specText').textContent = 'Has superado tu objetivo en ' + fmtNum(it.excess, 0) + ' kcal.';
    $('specMission').textContent = it.minutes + ' MINUTOS DE CARDIO';
    $('specialOverlay').classList.add('show');
  } else if (it.type === 'boss') {
    const img = $('bossPopImg');
    img.style.display = 'block';
    img.onerror = () => { img.style.display = 'none'; };
    img.src = it.boss.img;
    $('bossPopName').textContent = it.boss.name + ' ha caído';
    $('bossPopLoot').innerHTML = it.loot.map(l => l.icon + ' ' + esc(l.name)).join('<br>') + '<br><span class="boss-pop-xp">+' + it.xp + ' XP</span>';
    $('bossOverlay').classList.add('show');
  } else if (it.type === 'report') {
    $('reportLines').innerHTML = it.lines.join('<br>');
    $('reportOverlay').classList.add('show');
  } else {
    $('achPopLabel').textContent = it.label || 'TÍTULO DESBLOQUEADO';
    $('achPopName').textContent = it.name;
    $('achPopDesc').textContent = it.desc;
    $('achOverlay').classList.add('show');
    popupTimer = setTimeout(closePopup, 3400);
  }
}

function closePopup() {
  if (popupTimer) { clearTimeout(popupTimer); popupTimer = null; }
  $('levelOverlay').classList.remove('show');
  $('achOverlay').classList.remove('show');
  $('penaltyOverlay').classList.remove('show');
  $('specialOverlay').classList.remove('show');
  $('bossOverlay').classList.remove('show');
  $('reportOverlay').classList.remove('show');
  nextPopup();
}

function addXp(amount, reason, silent) {
  const before = levelInfo(data.xp);
  data.xp += amount;
  const after = levelInfo(data.xp);
  if (!silent) toast('+' + amount + ' XP', reason);
  if (after.level > before.level) {
    const rb = rankFor(before.level), ra = rankFor(after.level);
    queuePopup({ type: 'level', level: after.level, rank: ra !== rb ? ra : null });
  }
}

/* ---------- Cálculos ---------- */
function exVolume(ex) {
  return ex.sets.reduce((a, s) => a + (s.weight || 0) * (s.reps || 0), 0);
}

function topSet(ex) {
  return ex.sets.reduce((m, s) => (s.weight > m.weight ? s : m), ex.sets[0]);
}

function totalVolume() {
  let v = 0;
  for (const w of data.workouts)
    for (const ex of w.exercises) v += exVolume(ex);
  return v;
}

function activityDates() {
  const s = new Set();
  for (const w of data.workouts) s.add(w.date);
  for (const k of Object.keys(data.bodyLog)) s.add(k);
  for (const k of Object.keys(data.dietLog)) s.add(k);
  for (const k of Object.keys(data.blessedDays || {})) s.add(k); // Piedra de la Bendición
  for (const k of Object.keys(data.photoDays || {})) s.add(k);   // fotos de progreso
  return s;
}

function currentStreak() {
  const days = activityDates();
  const d = new Date();
  if (!days.has(dateStr(d))) d.setDate(d.getDate() - 1); // hoy aún no cuenta en contra
  let streak = 0;
  while (days.has(dateStr(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

function questsDone(date) {
  const train = data.workouts.some(w => w.date === date);
  const body = !!data.bodyLog[date];
  const diet = !!data.dietLog[date];
  return { train, body, diet, all: train && body && diet };
}

function currentTitle() {
  if (data.activeTitle && data.achievements[data.activeTitle]) {
    const a = ACHIEVEMENTS.find(x => x.id === data.activeTitle);
    if (a) return a.name;
  }
  let best = null;
  for (const a of ACHIEVEMENTS) {
    const u = data.achievements[a.id];
    if (u && (!best || u.order > best.order)) best = { order: u.order, name: a.name };
  }
  return best ? best.name : 'Recién Despertado';
}

/* Contadores que alimentan las condiciones de los logros */
function achContext() {
  let sets = 0, reps = 0, maxSession = 0;
  const exNames = new Set(), weekdays = new Set();
  for (const w of data.workouts) {
    weekdays.add(new Date(w.date + 'T12:00:00').getDay());
    let v = 0;
    for (const ex of w.exercises) {
      exNames.add(ex.name.toLowerCase());
      for (const s of ex.sets) { sets++; reps += s.reps; v += s.weight * s.reps; }
    }
    if (v > maxSession) maxSession = v;
  }
  const maxPr = Object.values(data.prs).reduce((m, p) => Math.max(m, p.weight), 0);
  return {
    workouts: data.workouts.length,
    prs: data.prCount || 0,
    streak: data.maxStreak,
    level: levelInfo(data.xp).level,
    volume: totalVolume(),
    sets, reps, maxSession,
    exCount: exNames.size,
    weekdays: weekdays.size,
    maxPr,
    bodyCount: Object.keys(data.bodyLog).length,
    dietCount: Object.keys(data.dietLog).length,
    protCount: Object.keys(data.protDays).length,
    bonusCount: Object.keys(data.bonusDays).length,
    bossKills: data.bossKills || 0,
    bossCycles: Math.floor((data.bossProgress || 0) / BOSSES.length),
    itemsFound: data.itemsFound || 0,
    collectibles: Object.keys(data.inventory || {}).filter(id => ITEMS[id] && ITEMS[id].type === 'coleccionable').length
  };
}

function checkAchievements() {
  let unlocked = true, guard = 0;
  while (unlocked && guard < 4) {
    unlocked = false; guard++;
    const c = achContext();
    for (const a of ACHIEVEMENTS) {
      if (!data.achievements[a.id] && a.cond(c)) {
        data.achOrder++;
        data.achievements[a.id] = { date: todayStr(), order: data.achOrder };
        queuePopup({ type: 'ach', name: a.name, desc: a.desc });
        addXp(XP.achievement, 'Título: ' + a.name, true);
        unlocked = true;
      }
    }
  }
}

/* ---------- Puerta semanal (mazmorra) ---------- */
function mondayOf(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - (x.getDay() + 6) % 7); // retrocede hasta el lunes
  return x;
}
const weekKeyOf = d => dateStr(mondayOf(d));
const currentWeekKey = () => weekKeyOf(new Date());

/* Volumen medio de las últimas 4 semanas cerradas: base para la vida del jefe */
function avgWeeklyVolume() {
  const sums = {};
  const cw = currentWeekKey();
  for (const w of data.workouts) {
    const wk = weekKeyOf(new Date(w.date + 'T12:00:00'));
    if (wk === cw) continue;
    sums[wk] = (sums[wk] || 0) + w.exercises.reduce((a, ex) => a + exVolume(ex), 0);
  }
  const vals = Object.keys(sums).sort().slice(-4).map(k => sums[k]);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

function ensureDungeon() {
  const wk = currentWeekKey();
  if (data.dungeons[wk]) return data.dungeons[wk];
  const boss = BOSSES[data.bossProgress % BOSSES.length];
  const cycle = Math.floor(data.bossProgress / BOSSES.length);
  const base = avgWeeklyVolume() || 6000;
  const hp = Math.max(4000, Math.round(base * boss.mult * (1 + 0.15 * cycle) / 100) * 100);
  data.dungeons[wk] = { bossId: boss.id, hp, defeated: false, failed: false };
  save();
  return data.dungeons[wk];
}

/* Daño infligido al jefe = volumen levantado en la semana */
function dungeonDamage(wk) {
  let v = 0;
  for (const w of data.workouts)
    if (weekKeyOf(new Date(w.date + 'T12:00:00')) === wk)
      v += w.exercises.reduce((a, ex) => a + exVolume(ex), 0);
  return v;
}

function addItem(id, n) {
  data.inventory[id] = (data.inventory[id] || 0) + (n || 1);
  data.itemsFound += (n || 1);
}

/* ¿Ha caído el jefe de esta semana? (se llama tras cada evento) */
function checkDungeon() {
  const wk = currentWeekKey();
  const dg = ensureDungeon();
  if (dg.defeated || dungeonDamage(wk) < dg.hp) return;
  dg.defeated = true;
  const boss = BOSSES.find(b => b.id === dg.bossId) || BOSSES[0];
  const tier = BOSSES.indexOf(boss) + 1;
  data.bossProgress++;
  data.bossKills = (data.bossKills || 0) + 1;
  const xp = 100 + tier * 25;
  const relic = 'reliquia-' + boss.id;
  const consumable = CONSUMABLE_IDS[(data.bossKills + tier) % CONSUMABLE_IDS.length];
  addItem(relic, 1);
  addItem(consumable, 1);
  addXp(xp, 'Jefe derrotado: ' + boss.name, true);
  queuePopup({ type: 'boss', boss, xp, loot: [ITEMS[relic], ITEMS[consumable]] });
}

/* ---------- Inventario ---------- */
function useItem(id) {
  if (!data.inventory[id]) return;
  const it = ITEMS[id];
  if (!it || it.type !== 'consumible') return;
  if (id === 'pocion-monarca') {
    if (data.buffs.doubleWorkout) { toast('SISTEMA', 'Ya tienes una poción activa', 'toast-danger'); return; }
    data.buffs.doubleWorkout = true;
    toast('SISTEMA', 'Poción del Monarca activa: tu próximo entrenamiento dará XP doble');
  } else if (id === 'piedra-bendicion') {
    if (activityDates().has(todayStr())) { toast('SISTEMA', 'Hoy ya cuenta como día con registro: guárdala para otro día', 'toast-danger'); return; }
    data.blessedDays[todayStr()] = true;
    toast('SISTEMA', 'La Bendición te protege: hoy cuenta como día con registro');
  } else if (id === 'esencia-mana') {
    addXp(100, 'Esencia de Maná consumida');
  }
  data.inventory[id]--;
  if (data.inventory[id] <= 0) delete data.inventory[id];
  afterEvent();
}

/* ---------- Castigo del Sistema ----------
   Cada día completo que termina sin NINGÚN registro (entreno, peso o dieta)
   cuenta como misión diaria fallida: -50 XP por día. Se evalúa al abrir la app. */
function checkPenalties() {
  const today = todayStr();
  if (!data.profile.name || !data.penaltyChecked) {
    // cuenta nueva o regla recién estrenada: empezar a contar desde hoy
    data.penaltyChecked = today;
    save();
    return;
  }
  if (data.penaltyChecked >= today) return;
  const days = activityDates();
  let missed = 0, specialFails = 0;
  const d = new Date(data.penaltyChecked + 'T12:00:00');
  const lim = new Date(today + 'T12:00:00');
  while (d < lim) {
    const ds = dateStr(d);
    if (!days.has(ds) && !data.penaltyDays[ds]) {
      data.penaltyDays[ds] = true;
      missed++;
    }
    const q = data.specialQuests[ds];
    if (q && !q.done && !q.failed) {
      q.failed = true;
      specialFails++;
    }
    d.setDate(d.getDate() + 1);
  }
  data.penaltyChecked = today;
  // Puertas de semanas pasadas que se cerraron con el jefe vivo
  let bossFails = 0;
  const bossNames = [];
  const cw = currentWeekKey();
  for (const wk of Object.keys(data.dungeons || {})) {
    const dg = data.dungeons[wk];
    if (wk < cw && !dg.defeated && !dg.failed) {
      dg.failed = true;
      bossFails++;
      const b = BOSSES.find(x => x.id === dg.bossId);
      if (b) bossNames.push(b.name);
    }
  }
  if (missed > 0 || specialFails > 0 || bossFails > 0) {
    const before = levelInfo(data.xp).level;
    const loss = XP.penalty * (missed + specialFails + bossFails);
    data.xp = Math.max(0, data.xp - loss);
    const after = levelInfo(data.xp).level;
    queuePopup({ type: 'penalty', days: missed, specialFails, bossFails, bossNames, loss, levelDown: after < before ? after : null });
  }
  save();
}

/* Tras cualquier evento que cambie datos: racha, bonus diario, logros, guardar y pintar */
function afterEvent() {
  const s = currentStreak();
  if (s > data.maxStreak) data.maxStreak = s;
  const t = todayStr();
  if (!data.bonusDays[t] && questsDone(t).all) {
    data.bonusDays[t] = true;
    data.stats.dis++;
    addXp(XP.bonus, 'Misión diaria completada');
  }
  checkDungeon();
  checkGoals();
  checkAchievements();
  save();
  renderAll();
}

/* ============================================================
   ENTRENAMIENTO — sesión en curso
   ============================================================ */

/* Últimas series registradas de un ejercicio (la "columna anterior" de Hevy) */
function lastSetsFor(name) {
  const key = name.trim().toLowerCase();
  const sorted = data.workouts.slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  for (const w of sorted)
    for (const ex of w.exercises)
      if (ex.name.toLowerCase() === key)
        return ex.sets.map(s => ({ weight: s.weight, reps: s.reps }));
  return null;
}

function persistBuilder() { data.builder = builder; save(); }

/* Convierte ejercicios editables en datos limpios; null si no hay nada válido */
function cleanExercises(list) {
  const cleaned = [];
  for (const ex of list || []) {
    const sets = ex.sets
      .map(s => ({ weight: parseNum(s.weight), reps: Math.round(parseNum(s.reps)) }))
      .filter(s => s.weight >= 0 && s.reps >= 1);
    if (ex.name.trim() && sets.length) cleaned.push({ name: ex.name.trim(), sets });
  }
  return cleaned.length ? cleaned : null;
}

/* ¿Hay algo a medias que merezca confirmación antes de pisarlo? */
function builderBusy() {
  return builder && builder.exercises.length > 0;
}

function startEmptyWorkout() {
  if (builderBusy() && !confirm('Hay un entrenamiento o rutina a medias. ¿Descartarlo?')) return;
  builder = { mode: 'workout', routineId: null, exercises: [], startedAt: Date.now(), note: '' };
  persistBuilder();
  renderTrain();
  openPicker();
}

function startRoutine(id) {
  const r = data.routines.find(x => x.id === id);
  if (!r) return;
  if (builderBusy() && !confirm('Hay un entrenamiento o rutina a medias. ¿Descartarlo y empezar "' + r.name + '"?')) return;
  // Cada ejercicio se prefija con las series de tu última sesión (si existen)
  builder = {
    mode: 'workout', routineId: null, startedAt: Date.now(), note: '',
    exercises: r.exercises.map(ex => ({
      name: ex.name,
      sets: (lastSetsFor(ex.name) || ex.sets).map(s => ({ ...s }))
    }))
  };
  persistBuilder();
  renderTrain();
  toast('SISTEMA', 'Rutina "' + r.name + '" en marcha. ¡A por ello!');
}

function newRoutine() {
  if (builderBusy() && !confirm('Hay un entrenamiento o rutina a medias. ¿Descartarlo?')) return;
  builder = { mode: 'routine', routineId: null, exercises: [] };
  persistBuilder();
  renderTrain();
  openPicker();
}

function editRoutine(id) {
  const r = data.routines.find(x => x.id === id);
  if (!r) return;
  if (builderBusy() && !confirm('Hay un entrenamiento o rutina a medias. ¿Descartarlo?')) return;
  builder = {
    mode: 'routine', routineId: id,
    exercises: r.exercises.map(ex => ({ name: ex.name, sets: ex.sets.map(s => ({ ...s })) }))
  };
  persistBuilder();
  renderTrain();
}

function discardBuilder() {
  if (builderBusy() && !confirm(builder.mode === 'workout'
    ? '¿Descartar el entrenamiento en curso?'
    : '¿Descartar los cambios de la rutina?')) return;
  builder = null;
  persistBuilder();
  renderTrain();
}

function addExerciseToBuilder(name) {
  if (!builder) return;
  const sets = builder.mode === 'workout'
    ? (lastSetsFor(name) || [{ weight: '', reps: '' }])
    : [{ weight: '', reps: '' }, { weight: '', reps: '' }, { weight: '', reps: '' }];
  builder.exercises.push({ name, sets: sets.map(s => ({ ...s })) });
  persistBuilder();
  renderTrain();
}

function editWorkout(id) {
  const w = data.workouts.find(x => x.id === id);
  if (!w) return;
  if (builderBusy() && !confirm('Hay un entrenamiento o rutina a medias. ¿Descartarlo para editar este entreno?')) return;
  builder = {
    mode: 'edit', workoutId: id, routineId: null, startedAt: null,
    note: w.note || '',
    exercises: w.exercises.map(ex => ({ name: ex.name, sets: ex.sets.map(s => ({ ...s })) }))
  };
  persistBuilder();
  renderTrain();
  window.scrollTo(0, 0);
  toast('SISTEMA', 'Editando el entrenamiento del ' + fmtDate(w.date) + '. El XP no cambia.');
}

function finishWorkout() {
  if (!builder || (builder.mode !== 'workout' && builder.mode !== 'edit')) return;
  const cleaned = cleanExercises(builder.exercises);
  if (!cleaned) {
    toast('SISTEMA', 'Añade al menos un ejercicio con una serie completa (kg y reps)', 'toast-danger');
    return;
  }
  if (builder.mode === 'edit') {
    const w = data.workouts.find(x => x.id === builder.workoutId);
    if (w) {
      w.exercises = cleaned;
      w.note = (builder.note || '').trim();
      recalcPRs();
    }
    builder = null;
    data.builder = null;
    save();
    renderAll();
    toast('SISTEMA', 'Entrenamiento corregido y récords recalculados');
    return;
  }
  const date = todayStr();
  let prCount = 0;
  for (const ex of cleaned) {
    const top = topSet(ex);
    const prev = data.prs[ex.name];
    if (!prev || top.weight > prev.weight) {
      data.prs[ex.name] = { weight: top.weight, reps: top.reps, date };
      data.prCount++;
      data.stats.fue++;
      prCount++;
      toast('¡NUEVO RÉCORD!', ex.name + ' — ' + fmtNum(top.weight) + ' kg', 'toast-gold');
    }
  }
  let xp = XP.workout + Math.min(cleaned.length, XP.perExerciseCap) * XP.perExercise + prCount * XP.pr;
  if (data.buffs.doubleWorkout) {
    xp *= 2;
    delete data.buffs.doubleWorkout;
    toast('PODER DEL MONARCA', 'XP del entrenamiento duplicado por la poción', 'toast-gold');
  }
  const dur = builder.startedAt ? Math.max(1, Math.round((Date.now() - builder.startedAt) / 60000)) : null;
  const note = (builder.note || '').trim();
  cancelRest();
  data.workouts.push({ id: Date.now(), date, exercises: cleaned, xp, dur, note });
  data.stats.res++;
  builder = null;
  data.builder = null;
  addXp(xp, 'Entrenamiento completado');
  afterEvent();
}

function deleteWorkout(id) {
  if (!confirm('¿Eliminar esta sesión? El XP ganado no se devuelve.')) return;
  data.workouts = data.workouts.filter(w => w.id !== id);
  recalcPRs();
  save();
  renderAll();
}

function recalcPRs() {
  data.prs = {};
  const sorted = data.workouts.slice().sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  for (const w of sorted)
    for (const ex of w.exercises) {
      const top = topSet(ex);
      const prev = data.prs[ex.name];
      if (!prev || top.weight > prev.weight) data.prs[ex.name] = { weight: top.weight, reps: top.reps, date: w.date };
    }
}

/* ---------- Temporizador de descanso entre series ---------- */
let restInterval = null, restEnd = 0;

function startRest(seconds) {
  clearInterval(restInterval);
  restEnd = Date.now() + seconds * 1000;
  const tick = () => {
    const left = Math.ceil((restEnd - Date.now()) / 1000);
    if (left <= 0) {
      cancelRest();
      playSystemSound();
      toast('SISTEMA', '¡Descanso terminado: a la siguiente serie!');
      return;
    }
    $('restDisplay').textContent = '⏱ ' + Math.floor(left / 60) + ':' + pad(left % 60);
  };
  tick();
  restInterval = setInterval(tick, 250);
}

function cancelRest() {
  clearInterval(restInterval);
  restInterval = null;
  if ($('restDisplay')) $('restDisplay').textContent = '';
}

/* ---------- Render del módulo de entrenamiento ---------- */
function renderTrain() {
  const home = $('trainHome');
  const bw = $('builderWindow');
  if (!builder) {
    home.style.display = '';
    bw.style.display = 'none';
    const list = data.routines.map(r => {
      const nSets = r.exercises.reduce((a, ex) => a + ex.sets.length, 0);
      return '<div class="routine-card">' +
        '<div class="routine-info"><b>' + esc(r.name) + '</b>' +
        '<span>' + r.exercises.length + ' ejercicios · ' + nSets + ' series</span>' +
        '<span class="routine-ex">' + r.exercises.map(e => esc(e.name)).join(' · ') + '</span></div>' +
        '<div class="routine-actions">' +
        '<button class="btn primary r-start" data-id="' + r.id + '">▶ EMPEZAR</button>' +
        '<button class="btn r-edit" data-id="' + r.id + '">EDITAR</button>' +
        '<button class="btn r-dup" data-id="' + r.id + '" title="Duplicar rutina">⧉</button>' +
        '<button class="btn danger r-del" data-id="' + r.id + '" title="Eliminar rutina">✕</button></div>' +
        '</div>';
    }).join('');
    $('routineList').innerHTML = list ||
      '<div class="empty">Aún no tienes rutinas. Crea una o empieza un entrenamiento vacío.</div>';
    $('routineList').querySelectorAll('.r-start').forEach(b => b.onclick = () => startRoutine(+b.dataset.id));
    $('routineList').querySelectorAll('.r-edit').forEach(b => b.onclick = () => editRoutine(+b.dataset.id));
    $('routineList').querySelectorAll('.r-dup').forEach(b => b.onclick = () => {
      const r = data.routines.find(x => x.id === +b.dataset.id);
      if (!r) return;
      data.routines.push({
        id: Date.now(),
        name: r.name + ' (copia)',
        exercises: r.exercises.map(ex => ({ name: ex.name, sets: ex.sets.map(s => ({ ...s })) }))
      });
      save();
      renderTrain();
      toast('SISTEMA', 'Rutina duplicada: ' + r.name + ' (copia)');
    });
    $('routineList').querySelectorAll('.r-del').forEach(b => b.onclick = () => deleteRoutine(+b.dataset.id));
    return;
  }
  home.style.display = 'none';
  bw.style.display = '';
  $('builderTitle').textContent = builder.mode === 'workout'
    ? '✦ ENTRENAMIENTO EN CURSO'
    : builder.mode === 'edit'
      ? '✦ CORREGIR ENTRENAMIENTO'
      : (builder.routineId ? '✦ EDITAR RUTINA' : '✦ NUEVA RUTINA');
  $('btnFinish').style.display = builder.mode === 'routine' ? 'none' : '';
  $('btnFinish').textContent = builder.mode === 'edit' ? '✔ GUARDAR CAMBIOS' : '⚔ COMPLETAR ENTRENAMIENTO';
  $('btnSaveRoutine').textContent = builder.mode === 'routine' ? '✦ GUARDAR RUTINA' : '✦ GUARDAR COMO RUTINA';
  $('btnSaveRoutine').className = builder.mode === 'routine' ? 'btn primary big' : 'btn big';
  $('workoutExtras').style.display = builder.mode === 'routine' ? 'none' : '';
  if (builder.mode !== 'routine') {
    $('workoutNote').value = builder.note || '';
    updateBuildTimer();
  }
  renderBuilderCards();
}

function updateBuildTimer() {
  const el = $('buildTimer');
  if (!builder || builder.mode !== 'workout' || !builder.startedAt) { el.textContent = ''; return; }
  const total = Math.floor((Date.now() - builder.startedAt) / 1000);
  el.textContent = '⏱ ' + Math.floor(total / 60) + ':' + pad(total % 60);
}

function renderBuilderCards() {
  const wrap = $('builderCards');
  wrap.innerHTML = builder.exercises.map((ex, i) => {
    const info = exInfo(ex.name);
    const prev = lastSetsFor(ex.name);
    const thumb = info
      ? '<img class="ex-thumb" src="' + info.img + '" alt="" loading="lazy">'
      : '<div class="ex-thumb ph">⚔</div>';
    const chip = '<span class="group-chip">' + (info ? info.group : 'Personalizado') + '</span>';
    const rows = ex.sets.map((s, j) => {
      const hint = prev && prev[j] ? fmtNum(prev[j].weight) + ' kg × ' + prev[j].reps : '—';
      return '<div class="set-row">' +
        '<span class="set-num">' + (j + 1) + '</span>' +
        '<span class="set-prev">' + hint + '</span>' +
        '<input type="number" min="0" step="0.5" inputmode="decimal" placeholder="kg" class="set-w" data-i="' + i + '" data-j="' + j + '" value="' + (s.weight === '' ? '' : s.weight) + '">' +
        '<input type="number" min="1" step="1" inputmode="numeric" placeholder="reps" class="set-r" data-i="' + i + '" data-j="' + j + '" value="' + (s.reps === '' ? '' : s.reps) + '">' +
        '<button class="set-x" data-i="' + i + '" data-j="' + j + '" title="Quitar serie">✕</button></div>';
    }).join('');
    return '<div class="ex-card">' +
      '<div class="ex-head">' + thumb +
      '<div class="ex-head-info"><b>' + esc(ex.name) + '</b>' + chip + '</div>' +
      '<button class="ex-mv" data-i="' + i + '" data-d="-1" title="Subir">↑</button>' +
      '<button class="ex-mv" data-i="' + i + '" data-d="1" title="Bajar">↓</button>' +
      '<button class="ex-x" data-i="' + i + '" title="Quitar ejercicio">✕</button></div>' +
      '<div class="set-head"><span>SERIE</span><span>ANTERIOR</span><span>KG</span><span>REPS</span><span></span></div>' +
      rows +
      '<button class="btn add-set" data-i="' + i + '">+ SERIE</button>' +
      '</div>';
  }).join('') || '<div class="empty">Añade tu primer ejercicio.</div>';

  wrap.querySelectorAll('.set-w').forEach(inp => inp.oninput = () => {
    builder.exercises[+inp.dataset.i].sets[+inp.dataset.j].weight = inp.value;
    updateBuilderSummary();
    persistBuilder();
  });
  wrap.querySelectorAll('.set-r').forEach(inp => inp.oninput = () => {
    builder.exercises[+inp.dataset.i].sets[+inp.dataset.j].reps = inp.value;
    updateBuilderSummary();
    persistBuilder();
  });
  wrap.querySelectorAll('.set-x').forEach(b => b.onclick = () => {
    const ex = builder.exercises[+b.dataset.i];
    ex.sets.splice(+b.dataset.j, 1);
    if (!ex.sets.length) builder.exercises.splice(+b.dataset.i, 1);
    persistBuilder();
    renderTrain();
  });
  wrap.querySelectorAll('.ex-x').forEach(b => b.onclick = () => {
    builder.exercises.splice(+b.dataset.i, 1);
    persistBuilder();
    renderTrain();
  });
  wrap.querySelectorAll('.ex-mv').forEach(b => b.onclick = () => {
    const i = +b.dataset.i, j = i + (+b.dataset.d);
    if (j < 0 || j >= builder.exercises.length) return;
    const tmp = builder.exercises[i];
    builder.exercises[i] = builder.exercises[j];
    builder.exercises[j] = tmp;
    persistBuilder();
    renderTrain();
  });
  wrap.querySelectorAll('.add-set').forEach(b => b.onclick = () => {
    const ex = builder.exercises[+b.dataset.i];
    const last = ex.sets[ex.sets.length - 1];
    ex.sets.push({ weight: last ? last.weight : '', reps: last ? last.reps : '' });
    persistBuilder();
    renderTrain();
  });

  updateBuilderSummary();
}

function updateBuilderSummary() {
  if (!builder || !builder.exercises.length) { $('sessionSummary').textContent = ''; return; }
  let vol = 0, nSets = 0;
  for (const ex of builder.exercises)
    for (const s of ex.sets) {
      nSets++;
      const w = parseNum(s.weight), r = parseNum(s.reps);
      if (w >= 0 && r >= 1) vol += w * r;
    }
  $('sessionSummary').textContent =
    builder.exercises.length + ' ejercicio' + (builder.exercises.length > 1 ? 's' : '') +
    ' · ' + nSets + ' series · ' + fmtNum(vol, 0) + ' kg de volumen';
}

/* ---------- Selector de ejercicios (con imagen y grupo muscular) ---------- */
let pickerCat = 'TODOS';

function openPicker() {
  if (!builder) return;
  pickerCat = 'TODOS';
  $('pickerInput').value = '';
  renderPicker();
  $('pickerOverlay').classList.add('show');
  $('pickerInput').focus();
}

function renderPicker() {
  $('pickerChips').innerHTML = EX_CATS.map(c =>
    '<button class="chip' + (c === pickerCat ? ' active' : '') + '" data-c="' + c + '">' + c + '</button>'
  ).join('');
  $('pickerChips').querySelectorAll('.chip').forEach(b => b.onclick = () => {
    pickerCat = b.dataset.c;
    renderPicker();
  });
  const q = norm($('pickerInput').value.trim());
  const list = EXERCISE_DB.filter(e =>
    (pickerCat === 'TODOS' || e.cat === pickerCat) && (!q || norm(e.name).includes(q)));
  const inBuilder = new Set((builder ? builder.exercises : []).map(ex => norm(ex.name)));
  $('pickerList').innerHTML = list.map(e => {
    const added = inBuilder.has(norm(e.name));
    return '<div class="pick-row' + (added ? ' added' : '') + '" data-n="' + esc(e.name) + '">' +
      '<img src="' + e.img + '" alt="" loading="lazy">' +
      '<div class="pick-info"><div class="pick-name">' + esc(e.name) + '</div>' +
      '<div class="pick-group">' + e.group + '</div></div>' +
      '<span class="pick-add">' + (added ? '✔' : '+') + '</span></div>';
  }).join('') || '<div class="empty">Nada con ese nombre. Añádelo abajo como personalizado.</div>';
  $('pickerList').querySelectorAll('.pick-row').forEach(r => r.onclick = () => {
    addExerciseToBuilder(r.dataset.n);
    renderPicker();
  });
}

function addCustomExercise() {
  const name = $('customExName').value.trim();
  if (!name) { $('customExName').focus(); return; }
  addExerciseToBuilder(name);
  $('customExName').value = '';
  renderPicker();
  toast('SISTEMA', '"' + name + '" añadido a la sesión');
}

/* ---------- Rutinas: guardado ---------- */
function deleteRoutine(id) {
  const r = data.routines.find(x => x.id === id);
  if (!r || !confirm('¿Eliminar la rutina "' + r.name + '"?')) return;
  data.routines = data.routines.filter(x => x.id !== id);
  save();
  renderTrain();
}

function openRoutineModal() {
  if (!builder || !cleanExercises(builder.exercises)) {
    toast('SISTEMA', 'Añade ejercicios con kg y reps antes de guardar', 'toast-danger');
    return;
  }
  const existing = builder.routineId ? data.routines.find(r => r.id === builder.routineId) : null;
  $('routineName').value = existing ? existing.name : '';
  $('routineOverlay').classList.add('show');
  $('routineName').focus();
}

function confirmSaveRoutine() {
  const name = $('routineName').value.trim();
  if (!name) { $('routineName').focus(); return; }
  const cleaned = cleanExercises(builder ? builder.exercises : null);
  if (!cleaned) { $('routineOverlay').classList.remove('show'); return; }
  let target = builder.routineId ? data.routines.find(r => r.id === builder.routineId) : null;
  if (!target) {
    const byName = data.routines.find(r => r.name.toLowerCase() === name.toLowerCase());
    if (byName && !confirm('Ya existe la rutina "' + byName.name + '". ¿Actualizarla?')) return;
    target = byName || null;
  }
  if (target) {
    target.name = name;
    target.exercises = cleaned;
  } else {
    data.routines.push({ id: Date.now(), name, exercises: cleaned });
  }
  if (builder.mode === 'routine') builder = null; // editor: al guardar, volver al inicio
  data.builder = builder;
  save();
  $('routineOverlay').classList.remove('show');
  renderTrain();
  toast('SISTEMA', 'Rutina "' + name + '" guardada');
}

/* ============================================================
   ENTRENAMIENTO — historial, récords y progresión
   ============================================================ */
function renderPRs() {
  const entries = Object.entries(data.prs).sort((a, b) => b[1].weight - a[1].weight);
  $('prBody').innerHTML = entries.map(([name, pr]) =>
    '<tr><td>' + esc(name) + '</td><td class="pr-weight">' + fmtNum(pr.weight) + ' kg × ' + pr.reps + '</td>' +
    '<td>' + fmtNum(est1RM(pr.weight, pr.reps), 1) + ' kg</td><td>' + fmtDate(pr.date) + '</td></tr>'
  ).join('');
  $('prEmpty').style.display = entries.length ? 'none' : 'block';
}

let histAll = false;
function renderHistory() {
  const q = norm($('histSearch').value.trim());
  let all = data.workouts.slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  if (q) all = all.filter(w => w.exercises.some(ex => norm(ex.name).includes(q)) || (w.note && norm(w.note).includes(q)));
  const list = histAll ? all : all.slice(0, 12);
  if (!list.length) {
    $('historyList').innerHTML = '<div class="empty">' + (q ? 'Nada con "' + esc($('histSearch').value) + '" en el historial.' : 'Todavía no hay sesiones registradas.') + '</div>';
    return;
  }
  $('historyList').innerHTML = list.map(w => {
    const vol = w.exercises.reduce((a, ex) => a + exVolume(ex), 0);
    const body = w.exercises.map(ex =>
      esc(ex.name) + ' (' + ex.sets.map(s => fmtNum(s.weight) + '×' + s.reps).join(', ') + ')'
    ).join('  —  ');
    return '<div class="hist-item"><div class="hist-head"><b>' + fmtDate(w.date) + '</b>' +
      '<span class="hist-meta">' + w.exercises.length + ' ejercicios · ' + fmtNum(vol, 0) + ' kg' +
      (w.dur ? ' · ' + w.dur + ' min' : '') + ' · +' + w.xp + ' XP</span>' +
      '<button class="hist-edit" data-id="' + w.id + '" title="Corregir sesión">✎</button>' +
      '<button class="hist-del" data-id="' + w.id + '" title="Eliminar sesión">✕</button></div>' +
      '<div class="hist-body">' + body + '</div>' +
      (w.note ? '<div class="hist-note">📝 ' + esc(w.note) + '</div>' : '') +
      '</div>';
  }).join('') + (all.length > 12
    ? '<button class="btn" id="btnHistAll">' + (histAll ? 'VER MENOS' : 'VER TODO (' + all.length + ')') + '</button>'
    : '');
  $('historyList').querySelectorAll('.hist-del').forEach(b => b.onclick = () => deleteWorkout(+b.dataset.id));
  $('historyList').querySelectorAll('.hist-edit').forEach(b => b.onclick = () => editWorkout(+b.dataset.id));
  const ha = $('btnHistAll');
  if (ha) ha.onclick = () => { histAll = !histAll; renderHistory(); };
}

function renderExerciseChart() {
  const names = [...new Set(data.workouts.flatMap(w => w.exercises.map(ex => ex.name)))].sort((a, b) => a.localeCompare(b, 'es'));
  const sel = $('exSelect');
  const prev = sel.value;
  sel.innerHTML = names.map(n => '<option' + (n === prev ? ' selected' : '') + '>' + esc(n) + '</option>').join('');
  const chosen = sel.value;
  if (!chosen) {
    $('exChart').innerHTML = '<div class="empty">Registra entrenamientos para ver tu progresión.</div>';
    return;
  }
  const metric = $('metricSelect').value; // max | 1rm | vol
  const byDate = {};
  for (const w of data.workouts)
    for (const ex of w.exercises)
      if (ex.name === chosen) {
        if (metric === 'vol') {
          byDate[w.date] = (byDate[w.date] || 0) + exVolume(ex);
        } else {
          const v = ex.sets.reduce((m, s) => Math.max(m, metric === '1rm' ? est1RM(s.weight, s.reps) : s.weight), 0);
          byDate[w.date] = Math.max(byDate[w.date] || 0, v);
        }
      }
  const series = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value: Math.round(value * 10) / 10 }));
  renderLineChart($('exChart'), series, 'kg');
}

/* ---------- Fotos de progreso (IndexedDB: no caben en localStorage) ---------- */
const photoDB = {
  open: () => new Promise((res, rej) => {
    const r = indexedDB.open('arise-photos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('photos', { keyPath: 'id' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }),
  put: async rec => {
    const db = await photoDB.open();
    return new Promise((res, rej) => {
      const tx = db.transaction('photos', 'readwrite');
      tx.objectStore('photos').put(rec);
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
  },
  all: async () => {
    const db = await photoDB.open();
    return new Promise((res, rej) => {
      const rq = db.transaction('photos').objectStore('photos').getAll();
      rq.onsuccess = () => res(rq.result || []);
      rq.onerror = () => rej(rq.error);
    });
  },
  del: async id => {
    const db = await photoDB.open();
    return new Promise((res, rej) => {
      const tx = db.transaction('photos', 'readwrite');
      tx.objectStore('photos').delete(id);
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
  }
};

let photoURLs = [];

async function addPhotoFile(file) {
  if (!file) return;
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = URL.createObjectURL(file);
    });
    const scale = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight));
    const cv = document.createElement('canvas');
    cv.width = Math.round(img.naturalWidth * scale);
    cv.height = Math.round(img.naturalHeight * scale);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    URL.revokeObjectURL(img.src);
    const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.82));
    await photoDB.put({ id: Date.now(), date: todayStr(), blob });
    if (!data.photoDays[todayStr()]) {
      data.photoDays[todayStr()] = true;
      addXp(25, 'Foto de progreso registrada');
    }
    afterEvent();
    renderPhotos();
  } catch (e) {
    toast('ERROR', 'No se pudo guardar la foto', 'toast-danger');
  }
}

async function renderPhotos() {
  const gal = $('photoGallery'), cmp = $('photoCompare');
  let list = [];
  try {
    list = (await photoDB.all()).sort((a, b) => a.id - b.id);
  } catch (e) {
    gal.innerHTML = '<div class="empty">Este navegador no permite guardar fotos.</div>';
    cmp.innerHTML = '';
    return;
  }
  photoURLs.forEach(u => URL.revokeObjectURL(u));
  photoURLs = [];
  const url = b => { const u = URL.createObjectURL(b); photoURLs.push(u); return u; };
  cmp.innerHTML = list.length >= 2
    ? '<div class="cmp-col"><img src="' + url(list[0].blob) + '"><span>' + fmtDate(list[0].date) + '</span></div>' +
      '<div class="cmp-vs">VS</div>' +
      '<div class="cmp-col"><img src="' + url(list[list.length - 1].blob) + '"><span>' + fmtDate(list[list.length - 1].date) + '</span></div>'
    : '';
  gal.innerHTML = list.length
    ? list.slice().reverse().map(p =>
      '<div class="photo-card"><img src="' + url(p.blob) + '" loading="lazy">' +
      '<div class="photo-foot"><span>' + fmtDate(p.date) + '</span>' +
      '<button class="photo-del" data-id="' + p.id + '" title="Eliminar">✕</button></div></div>'
    ).join('')
    : '<div class="empty">Sin fotos todavía. La primera es la que más vale: dentro de 3 meses lo entenderás.</div>';
  gal.querySelectorAll('.photo-del').forEach(b => b.onclick = async () => {
    if (!confirm('¿Eliminar esta foto?')) return;
    await photoDB.del(+b.dataset.id);
    renderPhotos();
  });
}

/* ---------- Informe semanal del Sistema ---------- */
function weeklyReport() {
  const cw = currentWeekKey();
  if (data.lastReport === cw) return;
  const firstRun = !data.lastReport;
  data.lastReport = cw;
  save();
  if (firstRun) return;
  const prevMon = new Date(cw + 'T12:00:00');
  prevMon.setDate(prevMon.getDate() - 7);
  const wk = dateStr(prevMon);
  const days = [];
  for (let i = 0; i < 7; i++) { const d = new Date(prevMon); d.setDate(d.getDate() + i); days.push(dateStr(d)); }
  const ws = data.workouts.filter(w => days.includes(w.date));
  const vol = ws.reduce((a, w) => a + w.exercises.reduce((x, ex) => x + exVolume(ex), 0), 0);
  const prsSemana = Object.values(data.prs).filter(p => days.includes(p.date)).length;
  const pesos = days.filter(d => data.bodyLog[d]).map(d => data.bodyLog[d].weight);
  const prots = days.filter(d => data.dietLog[d] && data.dietLog[d].prot).map(d => data.dietLog[d].prot);
  const dg = data.dungeons[wk];
  const boss = dg ? BOSSES.find(b => b.id === dg.bossId) : null;
  if (!ws.length && !pesos.length && !prots.length && !dg) return;
  const lines = [];
  lines.push('🏋 Entrenamientos: <b>' + ws.length + '</b>' + (vol ? ' · ' + (vol >= 1000 ? fmtNum(vol / 1000, 1) + ' t' : fmtNum(vol, 0) + ' kg') : ''));
  if (prsSemana) lines.push('🏆 Récords nuevos: <b>' + prsSemana + '</b>');
  if (pesos.length) lines.push('⚖ Peso corporal: <b>' + fmtNum(pesos[0], 1) + ' → ' + fmtNum(pesos[pesos.length - 1], 1) + ' kg</b>');
  if (prots.length) lines.push('🍗 Proteína media: <b>' + fmtNum(prots.reduce((a, b) => a + b, 0) / prots.length, 0) + ' g/día</b>');
  if (boss) lines.push(dg.defeated ? '🗿 <b>' + boss.name + '</b> derrotado — botín cobrado' : '🗿 <b>' + boss.name + '</b> escapó de la Puerta');
  queuePopup({ type: 'report', lines });
}

/* ---------- Calendario del cazador ---------- */
let calMonth = null; // 'YYYY-MM' visible (null = mes actual)

function moveCal(delta) {
  const base = calMonth ? new Date(calMonth + '-15T12:00:00') : new Date();
  base.setMonth(base.getMonth() + delta);
  calMonth = base.getFullYear() + '-' + pad(base.getMonth() + 1);
  renderCalendar();
}

function renderCalendar() {
  const base = calMonth ? new Date(calMonth + '-15T12:00:00') : new Date();
  const y = base.getFullYear(), m = base.getMonth();
  $('calTitle').textContent = base.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
  const startCol = (new Date(y, m, 1).getDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const trained = new Set(data.workouts.map(w => w.date));
  const acts = activityDates();
  const today = todayStr();
  let html = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => '<div class="cal-h">' + d + '</div>').join('');
  for (let i = 0; i < startCol; i++) html += '<div class="cal-d void"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = y + '-' + pad(m + 1) + '-' + pad(d);
    let cls = 'cal-d';
    if (trained.has(ds)) cls += ' train';
    else if (acts.has(ds)) cls += ' act';
    if (data.penaltyDays[ds]) cls += ' pen';
    if (ds === today) cls += ' today';
    html += '<div class="' + cls + '">' + d + '</div>';
  }
  $('calGrid').innerHTML = html;
}

/* ---------- Rangos de fuerza (1RM relativo al peso corporal) ---------- */
const LIFT_STANDARDS = [
  { name: 'Press banca', t: [0.60, 0.85, 1.10, 1.40, 1.75] },
  { name: 'Sentadilla', t: [0.80, 1.10, 1.50, 1.90, 2.40] },
  { name: 'Peso muerto', t: [1.00, 1.30, 1.75, 2.25, 2.75] },
  { name: 'Press militar', t: [0.40, 0.55, 0.75, 0.95, 1.15] },
  { name: 'Remo con barra', t: [0.50, 0.70, 0.90, 1.10, 1.35] }
];

function renderStrength() {
  const dates = Object.keys(data.bodyLog).sort();
  const bw = dates.length ? data.bodyLog[dates[dates.length - 1]].weight : null;
  const el = $('strengthRows');
  if (!bw) {
    el.innerHTML = '<div class="empty">Registra tu peso corporal (pestaña CUERPO) para calcular tus rangos de fuerza.</div>';
    return;
  }
  const factor = data.profile.gender === 'f' ? 0.72 : 1;
  const ranks = ['E', 'D', 'C', 'B', 'A', 'S'];
  el.innerHTML = LIFT_STANDARDS.map(ls => {
    const pr = data.prs[ls.name];
    const oneRM = pr ? est1RM(pr.weight, pr.reps) : 0;
    const rel = oneRM / bw;
    let idx = 0;
    ls.t.forEach((th, i) => { if (rel >= th * factor) idx = i + 1; });
    const rank = oneRM ? ranks[idx] : '—';
    const next = idx < 5 ? ls.t[idx] * factor * bw : null;
    return '<div class="str-row">' +
      '<span class="str-name">' + ls.name + '</span>' +
      '<span class="str-rank rank-inline rank-' + (oneRM ? ranks[idx] : 'E') + '">' + rank + '</span>' +
      '<span class="str-val">' + (oneRM ? fmtNum(oneRM, 0) + ' kg · ' + fmtNum(rel, 2) + '×PC' : 'sin marca aún') + '</span>' +
      '<span class="str-next">' + (oneRM ? (next ? 'rango ' + ranks[idx + 1] + ' a ' + fmtNum(next, 0) + ' kg' : '★ RANGO MÁXIMO') : '') + '</span>' +
      '</div>';
  }).join('');
}

/* ---------- Plantillas de rutina ---------- */
const TEMPLATES = [
  { name: 'Full Body 3 días', ex: ['Sentadilla', 'Press banca', 'Remo con barra', 'Press militar', 'Curl femoral', 'Plancha'] },
  { name: 'Push (empuje)', ex: ['Press banca', 'Press inclinado con mancuernas', 'Press militar', 'Elevaciones laterales', 'Extensión de tríceps en polea', 'Fondos'] },
  { name: 'Pull (tirón)', ex: ['Dominadas', 'Remo con barra', 'Jalón al pecho', 'Face pull', 'Curl con barra', 'Curl martillo'] },
  { name: 'Leg (pierna)', ex: ['Sentadilla', 'Prensa de piernas', 'Peso muerto rumano', 'Curl femoral', 'Extensión de cuádriceps', 'Gemelos de pie'] },
  { name: 'Torso', ex: ['Press banca', 'Remo con barra', 'Press inclinado con mancuernas', 'Jalón al pecho', 'Elevaciones laterales', 'Curl con barra'] },
  { name: 'Pierna (torso-pierna)', ex: ['Sentadilla', 'Hip thrust', 'Peso muerto rumano', 'Prensa de piernas', 'Curl femoral', 'Gemelos sentado'] }
];

function renderTemplates() {
  $('templateList').innerHTML = TEMPLATES.map((t, i) =>
    '<div class="tpl-row"><div class="tpl-info"><b>' + t.name + '</b>' +
    '<span>' + t.ex.join(' · ') + '</span></div>' +
    '<button class="btn tpl-add" data-i="' + i + '">AÑADIR</button></div>'
  ).join('');
  $('templateList').querySelectorAll('.tpl-add').forEach(b => b.onclick = () => importTemplate(+b.dataset.i));
}

function importTemplate(i) {
  const t = TEMPLATES[i];
  const exists = data.routines.find(r => r.name.toLowerCase() === t.name.toLowerCase());
  if (exists && !confirm('Ya tienes la rutina "' + t.name + '". ¿Sobrescribirla?')) return;
  const exercises = t.ex.map(n => ({
    name: n,
    sets: [{ weight: '', reps: 10 }, { weight: '', reps: 10 }, { weight: '', reps: 10 }]
  }));
  if (exists) exists.exercises = exercises;
  else data.routines.push({ id: Date.now(), name: t.name, exercises });
  save();
  renderTrain();
  toast('SISTEMA', 'Rutina "' + t.name + '" añadida a MIS RUTINAS');
}

/* ---------- Estadísticas de entrenamiento ---------- */
function renderStats() {
  // Volumen semanal de las últimas 8 semanas
  const weeks = [];
  const mon = mondayOf(new Date());
  for (let i = 7; i >= 0; i--) {
    const d = new Date(mon);
    d.setDate(d.getDate() - i * 7);
    weeks.push(dateStr(d));
  }
  const sums = {};
  for (const w of data.workouts) {
    const wk = weekKeyOf(new Date(w.date + 'T12:00:00'));
    sums[wk] = (sums[wk] || 0) + w.exercises.reduce((a, ex) => a + exVolume(ex), 0);
  }
  const maxV = Math.max(1, ...weeks.map(k => sums[k] || 0));
  $('weeklyVol').innerHTML = weeks.map(k => {
    const v = sums[k] || 0;
    const [y, m, d] = k.split('-');
    return '<div class="wday"><div class="wbar"><div class="wbar-fill" style="height:' + Math.round(v / maxV * 100) + '%"></div></div>' +
      '<div class="wbar-val">' + (v ? (v >= 1000 ? fmtNum(v / 1000, 1) + 't' : fmtNum(v, 0)) : '—') + '</div>' +
      '<div class="wbar-day">' + d + '/' + m + '</div></div>';
  }).join('');

  // Reparto por grupo muscular en los últimos 30 días
  const cut = new Date();
  cut.setDate(cut.getDate() - 30);
  const cutStr = dateStr(cut);
  const groups = {};
  for (const w of data.workouts) {
    if (w.date < cutStr) continue;
    for (const ex of w.exercises) {
      const info = exInfo(ex.name);
      const g = info ? info.cat : 'OTROS';
      groups[g] = (groups[g] || 0) + exVolume(ex);
    }
  }
  const entries = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  const maxG = Math.max(1, ...entries.map(e => e[1]));
  $('groupVol').innerHTML = entries.length ? entries.map(([g, v]) =>
    '<div class="gv-row"><span class="gv-label">' + g + '</span>' +
    '<div class="gv-bar"><div class="gv-fill" style="width:' + Math.round(v / maxG * 100) + '%"></div></div>' +
    '<span class="gv-val">' + (v >= 1000 ? fmtNum(v / 1000, 1) + ' t' : fmtNum(v, 0) + ' kg') + '</span></div>'
  ).join('') : '<div class="empty">Entrena este mes para ver tu reparto muscular.</div>';
}

/* ============================================================
   CUERPO
   ============================================================ */
const MEASURES = [
  ['weight', 'Peso', 'kg'], ['fat', 'Grasa', '%'], ['pecho', 'Pecho', 'cm'],
  ['cintura', 'Cintura', 'cm'], ['cadera', 'Cadera', 'cm'], ['brazo', 'Brazo', 'cm'],
  ['muslo', 'Muslo', 'cm'], ['gemelo', 'Gemelo', 'cm']
];

function saveBody() {
  const date = $('bodyDate').value || todayStr();
  const weight = parseNum($('bodyWeight').value);
  if (!(weight > 0)) {
    toast('SISTEMA', 'Indica al menos tu peso corporal', 'toast-danger');
    return;
  }
  const opt = id => { const n = parseNum($(id).value); return n > 0 ? n : null; };
  const isNew = !data.bodyLog[date];
  data.bodyLog[date] = {
    weight, fat: opt('bodyFat'), pecho: opt('mPecho'), cintura: opt('mCintura'),
    cadera: opt('mCadera'), brazo: opt('mBrazo'), muslo: opt('mMuslo'), gemelo: opt('mGemelo')
  };
  if (isNew && date === todayStr()) addXp(XP.body, 'Registro corporal');
  else toast('SISTEMA', 'Registro corporal actualizado');
  afterEvent();
}

function deleteBody(date) {
  if (!confirm('¿Eliminar el registro del ' + fmtDate(date) + '?')) return;
  delete data.bodyLog[date];
  save();
  renderAll();
}

function fillBodyForm() {
  const date = $('bodyDate').value || todayStr();
  const e = data.bodyLog[date];
  const set = (id, v) => { $(id).value = v != null ? v : ''; };
  set('bodyWeight', e && e.weight); set('bodyFat', e && e.fat);
  set('mPecho', e && e.pecho); set('mCintura', e && e.cintura); set('mCadera', e && e.cadera);
  set('mBrazo', e && e.brazo); set('mMuslo', e && e.muslo); set('mGemelo', e && e.gemelo);
}

function renderBody() {
  const dates = Object.keys(data.bodyLog).sort();
  // Gráfica de la medida elegida
  const key = $('measureSelect').value || 'weight';
  const def = MEASURES.find(m => m[0] === key) || MEASURES[0];
  const series = dates
    .filter(d => data.bodyLog[d][key] != null)
    .map(d => ({ date: d, value: data.bodyLog[d][key] }))
    .slice(-90);
  renderLineChart($('weightChart'), series, def[2]);

  // Deltas último vs anterior
  const el = $('deltaList');
  if (dates.length < 2) {
    el.innerHTML = '<div class="empty">Necesitas al menos dos registros para ver tu evolución.</div>';
  } else {
    const last = data.bodyLog[dates[dates.length - 1]];
    const prev = data.bodyLog[dates[dates.length - 2]];
    const rows = [];
    for (const [key, label, unit] of MEASURES) {
      if (last[key] != null && prev[key] != null) {
        const diff = last[key] - prev[key];
        const sign = diff > 0 ? '▲ +' : diff < 0 ? '▼ ' : '— ';
        rows.push('<div class="delta-row"><span>' + label + '</span><span class="delta-val">' +
          fmtNum(last[key]) + ' ' + unit + ' <small>(' + sign + fmtNum(diff) + ')</small></span></div>');
      }
    }
    el.innerHTML = rows.length ? rows.join('') : '<div class="empty">Sin medidas comparables entre los dos últimos registros.</div>';
  }

  // Historial
  const hist = dates.slice().reverse().slice(0, 10);
  $('bodyHistory').innerHTML = hist.length ? hist.map(d => {
    const e = data.bodyLog[d];
    const parts = MEASURES.filter(([k]) => e[k] != null).map(([k, label, unit]) => label + ' ' + fmtNum(e[k]) + ' ' + unit);
    return '<div class="hist-item"><div class="hist-head"><b>' + fmtDate(d) + '</b>' +
      '<button class="hist-del" data-d="' + d + '" title="Eliminar">✕</button></div>' +
      '<div class="hist-body">' + parts.join(' · ') + '</div></div>';
  }).join('') : '<div class="empty">Sin registros corporales todavía.</div>';
  $('bodyHistory').querySelectorAll('.hist-del').forEach(b => b.onclick = () => deleteBody(b.dataset.d));
}

/* ============================================================
   DIETA
   ============================================================ */
function saveDiet() {
  const date = $('dietDate').value || todayStr();
  const kcal = parseNum($('dietKcal').value);
  const prot = parseNum($('dietProt').value);
  if (!(kcal > 0) && !(prot > 0)) {
    toast('SISTEMA', 'Indica al menos calorías o proteína', 'toast-danger');
    return;
  }
  const opt = id => { const n = parseNum($(id).value); return n > 0 ? n : null; };
  const isNew = !data.dietLog[date];
  data.dietLog[date] = { kcal: kcal > 0 ? kcal : null, prot: prot > 0 ? prot : null, carb: opt('dietCarb'), fat: opt('dietFatG') };
  if (isNew && date === todayStr()) addXp(XP.diet, 'Dieta registrada');
  else toast('SISTEMA', 'Registro de dieta actualizado');
  if (date === todayStr() && prot >= data.dietGoals.protein && !data.protDays[date]) {
    data.protDays[date] = true;
    addXp(XP.protein, 'Objetivo de proteína cumplido');
  }
  // Exceso de calorías -> el Sistema asigna una misión especial de cardio
  if (date === todayStr() && kcal > data.dietGoals.kcal) {
    const excess = Math.round(kcal - data.dietGoals.kcal);
    const minutes = Math.min(60, Math.max(10, Math.round(excess / 10)));
    const q = data.specialQuests[date];
    if (!q) {
      data.specialQuests[date] = { minutes, excess, done: false };
      queuePopup({ type: 'special', minutes, excess });
    } else if (!q.done && minutes > q.minutes) {
      q.minutes = minutes; q.excess = excess;
      queuePopup({ type: 'special', minutes, excess });
    }
  }
  afterEvent();
}

/* ---------- Objetivos del Cazador ---------- */
function goalLabel(g) {
  if (g.type === 'lift') return g.exercise + ': ' + fmtNum(g.target, 0) + ' kg';
  if (g.type === 'weight') return 'Peso corporal: ' + fmtNum(g.target, 1) + ' kg';
  return 'Racha de ' + g.target + ' días';
}

function goalProgress(g) {
  if (g.type === 'lift') {
    const pr = data.prs[g.exercise];
    return pr ? Math.min(1, pr.weight / g.target) : 0;
  }
  if (g.type === 'weight') {
    const dates = Object.keys(data.bodyLog).sort();
    if (!dates.length) return 0;
    const cur = data.bodyLog[dates[dates.length - 1]].weight;
    if (g.start === g.target) return 1;
    return Math.min(1, Math.max(0, (g.start - cur) / (g.start - g.target)));
  }
  if (g.type === 'streak') return Math.min(1, currentStreak() / g.target);
  return 0;
}

function checkGoals() {
  for (const g of data.goals) {
    if (!g.done && goalProgress(g) >= 1) {
      g.done = true;
      addXp(XP.goal, 'Objetivo cumplido', true);
      queuePopup({ type: 'ach', label: 'OBJETIVO CUMPLIDO', name: goalLabel(g), desc: 'El Sistema reconoce tu ambición: +' + XP.goal + ' XP' });
    }
  }
}

function addGoal() {
  const type = $('goalType').value;
  const target = parseNum($('goalTarget').value);
  if (!(target > 0)) { toast('SISTEMA', 'Pon el número objetivo', 'toast-danger'); return; }
  const g = { id: Date.now(), type, target, done: false };
  if (type === 'lift') {
    const ex = $('goalExercise').value.trim();
    if (!ex) { toast('SISTEMA', 'Escribe el ejercicio del objetivo', 'toast-danger'); return; }
    g.exercise = ex;
  } else if (type === 'weight') {
    const dates = Object.keys(data.bodyLog).sort();
    if (!dates.length) { toast('SISTEMA', 'Registra primero tu peso corporal', 'toast-danger'); return; }
    g.start = data.bodyLog[dates[dates.length - 1]].weight;
    if (g.start === g.target) { toast('SISTEMA', 'Ya estás en ese peso, cazador', 'toast-danger'); return; }
  }
  data.goals.push(g);
  $('goalTarget').value = '';
  $('goalExercise').value = '';
  save();
  renderGoals();
  toast('SISTEMA', 'Objetivo registrado: ' + goalLabel(g) + '. El Sistema lo vigila.');
}

function renderGoals() {
  const el = $('goalList');
  el.innerHTML = data.goals.length ? data.goals.map(g => {
    const p = g.done ? 1 : goalProgress(g);
    return '<div class="goal-row' + (g.done ? ' done' : '') + '">' +
      '<div class="goal-head"><span class="goal-label">' + (g.done ? '✔ ' : '🎯 ') + esc(goalLabel(g)) + '</span>' +
      '<span class="goal-pct">' + Math.round(p * 100) + '%</span>' +
      '<button class="goal-del" data-id="' + g.id + '" title="Eliminar objetivo">✕</button></div>' +
      '<div class="goal-bar"><div class="goal-fill" style="width:' + Math.round(p * 100) + '%"></div></div>' +
      '</div>';
  }).join('') : '<div class="empty">Márcate un objetivo: el Sistema recompensa la ambición con +' + XP.goal + ' XP.</div>';
  el.querySelectorAll('.goal-del').forEach(b => b.onclick = () => {
    data.goals = data.goals.filter(x => x.id !== +b.dataset.id);
    save();
    renderGoals();
  });
}

function completeSideMission() {
  if (data.sideMissions[todayStr()]) return;
  data.sideMissions[todayStr()] = true;
  addXp(XP.side, 'Misión secundaria completada');
  afterEvent();
}

function completeSpecialQuest() {
  const sq = data.specialQuests[todayStr()];
  if (!sq || sq.done) return;
  sq.done = true;
  addXp(XP.special, 'Misión especial completada');
  afterEvent();
}

function deleteDiet(date) {
  if (!confirm('¿Eliminar el registro del ' + fmtDate(date) + '?')) return;
  delete data.dietLog[date];
  save();
  renderAll();
}

function saveGoals() {
  const kcal = parseNum($('goalKcal').value);
  const prot = parseNum($('goalProt').value);
  if (kcal > 0) data.dietGoals.kcal = kcal;
  if (prot > 0) data.dietGoals.protein = prot;
  toast('SISTEMA', 'Objetivos actualizados: ' + fmtNum(data.dietGoals.kcal, 0) + ' kcal / ' + fmtNum(data.dietGoals.protein, 0) + ' g proteína');
  save();
  renderAll();
}

function fillDietForm() {
  const date = $('dietDate').value || todayStr();
  const e = data.dietLog[date];
  const set = (id, v) => { $(id).value = v != null ? v : ''; };
  set('dietKcal', e && e.kcal); set('dietProt', e && e.prot);
  set('dietCarb', e && e.carb); set('dietFatG', e && e.fat);
}

function renderDiet() {
  $('goalKcal').value = data.dietGoals.kcal;
  $('goalProt').value = data.dietGoals.protein;

  // Barras de proteína últimos 7 días
  const goal = data.dietGoals.protein || 1;
  const DAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const cells = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = dateStr(d);
    const prot = (data.dietLog[key] && data.dietLog[key].prot) || 0;
    const pct = Math.min(100, Math.round(prot / goal * 100));
    const ok = prot >= goal;
    cells.push('<div class="wday"><div class="wbar"><div class="wbar-fill' + (ok ? ' ok' : '') +
      '" style="height:' + pct + '%"></div></div>' +
      '<div class="wbar-val">' + (prot ? fmtNum(prot, 0) + 'g' : '—') + '</div>' +
      '<div class="wbar-day">' + DAYS[d.getDay()] + '</div></div>');
  }
  $('weekBars').innerHTML = cells.join('');

  // Historial
  const dates = Object.keys(data.dietLog).sort().reverse().slice(0, 10);
  $('dietHistory').innerHTML = dates.length ? dates.map(d => {
    const e = data.dietLog[d];
    const parts = [];
    if (e.kcal != null) parts.push(fmtNum(e.kcal, 0) + ' kcal');
    if (e.prot != null) parts.push(fmtNum(e.prot, 0) + ' g proteína' + (e.prot >= data.dietGoals.protein ? ' ✔' : ''));
    if (e.carb != null) parts.push(fmtNum(e.carb, 0) + ' g carbos');
    if (e.fat != null) parts.push(fmtNum(e.fat, 0) + ' g grasas');
    return '<div class="hist-item"><div class="hist-head"><b>' + fmtDate(d) + '</b>' +
      '<button class="hist-del" data-d="' + d + '" title="Eliminar">✕</button></div>' +
      '<div class="hist-body">' + parts.join(' · ') + '</div></div>';
  }).join('') : '<div class="empty">Sin registros de dieta todavía.</div>';
  $('dietHistory').querySelectorAll('.hist-del').forEach(b => b.onclick = () => deleteDiet(b.dataset.d));
}

/* ============================================================
   ESTADO / MISIONES / LOGROS
   ============================================================ */
function dayOfYear() {
  const now = new Date();
  return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
}

function renderStatus() {
  const li = levelInfo(data.xp);
  const rank = rankFor(li.level);
  $('levelNum').textContent = li.level;
  const rb = $('rankBadge');
  rb.className = 'rank-badge rank-' + rank;
  rb.innerHTML = '<span>' + rank + '</span>';
  $('xpFill').style.width = Math.round(li.into / li.need * 100) + '%';
  $('xpText').textContent = fmtNum(li.into, 0) + ' / ' + fmtNum(li.need, 0) + ' XP';
  $('hunterTitle').textContent = currentTitle();
  $('statFUE').textContent = 10 + data.stats.fue;
  $('statRES').textContent = 10 + data.stats.res;
  $('statDIS').textContent = 10 + data.stats.dis;
  $('statVOL').textContent = 10 + data.maxStreak;
  $('streakNum').textContent = currentStreak();
  $('totalSessions').textContent = data.workouts.length;
  const vol = totalVolume();
  $('totalVolume').textContent = vol >= 1000 ? fmtNum(vol / 1000, 2) + ' t' : fmtNum(vol, 0) + ' kg';
  $('dailyQuote').textContent = '“' + QUOTES[dayOfYear() % QUOTES.length] + '”';
  $('hunterName').textContent = (data.profile.name || '—').toUpperCase();
  $('nameInput').value = data.profile.name;
  const ci = $('charImg');
  ci.style.display = 'block';
  ci.onerror = () => { ci.style.display = 'none'; };
  // Las imágenes apaisadas (planos de cara) se recortan para llenar el marco
  ci.onload = () => {
    const landscape = ci.naturalWidth > ci.naturalHeight;
    ci.style.objectFit = landscape ? 'cover' : 'contain';
    ci.style.width = landscape ? '185px' : '';
  };
  ci.src = charImgFor(li.level);
}

function renderQuests() {
  const q = questsDone(todayStr());
  const items = [
    { label: 'Completa un entrenamiento', xp: '+' + XP.workout + ' XP o más', done: q.train },
    { label: 'Registra tu peso corporal', xp: '+' + XP.body + ' XP', done: q.body },
    { label: 'Registra tu dieta', xp: '+' + XP.diet + '–' + (XP.diet + XP.protein) + ' XP', done: q.diet }
  ];
  $('questList').innerHTML = items.map(it =>
    '<li class="quest-item' + (it.done ? ' done' : '') + '"><span class="q-check"></span>' +
    '<span class="q-label">' + it.label + '</span><span class="q-xp">' + it.xp + '</span></li>'
  ).join('');
  const bonus = $('bonusRow');
  if (data.bonusDays[todayStr()]) {
    bonus.className = 'bonus-row done';
    bonus.textContent = '✦ MISIÓN DIARIA COMPLETADA — +' + XP.bonus + ' XP ✦';
  } else {
    bonus.className = 'bonus-row';
    bonus.textContent = 'Recompensa por completarlo todo: +' + XP.bonus + ' XP y +1 DISCIPLINA';
  }
  // Misión secundaria aleatoria del día
  const sm = SIDE_MISSIONS[dayOfYear() % SIDE_MISSIONS.length];
  const smDone = !!data.sideMissions[todayStr()];
  $('sideMission').innerHTML =
    '<div class="side-row' + (smDone ? ' done' : '') + '"><span class="q-check"></span>' +
    '<span class="q-label">Secundaria: ' + sm + '</span>' +
    (smDone ? '<span class="q-xp">✔ +' + XP.side + ' XP</span>'
      : '<button class="btn side-btn" id="btnSideDone">HECHA (+' + XP.side + ' XP)</button>') +
    '</div>';
  if (!smDone) $('btnSideDone').onclick = completeSideMission;

  // Misión especial de cardio (por pasarse de calorías)
  const sq = data.specialQuests[todayStr()];
  const el = $('specialQuest');
  if (!sq) {
    el.innerHTML = '';
  } else if (sq.done) {
    el.innerHTML = '<div class="special-row done">⚡ MISIÓN ESPECIAL COMPLETADA — ' + sq.minutes + ' min de cardio ✔</div>';
  } else {
    el.innerHTML = '<div class="special-row">⚡ MISIÓN ESPECIAL: <b>' + sq.minutes + ' MIN DE CARDIO</b>' +
      '<button class="btn special-btn" id="btnDoneSpecial">COMPLETADA</button></div>';
    $('btnDoneSpecial').onclick = completeSpecialQuest;
  }
}

/* ---------- Puerta semanal (panel de ESTADO) ---------- */
function renderDungeon() {
  const wk = currentWeekKey();
  const dg = ensureDungeon();
  const boss = BOSSES.find(b => b.id === dg.bossId) || BOSSES[0];
  const img = $('bossImg');
  img.onerror = () => { img.style.display = 'none'; };
  img.style.display = '';
  img.src = boss.img;
  img.className = 'boss-img' + (dg.defeated ? ' dead' : '');
  $('bossName').textContent = boss.name;
  $('bossTitle').textContent = '«' + boss.title + '»';
  const rb = $('bossRank');
  rb.className = 'boss-rank rank-' + boss.rank;
  rb.textContent = 'PUERTA DE RANGO ' + boss.rank;
  const dealt = Math.min(dungeonDamage(wk), dg.hp);
  const restante = dg.hp - dealt;
  $('bossHpFill').style.width = Math.max(0, Math.round(restante / dg.hp * 100)) + '%';
  $('bossHpText').textContent = fmtNum(restante, 0) + ' / ' + fmtNum(dg.hp, 0) + ' PV';
  const hoy = new Date();
  const fin = mondayOf(hoy);
  fin.setDate(fin.getDate() + 6);
  const diasRestantes = Math.max(0, Math.round((fin - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) / 86400000));
  const st = $('bossStatus');
  if (dg.defeated) {
    st.className = 'boss-status done';
    st.textContent = '✔ PUERTA CERRADA — jefe derrotado, botín en tu inventario';
  } else {
    st.className = 'boss-status';
    st.textContent = 'Cada kg de volumen le hace 1 de daño · ' +
      (diasRestantes === 0 ? '⚠ ÚLTIMO DÍA: si sobrevive, habrá castigo' : 'quedan ' + diasRestantes + ' días');
  }
}

/* ---------- Inventario ---------- */
function renderInventory() {
  const ids = Object.keys(data.inventory || {});
  const el = $('invGrid');
  const order = id => ITEMS[id] && ITEMS[id].type === 'consumible' ? 0 : 1;
  el.innerHTML = ids.length ? ids.sort((a, b) => order(a) - order(b) || a.localeCompare(b)).map(id => {
    const it = ITEMS[id];
    if (!it) return '';
    return '<div class="item-card ' + it.type + '">' +
      '<div class="item-icon">' + it.icon + '</div>' +
      '<div class="item-name">' + it.name + (data.inventory[id] > 1 ? ' ×' + data.inventory[id] : '') + '</div>' +
      '<div class="item-desc">' + it.desc + '</div>' +
      (it.type === 'consumible'
        ? '<button class="btn item-use" data-id="' + id + '">USAR</button>'
        : '<div class="item-tag">COLECCIONABLE</div>') +
      '</div>';
  }).join('') : '<div class="empty">Sin botín todavía. Derrota al jefe de la Puerta semanal (pestaña ESTADO) para conseguir items.</div>';
  el.querySelectorAll('.item-use').forEach(b => b.onclick = () => useItem(b.dataset.id));
  const parts = [];
  if (data.buffs.doubleWorkout) parts.push('🧪 Poción del Monarca activa: tu próximo entrenamiento dará XP doble');
  if (data.blessedDays[todayStr()]) parts.push('💠 Bendición activa: hoy cuenta como día con registro');
  $('buffBar').innerHTML = parts.join('<br>');
  $('buffBar').style.display = parts.length ? '' : 'none';
}

/* ---------- Tarjeta de cazador (imagen para compartir) ---------- */
function buildCardCanvas(charImage) {
  const W = 1000, H = 1250;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const li = levelInfo(data.xp);
  const rank = rankFor(li.level);
  const rankColors = { E: '#9aa7b5', D: '#58d68d', C: '#3fa7ff', B: '#b06cff', A: '#ff5e5e', S: '#ffd34d' };

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a1428');
  g.addColorStop(1, '#03060d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  if (charImage) {
    try {
      ctx.globalAlpha = 0.25;
      const ratio = charImage.naturalWidth / charImage.naturalHeight;
      const ih = 760, iw = ih * ratio;
      ctx.drawImage(charImage, W - iw - 40, H - ih - 60, iw, ih);
      ctx.globalAlpha = 1;
    } catch (e) { ctx.globalAlpha = 1; }
  }

  ctx.strokeStyle = 'rgba(64,156,255,.35)';
  ctx.lineWidth = 10;
  ctx.strokeRect(18, 18, W - 36, H - 36);
  ctx.strokeStyle = '#2e6bd8';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, W - 60, H - 60);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#eaf5ff';
  ctx.font = '900 62px Orbitron, sans-serif';
  ctx.fillText('A R I S E', W / 2, 120);
  ctx.fillStyle = '#8fd6ff';
  ctx.font = '600 28px Rajdhani, sans-serif';
  ctx.fillText('✦  E S T A D O  D E  C A Z A D O R  ✦', W / 2, 165);

  ctx.fillStyle = '#cfe3ff';
  ctx.font = '700 40px Rajdhani, sans-serif';
  ctx.fillText((data.profile.name || 'CAZADOR').toUpperCase(), W / 2, 245);

  ctx.fillStyle = '#eaf5ff';
  ctx.font = '900 130px Orbitron, sans-serif';
  ctx.fillText('NIVEL ' + li.level, W / 2, 410);

  ctx.fillStyle = rankColors[rank];
  ctx.font = '900 52px Orbitron, sans-serif';
  ctx.fillText('RANGO ' + rank, W / 2, 490);

  ctx.fillStyle = '#ffd34d';
  ctx.font = 'italic 600 34px Rajdhani, sans-serif';
  ctx.fillText('«' + currentTitle() + '»', W / 2, 555);

  ctx.strokeStyle = 'rgba(64,156,255,.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(90, 600); ctx.lineTo(W - 90, 600); ctx.stroke();

  const stats = [
    ['FUERZA', 10 + data.stats.fue], ['RESISTENCIA', 10 + data.stats.res],
    ['DISCIPLINA', 10 + data.stats.dis], ['VOLUNTAD', 10 + data.maxStreak]
  ];
  stats.forEach(([lab, val], i) => {
    const x = 145 + i * 237;
    ctx.fillStyle = '#8fd6ff';
    ctx.font = '700 54px Orbitron, sans-serif';
    ctx.fillText(String(val), x, 680);
    ctx.fillStyle = '#7e9cc4';
    ctx.font = '600 20px Rajdhani, sans-serif';
    ctx.fillText(lab, x, 715);
  });

  const vol = totalVolume();
  const meta = [
    ['RACHA', currentStreak() + ' días'],
    ['SESIONES', String(data.workouts.length)],
    ['TONELAJE', vol >= 1000 ? fmtNum(vol / 1000, 1) + ' t' : fmtNum(vol, 0) + ' kg'],
    ['JEFES', String(data.bossKills || 0)]
  ];
  meta.forEach(([lab, val], i) => {
    const x = 145 + i * 237;
    ctx.fillStyle = '#eaf5ff';
    ctx.font = '700 36px Rajdhani, sans-serif';
    ctx.fillText(val, x, 790);
    ctx.fillStyle = '#7e9cc4';
    ctx.font = '600 18px Rajdhani, sans-serif';
    ctx.fillText(lab, x, 820);
  });

  ctx.beginPath(); ctx.moveTo(90, 860); ctx.lineTo(W - 90, 860); ctx.stroke();

  ctx.fillStyle = '#8fd6ff';
  ctx.font = '700 26px Rajdhani, sans-serif';
  ctx.fillText('✦ MEJORES MARCAS ✦', W / 2, 905);
  const prs = Object.entries(data.prs).sort((a, b) => b[1].weight - a[1].weight).slice(0, 3);
  ctx.font = '600 30px Rajdhani, sans-serif';
  if (prs.length) {
    prs.forEach(([name, pr], i) => {
      ctx.fillStyle = '#cfe3ff';
      ctx.fillText(name + '  —  ' + fmtNum(pr.weight) + ' kg × ' + pr.reps, W / 2, 950 + i * 42);
    });
  } else {
    ctx.fillStyle = '#7e9cc4';
    ctx.fillText('Aún sin récords... pero el Sistema observa.', W / 2, 950);
  }

  ctx.fillStyle = '#7e9cc4';
  ctx.font = 'italic 26px Rajdhani, sans-serif';
  ctx.fillText('“' + QUOTES[dayOfYear() % QUOTES.length] + '”', W / 2, 1130);
  ctx.fillStyle = '#41a6ff';
  ctx.font = '600 20px Rajdhani, sans-serif';
  ctx.fillText('— EL SISTEMA TE OBSERVA —', W / 2, 1185);

  return cv;
}

function shareCard() {
  const exportCard = withImg => {
    try {
      const cv = buildCardCanvas(withImg ? charImage : null);
      cv.toBlob(blob => {
        if (!blob) { if (withImg) exportCard(false); return; }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'arise-cazador-' + todayStr() + '.png';
        a.click();
        URL.revokeObjectURL(a.href);
        toast('SISTEMA', 'Tarjeta de cazador descargada. ¡A presumir!');
      }, 'image/png');
    } catch (e) {
      if (withImg) exportCard(false); // canvas contaminado (file://): sin imagen de personaje
      else toast('ERROR', 'No se pudo generar la tarjeta', 'toast-danger');
    }
  };
  const charImage = new Image();
  charImage.onload = () => exportCard(true);
  charImage.onerror = () => exportCard(false);
  charImage.src = charImgFor(levelInfo(data.xp).level);
}

function renderAchievements() {
  const total = ACHIEVEMENTS.length;
  const got = Object.keys(data.achievements).filter(id => ACHIEVEMENTS.some(a => a.id === id)).length;
  $('achCount').textContent = got + ' / ' + total + ' títulos desbloqueados';
  let html = '';
  for (const [key, label] of Object.entries(ACH_CATS)) {
    const list = ACHIEVEMENTS.filter(a => a.cat === key);
    if (!list.length) continue;
    const catGot = list.filter(a => data.achievements[a.id]).length;
    html += '<div class="ach-cat">✦ ' + label + '<span>' + catGot + ' / ' + list.length + '</span></div>';
    html += '<div class="ach-grid">' + list.map(a => {
      const u = data.achievements[a.id];
      const active = data.activeTitle === a.id;
      return '<div class="ach-card ' + (u ? 'unlocked' : 'locked') + '">' +
        '<div class="ach-icon">' + (u ? '✦' : '🔒') + '</div>' +
        '<div class="ach-name">' + a.name + '</div>' +
        '<div class="ach-desc">' + a.desc + '</div>' +
        (u ? '<div class="ach-date">Desbloqueado el ' + fmtDate(u.date) + '</div>' +
          '<button class="btn ach-use' + (active ? ' active' : '') + '" data-id="' + a.id + '">' +
          (active ? '✦ TÍTULO ACTIVO' : 'USAR TÍTULO') + '</button>' : '') +
        '</div>';
    }).join('') + '</div>';
  }
  $('achWrap').innerHTML = html;
  $('achWrap').querySelectorAll('.ach-use').forEach(b => b.onclick = () => {
    data.activeTitle = data.activeTitle === b.dataset.id ? null : b.dataset.id;
    save();
    renderStatus();
    renderAchievements();
    toast('SISTEMA', data.activeTitle ? 'Título en uso: ' + currentTitle() : 'Vuelves a lucir tu último título');
  });
}

/* ---------- Calculadora de discos ---------- */
function renderPlates() {
  const target = parseNum($('plateTarget').value);
  const bar = parseNum($('plateBar').value) || 20;
  const out = $('plateResult');
  if (!(target > 0)) { out.innerHTML = '<div class="empty">Escribe el peso objetivo.</div>'; return; }
  if (target < bar) { out.innerHTML = '<div class="empty">El objetivo es menor que la barra (' + fmtNum(bar, 0) + ' kg).</div>'; return; }
  let side = (target - bar) / 2;
  const sizes = [25, 20, 15, 10, 5, 2.5, 1.25];
  const used = [];
  for (const p of sizes) {
    while (side >= p - 0.001) { used.push(p); side -= p; }
  }
  out.innerHTML =
    '<div class="plate-line">' +
    (used.length ? used.map(p => '<span class="plate p' + String(p).replace('.', '_') + '">' + fmtNum(p) + '</span>').join('') : '<span class="empty">solo la barra</span>') +
    '</div>' +
    '<p class="sys-hint">Por cada lado: ' + (used.length ? used.map(p => fmtNum(p)).join(' + ') + ' kg' : 'nada') +
    (side > 0.01 ? ' · ⚠ faltan ' + fmtNum(side * 2) + ' kg que no salen con discos estándar' : '') + '</p>';
}

/* ============================================================
   GRÁFICAS (SVG sin dependencias)
   ============================================================ */
function renderLineChart(el, series, unit) {
  if (!series || series.length === 0) {
    el.innerHTML = '<div class="empty">Sin datos todavía.</div>';
    return;
  }
  const W = 600, H = 230, P = { l: 50, r: 18, t: 16, b: 30 };
  const vals = series.map(s => s.value);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const margin = (max - min) * 0.12;
  min -= margin; max += margin;
  const x = i => series.length === 1 ? P.l + (W - P.l - P.r) / 2 : P.l + (W - P.l - P.r) * i / (series.length - 1);
  const y = v => P.t + (H - P.t - P.b) * (1 - (v - min) / (max - min));

  let g = '';
  for (let i = 0; i <= 4; i++) {
    const v = min + (max - min) * i / 4;
    const yy = y(v);
    g += '<line class="axis" x1="' + P.l + '" y1="' + yy + '" x2="' + (W - P.r) + '" y2="' + yy + '"/>' +
      '<text class="axis-lab" x="' + (P.l - 6) + '" y="' + (yy + 4) + '" text-anchor="end">' + fmtNum(v, 1) + '</text>';
  }
  const pts = series.map((s, i) => x(i).toFixed(1) + ',' + y(s.value).toFixed(1)).join(' ');
  let dots = '', labs = '';
  const maxI = vals.indexOf(Math.max(...vals));
  series.forEach((s, i) => {
    dots += '<circle class="dot" cx="' + x(i).toFixed(1) + '" cy="' + y(s.value).toFixed(1) + '" r="3.5">' +
      '<title>' + fmtDate(s.date) + ' — ' + fmtNum(s.value) + ' ' + unit + '</title></circle>';
    if (i === 0 || i === series.length - 1 || i === maxI) {
      labs += '<text class="pt-lab" x="' + x(i).toFixed(1) + '" y="' + (y(s.value) - 9).toFixed(1) +
        '" text-anchor="middle">' + fmtNum(s.value) + '</text>';
    }
  });
  const x0 = '<text class="axis-lab" x="' + P.l + '" y="' + (H - 8) + '">' + fmtDate(series[0].date) + '</text>';
  const x1 = series.length > 1
    ? '<text class="axis-lab" x="' + (W - P.r) + '" y="' + (H - 8) + '" text-anchor="end">' + fmtDate(series[series.length - 1].date) + '</text>'
    : '';
  el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">' +
    g + '<polyline class="line" points="' + pts + '"/>' + dots + labs + x0 + x1 + '</svg>';
}

/* ============================================================
   DATOS (exportar / importar / reset)
   ============================================================ */
function exportData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'arise-backup-' + todayStr() + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  data.lastBackup = todayStr();
  save();
  toast('SISTEMA', 'Copia de seguridad descargada');
}

function importData(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const obj = JSON.parse(r.result);
      if (typeof obj.xp !== 'number' || !Array.isArray(obj.workouts)) throw new Error('formato');
      data = Object.assign(defaultData(), obj);
      migrateWorkouts(data.workouts);
      save();
      renderAll();
      toast('SISTEMA', 'Datos importados correctamente');
    } catch (e) {
      toast('ERROR', 'El archivo no es una copia válida de ARISE', 'toast-danger');
    }
  };
  r.readAsText(file);
}

function resetData() {
  if (!confirm('Esto borrará TODO tu progreso (nivel, XP, historial, rutinas). ¿Seguro?')) return;
  if (!confirm('Última oportunidad, cazador. ¿Borrar todo de verdad?')) return;
  data = defaultData();
  builder = null;
  save();
  renderAll();
  $('welcomeOverlay').classList.add('show');
}

/* ============================================================
   FONDO DE ESTRELLAS
   ============================================================ */
function buildStars() {
  const c = $('stars');
  for (let i = 0; i < 70; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = Math.random() * 2 + 1;
    s.style.cssText = 'left:' + (Math.random() * 100) + 'vw;top:' + (Math.random() * 100) + 'vh;' +
      'width:' + size + 'px;height:' + size + 'px;animation-delay:' + (Math.random() * 4) + 's;' +
      'animation-duration:' + (3 + Math.random() * 4) + 's;';
    c.appendChild(s);
  }
}

/* ============================================================
   RENDER GLOBAL E INICIO
   ============================================================ */
function renderAll() {
  renderStatus();
  renderDungeon();
  renderGoals();
  renderCalendar();
  renderStrength();
  renderQuests();
  renderTrain();
  renderPRs();
  renderHistory();
  renderExerciseChart();
  renderStats();
  renderBody();
  renderDiet();
  renderInventory();
  renderAchievements();
}

function init() {
  buildStars();
  $('bodyDate').value = todayStr();
  $('dietDate').value = todayStr();

  // Pestañas
  document.querySelectorAll('.tab-btn').forEach(b => b.onclick = () => {
    document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    $('tab-' + b.dataset.tab).classList.add('active');
  });

  // Entrenamiento
  $('btnEmptyWorkout').onclick = startEmptyWorkout;
  $('btnNewRoutine').onclick = newRoutine;
  $('btnAddExercise').onclick = openPicker;
  $('btnFinish').onclick = finishWorkout;
  $('btnDiscard').onclick = discardBuilder;
  $('exSelect').onchange = renderExerciseChart;
  $('metricSelect').onchange = renderExerciseChart;

  // Cronómetro de sesión, descanso, notas y discos
  setInterval(updateBuildTimer, 1000);
  document.querySelectorAll('.rest-btn').forEach(b => b.onclick = () => startRest(+b.dataset.s));
  $('btnRestCancel').onclick = cancelRest;
  $('workoutNote').oninput = () => {
    if (builder && builder.mode !== 'routine') {
      builder.note = $('workoutNote').value;
      persistBuilder();
    }
  };
  $('btnPlates').onclick = () => { $('plateOverlay').classList.add('show'); renderPlates(); $('plateTarget').focus(); };
  $('btnPlatesClose').onclick = () => $('plateOverlay').classList.remove('show');
  $('plateTarget').oninput = renderPlates;
  $('plateBar').onchange = renderPlates;

  // Selector de ejercicios
  $('pickerInput').oninput = renderPicker;
  $('btnPickerClose').onclick = () => $('pickerOverlay').classList.remove('show');
  $('btnAddCustom').onclick = addCustomExercise;
  $('customExName').addEventListener('keydown', e => { if (e.key === 'Enter') addCustomExercise(); });

  // Rutinas
  $('btnSaveRoutine').onclick = openRoutineModal;
  $('btnConfirmRoutine').onclick = confirmSaveRoutine;
  $('btnCancelRoutine').onclick = () => $('routineOverlay').classList.remove('show');
  $('routineName').addEventListener('keydown', e => { if (e.key === 'Enter') confirmSaveRoutine(); });

  // Cuerpo
  $('btnSaveBody').onclick = saveBody;
  $('bodyDate').onchange = fillBodyForm;
  fillBodyForm();
  $('measureSelect').innerHTML = MEASURES.map(([k, label, unit]) =>
    '<option value="' + k + '">' + label + ' (' + unit + ')</option>').join('');
  $('measureSelect').onchange = renderBody;
  $('photoInput').onchange = e => { addPhotoFile(e.target.files[0]); e.target.value = ''; };
  $('btnAddPhoto').onclick = () => $('photoInput').click();
  renderPhotos();

  // Historial: búsqueda
  $('histSearch').oninput = () => { histAll = false; renderHistory(); };

  // Informe semanal
  $('btnCloseReport').onclick = closePopup;

  // Dieta
  $('btnSaveDiet').onclick = saveDiet;
  $('dietDate').onchange = fillDietForm;
  $('btnSaveGoals').onclick = saveGoals;
  fillDietForm();

  // Datos
  $('btnExport').onclick = exportData;
  $('fileImport').onchange = e => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ''; };
  $('btnReset').onclick = resetData;
  $('btnSaveName').onclick = () => {
    const n = $('nameInput').value.trim();
    if (!n) return;
    data.profile.name = n;
    save();
    renderStatus();
    toast('SISTEMA', 'Nombre actualizado, cazador ' + n);
  };

  // Perfil al crear cuenta: cazador (Jin-Woo) o cazadora (Cha Hae-In)
  let welcomeGender = 'm';
  document.querySelectorAll('.gender-btn').forEach(b => b.onclick = () => {
    welcomeGender = b.dataset.g;
    document.querySelectorAll('.gender-btn').forEach(x => x.classList.toggle('selected', x === b));
  });

  // Overlays
  $('btnCloseLevel').onclick = closePopup;
  $('achOverlay').onclick = closePopup;
  $('btnClosePenalty').onclick = closePopup;
  $('btnAcceptSpecial').onclick = closePopup;
  $('btnCloseBoss').onclick = closePopup;

  // Tarjeta de cazador
  $('btnCard').onclick = shareCard;

  // Calendario
  $('btnCalPrev').onclick = () => moveCal(-1);
  $('btnCalNext').onclick = () => moveCal(1);

  // Objetivos
  $('goalExList').innerHTML = EXERCISE_DB.map(e => '<option value="' + esc(e.name) + '">').join('');
  $('btnAddGoal').onclick = addGoal;
  $('goalType').onchange = () => {
    $('goalExerciseField').style.display = $('goalType').value === 'lift' ? '' : 'none';
  };

  // Plantillas
  $('btnTemplates').onclick = () => { renderTemplates(); $('templateOverlay').classList.add('show'); };
  $('btnTemplatesClose').onclick = () => $('templateOverlay').classList.remove('show');

  // Recordatorio de copia de seguridad
  const registros = data.workouts.length + Object.keys(data.bodyLog).length + Object.keys(data.dietLog).length;
  if (registros >= 5) {
    const dias = data.lastBackup
      ? Math.round((new Date(todayStr() + 'T12:00:00') - new Date(data.lastBackup + 'T12:00:00')) / 86400000)
      : 999;
    if (dias > 7) toast('SISTEMA', 'Llevas tiempo sin copia de seguridad: usa EXPORTAR COPIA en Datos del jugador', 'toast-gold');
  }
  $('btnStart').onclick = () => {
    const n = $('welcomeName').value.trim();
    if (!n) { $('welcomeName').focus(); return; }
    data.profile.name = n;
    data.profile.gender = welcomeGender;
    data.penaltyChecked = todayStr();
    save();
    $('welcomeOverlay').classList.remove('show');
    toast('SISTEMA', 'Bienvenido, cazador ' + n + '. Tu entrenamiento comienza ahora.');
    renderAll();
  };
  $('welcomeName').addEventListener('keydown', e => { if (e.key === 'Enter') $('btnStart').click(); });

  if (!data.profile.name) $('welcomeOverlay').classList.add('show');

  // PWA: funciona offline cuando se sirve por http(s)
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  checkPenalties();
  weeklyReport();
  renderAll();
}

init();
