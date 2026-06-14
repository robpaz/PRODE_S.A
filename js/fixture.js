// ============================================================
// PRODE MUNDIAL FIFA 2026 — FIXTURE COMPLETO
// 64 partidos desde el Domingo 14 de junio en adelante
// Grupos A-D: solo jornadas 2 y 3 (jornada 1 ya se jugó)
// Grupos E-L: las 3 jornadas completas
// ============================================================

const EQUIPOS = {
  // GRUPO A
  MEX: { nombre: 'México', bandera: 'mx' },
  RSA: { nombre: 'Sudáfrica', bandera: 'za' },
  KOR: { nombre: 'Corea del Sur', bandera: 'kr' },
  CZE: { nombre: 'Rep. Checa', bandera: 'cz' },
  // GRUPO B
  CAN: { nombre: 'Canadá', bandera: 'ca' },
  BIH: { nombre: 'Bosnia y Herz.', bandera: 'ba' },
  QAT: { nombre: 'Qatar', bandera: 'qa' },
  SUI: { nombre: 'Suiza', bandera: 'ch' },
  // GRUPO C
  BRA: { nombre: 'Brasil', bandera: 'br' },
  MAR: { nombre: 'Marruecos', bandera: 'ma' },
  SCO: { nombre: 'Escocia', bandera: 'gb-sct' },
  HAI: { nombre: 'Haití', bandera: 'ht' },
  // GRUPO D
  USA: { nombre: 'EE.UU.', bandera: 'us' },
  PAR: { nombre: 'Paraguay', bandera: 'py' },
  AUS: { nombre: 'Australia', bandera: 'au' },
  TUR: { nombre: 'Turquía', bandera: 'tr' },
  // GRUPO E
  ALE: { nombre: 'Alemania', bandera: 'de' },
  CDM: { nombre: 'Costa de Marfil', bandera: 'ci' },
  ECU: { nombre: 'Ecuador', bandera: 'ec' },
  CUR: { nombre: 'Curazao', bandera: 'cw' },
  // GRUPO F
  PBA: { nombre: 'Países Bajos', bandera: 'nl' },
  JAP: { nombre: 'Japón', bandera: 'jp' },
  SUE: { nombre: 'Suecia', bandera: 'se' },
  TUN: { nombre: 'Túnez', bandera: 'tn' },
  // GRUPO G
  BEL: { nombre: 'Bélgica', bandera: 'be' },
  IRA: { nombre: 'Irán', bandera: 'ir' },
  NZL: { nombre: 'Nueva Zelanda', bandera: 'nz' },
  EGY: { nombre: 'Egipto', bandera: 'eg' },
  // GRUPO H
  ESP: { nombre: 'España', bandera: 'es' },
  CAB: { nombre: 'Cabo Verde', bandera: 'cv' },
  URU: { nombre: 'Uruguay', bandera: 'uy' },
  ARA: { nombre: 'Arabia Saudí', bandera: 'sa' },
  // GRUPO I
  FRA: { nombre: 'Francia', bandera: 'fr' },
  SEN: { nombre: 'Senegal', bandera: 'sn' },
  NOR: { nombre: 'Noruega', bandera: 'no' },
  IRK: { nombre: 'Irak', bandera: 'iq' },
  // GRUPO J
  ARG: { nombre: 'Argentina', bandera: 'ar' },
  ALG: { nombre: 'Argelia', bandera: 'dz' },
  AUT: { nombre: 'Austria', bandera: 'at' },
  JOR: { nombre: 'Jordania', bandera: 'jo' },
  // GRUPO K
  POR: { nombre: 'Portugal', bandera: 'pt' },
  COL: { nombre: 'Colombia', bandera: 'co' },
  UZB: { nombre: 'Uzbekistán', bandera: 'uz' },
  RDC: { nombre: 'R.D. Congo', bandera: 'cd' },
  // GRUPO L
  ING: { nombre: 'Inglaterra', bandera: 'gb-eng' },
  CRO: { nombre: 'Croacia', bandera: 'hr' },
  GHA: { nombre: 'Ghana', bandera: 'gh' },
  PAN: { nombre: 'Panamá', bandera: 'pa' },
};

function flagUrl(code) {
  return `https://flagcdn.com/w40/${code}.png`;
}

// ============================================================
// FIXTURE: 64 partidos desde Domingo 14 de junio
// Jornada 1 excluida para Grupos A, B, C, D
// ============================================================

