/**
 * ╔══════════════════════════════════════════════════════╗
 * ║           CENTRALNA KONFIGURACIJA PORODICE           ║
 * ║  Promijenite ove vrijednosti da biste ažurirali      ║
 * ║  naziv na svim mjestima u aplikaciji.                ║
 * ╚══════════════════════════════════════════════════════╝
 */

// Osnovno prezime (muški oblik jednine) — koristi se kao default pri unosu
export const FAMILY_SURNAME = "Додеровић";

// Množina / naziv klana (muški rod množina)
export const FAMILY_NAME_PLURAL = "Додеровићи";

// Drugi krak / ogranак porodice (npr. "Додери")
export const FAMILY_BRANCH = "Додери";

// Puni naziv — koristi se u naslovima, topbaru, logou
export const FAMILY_FULL_NAME = `${FAMILY_NAME_PLURAL} и ${FAMILY_BRANCH}`;

// Lokacija / selo
export const FAMILY_LOCATION = "";

// Naziv za browser tab
export const APP_TITLE = `${FAMILY_NAME_PLURAL} — Породична архива`;

// Naziv PDF fajla pri izvozu
export const PDF_FILENAME = "porodicno-stablo.pdf";

// Opis aplikacije (login, subtitle)
export const APP_SUBTITLE = "Систем за управљање родословом";

// Kratki opis za galeriju/istorijat
export const FAMILY_SHORT = `${FAMILY_SURNAME} и ${FAMILY_BRANCH}`;
