// Un registre = UN classement : « jour:2026-09-19 » (l'étape du jour, le
// même tirage pour tous — score puis temps) ou « semaine:2026-W38 » (les
// duels en direct : 3 points la victoire, 2 l'égalité, 1 la défaite).
// Un objet par clé : les classements ne se gênent pas entre eux, et chacun
// s'efface tout seul après RETENTION.
//
// Identité sans compte : le premier envoi d'un `id` fixe l'empreinte de son
// secret ; ensuite seul le même appareil peut toucher à cette ligne.
import { DurableObject } from 'cloudflare:workers'
import { NB_QUESTIONS_BARID, nettoyerNom } from '../../src/lib/barid.js'

const RETENTION = 60 * 24 * 60 * 60 * 1000
const TAILLE_PAGE = 50

const empreinte = async (secret) => {
  const octets = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(secret)))
  return [...new Uint8Array(octets)].map((o) => o.toString(16).padStart(2, '0')).join('')
}

const idValide = (id) => /^[a-z0-9-]{4,32}$/i.test(String(id ?? ''))

export class Registre extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env)
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS joueurs (
          id TEXT PRIMARY KEY,
          empreinte TEXT NOT NULL,
          nom TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS scores (
          id TEXT PRIMARY KEY,
          nom TEXT NOT NULL,
          score INTEGER NOT NULL,
          temps INTEGER NOT NULL,
          maj INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS scores_ordre ON scores (score DESC, temps ASC, maj ASC);
      `)
      if ((await this.ctx.storage.getAlarm()) === null) {
        await this.ctx.storage.setAlarm(Date.now() + RETENTION)
      }
    })
  }

  // Un score de l'étape du jour : on garde le meilleur (score, puis temps).
  async inscrire({ id, secret, nom, score, temps }) {
    if (!idValide(id) || typeof secret !== 'string' || secret.length < 8) return { ok: false, erreur: 'identite' }
    if (!Number.isInteger(score) || score < 0 || score > NB_QUESTIONS_BARID) return { ok: false, erreur: 'score' }
    const t = Number.isInteger(temps) && temps >= 0 ? Math.min(temps, 99999) : 99999
    const nomPropre = nettoyerNom(nom)
    const marque = await empreinte(secret)
    const connu = this.ctx.storage.sql.exec('SELECT empreinte FROM joueurs WHERE id = ?', id).toArray()[0]
    if (connu && connu.empreinte !== marque) return { ok: false, erreur: 'identite' }
    const maintenant = Date.now()
    this.ctx.storage.sql.exec(
      'INSERT INTO joueurs (id, empreinte, nom) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET nom = excluded.nom',
      id,
      marque,
      nomPropre
    )
    this.ctx.storage.sql.exec(
      `INSERT INTO scores (id, nom, score, temps, maj) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         nom = excluded.nom,
         temps = CASE WHEN excluded.score > scores.score OR (excluded.score = scores.score AND excluded.temps < scores.temps) THEN excluded.temps ELSE scores.temps END,
         maj = CASE WHEN excluded.score > scores.score OR (excluded.score = scores.score AND excluded.temps < scores.temps) THEN excluded.maj ELSE scores.maj END,
         score = MAX(scores.score, excluded.score)`,
      id,
      nomPropre,
      score,
      t,
      maintenant
    )
    return { ok: true, ...this.rangDe(id) }
  }

  // Les duels : appelé par une Salle (jamais depuis l'extérieur — le Worker
  // n'expose pas cette méthode). Les points s'additionnent ; `temps` compte
  // les duels joués, pour départager à points égaux (moins de duels = mieux).
  async inscrireDuel(joueurs, maintenant = Date.now()) {
    for (const j of joueurs) {
      if (!idValide(j.id)) continue
      this.ctx.storage.sql.exec(
        `INSERT INTO scores (id, nom, score, temps, maj) VALUES (?, ?, ?, 1, ?)
         ON CONFLICT(id) DO UPDATE SET nom = excluded.nom, score = scores.score + excluded.score, temps = scores.temps + 1, maj = excluded.maj`,
        j.id,
        nettoyerNom(j.nom),
        Number(j.points) || 0,
        maintenant
      )
    }
    return true
  }

  rangDe(id) {
    const moi = this.ctx.storage.sql.exec('SELECT score, temps, maj FROM scores WHERE id = ?', id).toArray()[0]
    const total = this.ctx.storage.sql.exec('SELECT COUNT(*) AS n FROM scores').one().n
    if (!moi) return { rang: null, total, moi: null }
    const devant = this.ctx.storage.sql
      .exec(
        'SELECT COUNT(*) AS n FROM scores WHERE score > ? OR (score = ? AND temps < ?) OR (score = ? AND temps = ? AND maj < ?)',
        moi.score,
        moi.score,
        moi.temps,
        moi.score,
        moi.temps,
        moi.maj
      )
      .one().n
    return { rang: devant + 1, total, moi: { score: moi.score, temps: moi.temps } }
  }

  async classement(id) {
    const lignes = this.ctx.storage.sql
      .exec('SELECT id, nom, score, temps FROM scores ORDER BY score DESC, temps ASC, maj ASC LIMIT ?', TAILLE_PAGE)
      .toArray()
      .map((l, i) => ({ rang: i + 1, id: l.id, nom: l.nom, score: l.score, temps: l.temps }))
    const { rang, total, moi } = idValide(id) ? this.rangDe(id) : { rang: null, total: lignes.length, moi: null }
    return { lignes, total, moi: moi ? { rang, ...moi } : null }
  }

  // Passé la rétention, ce classement n'intéresse plus personne.
  async alarm() {
    await this.ctx.storage.deleteAll()
  }
}