const FIXTURE_GRUPOS = [
  {
    grupo: 'A',
    nombreGrupo: 'GRUPO A',
    equipos: ['MEX', 'RSA', 'KOR', 'CZE'],
    soloDesdeJornada2: true,  // Jornada 1 ya se jugó
    partidos: [
      // Jornada 1 (excluida - ya jugada): MEX vs RSA, KOR vs CZE
      // Jornada 2
      { id: 'A3', jornada: 2, local: 'MEX', visitante: 'KOR', fecha: 'Jue 18 Jun' },
      { id: 'A4', jornada: 2, local: 'RSA', visitante: 'CZE', fecha: 'Jue 18 Jun' },
      // Jornada 3
      { id: 'A5', jornada: 3, local: 'MEX', visitante: 'CZE', fecha: 'Mié 24 Jun' },
      { id: 'A6', jornada: 3, local: 'RSA', visitante: 'KOR', fecha: 'Mié 24 Jun' },
    ]
  },
  {
    grupo: 'B',
    nombreGrupo: 'GRUPO B',
    equipos: ['CAN', 'BIH', 'QAT', 'SUI'],
    soloDesdeJornada2: true,
    partidos: [
      // Jornada 1 (excluida - ya jugada): CAN vs BIH, QAT vs SUI
      // Jornada 2
      { id: 'B3', jornada: 2, local: 'CAN', visitante: 'QAT', fecha: 'Jue 18 Jun' },
      { id: 'B4', jornada: 2, local: 'BIH', visitante: 'SUI', fecha: 'Jue 18 Jun' },
      // Jornada 3
      { id: 'B5', jornada: 3, local: 'CAN', visitante: 'SUI', fecha: 'Mié 24 Jun' },
      { id: 'B6', jornada: 3, local: 'BIH', visitante: 'QAT', fecha: 'Mié 24 Jun' },
    ]
  },
  {
    grupo: 'C',
    nombreGrupo: 'GRUPO C',
    equipos: ['BRA', 'MAR', 'SCO', 'HAI'],
    soloDesdeJornada2: true,
    partidos: [
      // Jornada 1 (excluida - ya jugada): BRA vs MAR, SCO vs HAI
      // Jornada 2
      { id: 'C3', jornada: 2, local: 'BRA', visitante: 'SCO', fecha: 'Vie 19 Jun' },
      { id: 'C4', jornada: 2, local: 'MAR', visitante: 'HAI', fecha: 'Vie 19 Jun' },
      // Jornada 3
      { id: 'C5', jornada: 3, local: 'BRA', visitante: 'HAI', fecha: 'Jue 25 Jun' },
      { id: 'C6', jornada: 3, local: 'MAR', visitante: 'SCO', fecha: 'Jue 25 Jun' },
    ]
  },
  {
    grupo: 'D',
    nombreGrupo: 'GRUPO D',
    equipos: ['USA', 'PAR', 'AUS', 'TUR'],
    soloDesdeJornada2: true,
    partidos: [
      // Jornada 1 (excluida - ya jugada): USA vs PAR, AUS vs TUR
      // Jornada 2
      { id: 'D3', jornada: 2, local: 'USA', visitante: 'AUS', fecha: 'Vie 19 Jun' },
      { id: 'D4', jornada: 2, local: 'PAR', visitante: 'TUR', fecha: 'Vie 19 Jun' },
      // Jornada 3
      { id: 'D5', jornada: 3, local: 'USA', visitante: 'TUR', fecha: 'Jue 25 Jun' },
      { id: 'D6', jornada: 3, local: 'PAR', visitante: 'AUS', fecha: 'Jue 25 Jun' },
    ]
  },
  {
    grupo: 'E',
    nombreGrupo: 'GRUPO E',
    equipos: ['ALE', 'CDM', 'ECU', 'CUR'],
    soloDesdeJornada2: false,
    partidos: [
      // Jornada 1
      { id: 'E1', jornada: 1, local: 'ALE', visitante: 'CUR', fecha: 'Dom 14 Jun' },
      { id: 'E2', jornada: 1, local: 'CDM', visitante: 'ECU', fecha: 'Dom 14 Jun' },

      // Jornada 2
      { id: 'E3', jornada: 2, local: 'ALE', visitante: 'CDM', fecha: 'Sáb 20 Jun' },
      { id: 'E4', jornada: 2, local: 'ECU', visitante: 'CUR', fecha: 'Sáb 20 Jun' },

      // Jornada 3
      { id: 'E5', jornada: 3, local: 'ALE', visitante: 'ECU', fecha: 'Jue 25 Jun' },
      { id: 'E6', jornada: 3, local: 'CUR', visitante: 'CDM', fecha: 'Jue 25 Jun' },
    ]
  },
  {
    grupo: 'F',
    nombreGrupo: 'GRUPO F',
    equipos: ['PBA', 'JAP', 'SUE', 'TUN'],
    soloDesdeJornada2: false,
    partidos: [
      // Jornada 1
      { id: 'F1', jornada: 1, local: 'PBA', visitante: 'JAP', fecha: 'Dom 14 Jun' },
      { id: 'F2', jornada: 1, local: 'SUE', visitante: 'TUN', fecha: 'Dom 14 Jun' },

      // Jornada 2
      { id: 'F3', jornada: 2, local: 'PBA', visitante: 'SUE', fecha: 'Sáb 20 Jun' },
      { id: 'F4', jornada: 2, local: 'TUN', visitante: 'JAP', fecha: 'Sáb 20 Jun' },

      // Jornada 3
      { id: 'F5', jornada: 3, local: 'JAP', visitante: 'SUE', fecha: 'Vie 26 Jun' },
      { id: 'F6', jornada: 3, local: 'TUN', visitante: 'PBA', fecha: 'Vie 26 Jun' },
    ]
  },
  {
    grupo: 'G',
    nombreGrupo: 'GRUPO G',
    equipos: ['BEL', 'IRA', 'NZL', 'EGY'],
    soloDesdeJornada2: false,
    partidos: [
      // Jornada 1
      { id: 'G1', jornada: 1, local: 'BEL', visitante: 'EGY', fecha: 'Lun 15 Jun' },
      { id: 'G2', jornada: 1, local: 'IRA', visitante: 'NZL', fecha: 'Lun 15 Jun' },

      // Jornada 2
      { id: 'G3', jornada: 2, local: 'BEL', visitante: 'IRA', fecha: 'Dom 21 Jun' },
      { id: 'G4', jornada: 2, local: 'NZL', visitante: 'EGY', fecha: 'Dom 21 Jun' },

      // Jornada 3
      { id: 'G5', jornada: 3, local: 'EGY', visitante: 'IRA', fecha: 'Vie 26 Jun' },
      { id: 'G6', jornada: 3, local: 'NZL', visitante: 'BEL', fecha: 'Vie 26 Jun' },
    ]
  },
  {
    grupo: 'H',
    nombreGrupo: 'GRUPO H',
    equipos: ['ESP', 'CAB', 'URU', 'ARA'],
    soloDesdeJornada2: false,
    partidos: [
      { id: 'H1', jornada: 1, local: 'ESP', visitante: 'CAB', fecha: 'Lun 15 Jun' },
      { id: 'H2', jornada: 1, local: 'ARA', visitante: 'URU', fecha: 'Lun 15 Jun' },

      { id: 'H3', jornada: 2, local: 'URU', visitante: 'CAB', fecha: 'Dom 21 Jun' },
      { id: 'H4', jornada: 2, local: 'ESP', visitante: 'ARA', fecha: 'Dom 21 Jun' },

      { id: 'H5', jornada: 3, local: 'URU', visitante: 'ESP', fecha: 'Vie 26 Jun' },
      { id: 'H6', jornada: 3, local: 'CAB', visitante: 'ARA', fecha: 'Vie 26 Jun' },
    ]
  },
  {
    grupo: 'I',
    nombreGrupo: 'GRUPO I',
    equipos: ['FRA', 'SEN', 'NOR', 'IRK'],
    soloDesdeJornada2: false,
    partidos: [
      // Jornada 1
      { id: 'I1', jornada: 1, local: 'FRA', visitante: 'SEN', fecha: 'Mar 16 Jun' },
      { id: 'I2', jornada: 1, local: 'IRK', visitante: 'NOR', fecha: 'Mar 16 Jun' },

      // Jornada 2
      { id: 'I3', jornada: 2, local: 'FRA', visitante: 'IRK', fecha: 'Lun 22 Jun' },
      { id: 'I4', jornada: 2, local: 'NOR', visitante: 'SEN', fecha: 'Lun 22 Jun' },

      // Jornada 3
      { id: 'I5', jornada: 3, local: 'NOR', visitante: 'FRA', fecha: 'Vie 26 Jun' },
      { id: 'I6', jornada: 3, local: 'SEN', visitante: 'IRK', fecha: 'Vie 26 Jun' },
    ]
  },
  {
    grupo: 'J',
    nombreGrupo: 'GRUPO J',
    equipos: ['ARG', 'ALG', 'AUT', 'JOR'],
    soloDesdeJornada2: false,
    partidos: [
      // Jornada 1
      { id: 'J1', jornada: 1, local: 'ARG', visitante: 'ALG', fecha: 'Mar 16 Jun' },
      { id: 'J2', jornada: 1, local: 'AUT', visitante: 'JOR', fecha: 'Mar 16 Jun' },
      // Jornada 2
      { id: 'J3', jornada: 2, local: 'ARG', visitante: 'AUT', fecha: 'Lun 22 Jun' },
      { id: 'J4', jornada: 2, local: 'ALG', visitante: 'JOR', fecha: 'Lun 22 Jun' },
      // Jornada 3
      { id: 'J5', jornada: 3, local: 'ARG', visitante: 'JOR', fecha: 'Sáb 27 Jun' },
      { id: 'J6', jornada: 3, local: 'ALG', visitante: 'AUT', fecha: 'Sáb 27 Jun' },
    ]
  },
  {
    grupo: 'K',
    nombreGrupo: 'GRUPO K',
    equipos: ['POR', 'COL', 'UZB', 'RDC'],
    soloDesdeJornada2: false,
    partidos: [
      // Jornada 1
      { id: 'K1', jornada: 1, local: 'POR', visitante: 'RDC', fecha: 'Mié 17 Jun' },
      { id: 'K2', jornada: 1, local: 'UZB', visitante: 'COL', fecha: 'Mié 17 Jun' },

      // Jornada 2
      { id: 'K3', jornada: 2, local: 'POR', visitante: 'UZB', fecha: 'Mar 23 Jun' },
      { id: 'K4', jornada: 2, local: 'COL', visitante: 'RDC', fecha: 'Mar 23 Jun' },

      // Jornada 3
      { id: 'K5', jornada: 3, local: 'COL', visitante: 'POR', fecha: 'Sáb 27 Jun' },
      { id: 'K6', jornada: 3, local: 'RDC', visitante: 'UZB', fecha: 'Sáb 27 Jun' },
    ]
  },
  {
    grupo: 'L',
    nombreGrupo: 'GRUPO L',
    equipos: ['ING', 'CRO', 'GHA', 'PAN'],
    soloDesdeJornada2: false,
    partidos: [
      // Jornada 1
      { id: 'L1', jornada: 1, local: 'ING', visitante: 'CRO', fecha: 'Mié 17 Jun' },
      { id: 'L2', jornada: 1, local: 'GHA', visitante: 'PAN', fecha: 'Mié 17 Jun' },

      // Jornada 2
      { id: 'L3', jornada: 2, local: 'ING', visitante: 'GHA', fecha: 'Mar 23 Jun' },
      { id: 'L4', jornada: 2, local: 'PAN', visitante: 'CRO', fecha: 'Mar 23 Jun' },

      // Jornada 3
      { id: 'L5', jornada: 3, local: 'PAN', visitante: 'ING', fecha: 'Sáb 27 Jun' },
      { id: 'L6', jornada: 3, local: 'CRO', visitante: 'GHA', fecha: 'Sáb 27 Jun' },
    ]
  },
];

