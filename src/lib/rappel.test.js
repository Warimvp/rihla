import { describe, expect, it } from 'vitest'
import { HEURE_DEFAUT, ID_RAPPEL, decouperHeure, estHeureValide, planNotification } from './rappel.js'

describe('heure du rappel', () => {
  it('accepte une heure bien formée, refuse le reste', () => {
    expect(estHeureValide('19:00')).toBe(true)
    expect(estHeureValide('00:00')).toBe(true)
    expect(estHeureValide('23:59')).toBe(true)
    expect(estHeureValide('24:00')).toBe(false)
    expect(estHeureValide('19:60')).toBe(false)
    expect(estHeureValide('9:00')).toBe(false)
    expect(estHeureValide('dix-neuf heures')).toBe(false)
    expect(estHeureValide(null)).toBe(false)
  })

  it('retombe sur l’heure par défaut quand la valeur est mauvaise', () => {
    expect(decouperHeure('07:30')).toEqual({ hour: 7, minute: 30 })
    expect(decouperHeure('n’importe quoi')).toEqual(decouperHeure(HEURE_DEFAUT))
  })
})

describe('planNotification', () => {
  it('planifie un rappel quotidien à l’heure choisie, avec un id stable', () => {
    const plan = planNotification('08:05', { titre: 'Rihla', corps: 'Ton étape du jour t’attend' })
    expect(plan.id).toBe(ID_RAPPEL)
    expect(plan.title).toBe('Rihla')
    expect(plan.body).toBe('Ton étape du jour t’attend')
    expect(plan.schedule.on).toEqual({ hour: 8, minute: 5 })
    expect(plan.schedule.allowWhileIdle).toBe(true)
  })
})
