// ─────────────────────────────────────────────
// 👑 GERARCHIA E RUOLI STAFF
// ─────────────────────────────────────────────
export const ROLES = {
  // ALTO COMANDO
  HOLDER: "1413141862906331176",
  FOUNDER: "1429034156326912124",
  CEO: "1429034157467635802",
  EXECUTIVE: "1429034166229663826",
  DIRECTOR: "1429034167781294080",

  // AMMINISTRAZIONE
  HEAD_ADMIN: "1429034175171792988",
  ADMIN: "1429034176014843944",

  // MODERAZIONE
  MANAGEMENT_MOD: "1429034177000509451",
  HEAD_MOD: "1429034177898086491",
  MOD: "1429034178766180444",

  // SUPPORTO
  HELPER: "1429034179747778560",
  TRIAL_HELPER: "1431283077824512112",
  
  // ALTRI
  STAFFER: "1429034166229663826" // Inserisci qui l'ID del ruolo generico "Staff" se ne hai uno
};

// Lista di chi gestisce le PARTNERSHIP (modifica se necessario)
export const PARTNERSHIP_HANDLERS = [
  ROLES.DIRECTOR,
  ROLES.EXECUTIVE,
  ROLES.CEO,
  ROLES.FOUNDER
];

// Lista completa dello Staff (utile per i controlli di sicurezza)
export const ALL_STAFF_IDS = Object.values(ROLES);