// ============================================================
// KICKOFF / CIERRE POR HORA DE PARTIDO
// ------------------------------------------------------------
// Mapea cada fecha legible del fixture a una fecha ISO de cierre.
// Por defecto el cierre es al final del día del partido en hora de
// Bolivia (UTC-4) → día siguiente 03:59:59Z. Es un default conservador:
// no bloquea durante el día del partido, pero impide pronosticar
// partidos de días ya pasados. Se puede reemplazar por la hora exacta
// del kickoff de cada partido cuando se conozca (campo match.kickoff).
// ============================================================

const FECHA_A_FIN_DE_DIA_UTC = {
  'Dom 14 Jun': '2026-06-15T03:59:59Z',
  'Lun 15 Jun': '2026-06-16T03:59:59Z',
  'Mar 16 Jun': '2026-06-17T03:59:59Z',
  'Mié 17 Jun': '2026-06-18T03:59:59Z',
  'Jue 18 Jun': '2026-06-19T03:59:59Z',
  'Vie 19 Jun': '2026-06-20T03:59:59Z',
  'Sáb 20 Jun': '2026-06-21T03:59:59Z',
  'Dom 21 Jun': '2026-06-22T03:59:59Z',
  'Lun 22 Jun': '2026-06-23T03:59:59Z',
  'Mar 23 Jun': '2026-06-24T03:59:59Z',
  'Mié 24 Jun': '2026-06-25T03:59:59Z',
  'Jue 25 Jun': '2026-06-26T03:59:59Z',
  'Vie 26 Jun': '2026-06-27T03:59:59Z',
  'Sáb 27 Jun': '2026-06-28T03:59:59Z',
};

// Enriquecer cada partido con su kickoff (cierre) ISO si no lo tiene definido.
FIXTURE_GRUPOS.forEach(g => {
  g.partidos.forEach(m => {
    if (!m.kickoff && FECHA_A_FIN_DE_DIA_UTC[m.fecha]) {
      m.kickoff = FECHA_A_FIN_DE_DIA_UTC[m.fecha];
    }
  });
});

// Flat list of all 64 included matches
const TODOS_LOS_PARTIDOS = FIXTURE_GRUPOS.flatMap(g => g.partidos);

// Total match count
const TOTAL_PARTIDOS = TODOS_LOS_PARTIDOS.length; // 64

// Índice rápido id → partido
const PARTIDOS_POR_ID = {};
TODOS_LOS_PARTIDOS.forEach(m => { PARTIDOS_POR_ID[m.id] = m; });

console.log(`✅ Fixture cargado: ${TOTAL_PARTIDOS} partidos (desde Dom 14 Jun)`);
