import { useEffect, useRef } from 'react'
import { sensPour } from '../i18n.js'
import { nomLangue } from '../data/langues.js'
import { estBonneOption } from '../lib/barid.js'
import { Coche, Croix } from './Icones.jsx'
import { Ecoute } from './Ecoute.jsx'
import { Pastille } from './Communs.jsx'
import { MotCible, Romanisation } from './MotCible.jsx'

/**
 * Une question de duel (Barid, Course) : la carte du mot, l'invite, les
 * quatre options, le bandeau de correction et « Continuer ». La question
 * vient de `construireBarid` (comprendre : mot cible → sens ; produire :
 * sens → mot cible). Les slots `enTete` et `sousEnTete` reçoivent ce qui
 * diffère d'un duel à l'autre (chrono, adversaire, code de salle).
 *
 * Accessibilité (mêmes règles que les leçons) : après la révélation les
 * options passent en aria-disabled — jamais disabled, qui éjecte le focus ;
 * le bandeau est un role="status" toujours monté ; l'invite reçoit le focus à
 * chaque avancée.
 */
export function QuestionDuel({ t, locale, source, question, iQuestion, total, choix, surChoisir, surContinuer, enTete, sousEnTete }) {
  const invite = useRef(null)
  useEffect(() => {
    invite.current?.focus()
  }, [iQuestion])

  if (!question) return null

  const bonneOption = question.options.find((o) => estBonneOption(question, o))
  const aRepondu = choix !== null
  const aReussi = aRepondu && estBonneOption(question, choix)

  return (
    <div className="vue vue--pleine" style={{ gap: 16 }}>
      {enTete}
      {sousEnTete}

      <div className="carte" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Pastille langue={question.langue} taille={26} />
          <span className="texte-2" style={{ fontSize: 13, fontWeight: 500 }}>{nomLangue(question.langue, locale)}</span>
        </div>
        {question.type === 'comprendre' ? (
          <>
            <MotCible balise="div" className="mot-cible" style={{ fontSize: 26 }} texte={question.mot.t} langue={question.langue} />
            {question.mot.r ? <Romanisation balise="div" texte={question.mot.r} /> : null}
            <Ecoute t={t} texte={question.mot.t} langue={question.langue} />
          </>
        ) : (
          // Produire : le son n'arrive qu'avec la réponse, sinon il la soufflerait.
          <>
            <div className="mot-cible" style={{ fontSize: 25 }}>{sensPour(question.mot, source, question.langue.id)}</div>
            {aRepondu ? <Ecoute t={t} texte={question.mot.t} langue={question.langue} /> : null}
          </>
        )}
      </div>

      <p ref={invite} tabIndex={-1} style={{ fontSize: 15, fontWeight: 500, outline: 'none' }}>
        {question.type === 'comprendre' ? t.promptComprendre : t.promptProduire(nomLangue(question.langue, locale))}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {question.options.map((option) => {
          const estCorrecte = aRepondu && estBonneOption(question, option)
          const estFausse = aRepondu && option === choix && !estBonneOption(question, option)
          const classe = estCorrecte
            ? 'option option--correcte anim-pop'
            : estFausse
              ? 'option option--fausse anim-secouer'
              : 'option'
          return (
            <button key={option.id} type="button" className={classe} aria-disabled={aRepondu} onClick={() => surChoisir(option)}>
              <span>
                {question.type === 'comprendre' ? sensPour(option, source, question.langue.id) : <MotCible texte={option.t} langue={question.langue} />}
                {question.type === 'produire' && option.r ? <Romanisation texte={option.r} style={{ marginInlineStart: 8 }} /> : null}
              </span>
              {estCorrecte ? <Coche taille={20} trait={2.4} /> : null}
              {estFausse ? <Croix taille={20} trait={2.4} /> : null}
            </button>
          )
        })}
      </div>

      <div style={{ flex: '1 1 auto' }}></div>
      {/* Toujours monté, même vide : un lecteur d'écran n'annonce un
          role="status" que si le nœud existait AVANT que son texte change. */}
      <div
        role="status"
        aria-live="polite"
        className={aRepondu ? `bandeau-reponse ${aReussi ? 'bandeau-reponse--bonne' : 'bandeau-reponse--mauvaise'}` : 'lecteur-seul'}
      >
        {aRepondu ? (
          <>
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                background: aReussi ? 'var(--menthe)' : 'var(--terracotta)',
                color: 'var(--papier)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '0 0 auto',
              }}
            >
              {aReussi ? <Coche taille={16} trait={2.6} /> : <Croix taille={16} trait={2.6} />}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{aReussi ? t.bonneReponse : t.mauvaiseReponse}</span>
              <span style={{ fontSize: 12.5 }}>
                {aReussi ? (
                  t.encoreQuestions(total - iQuestion - 1)
                ) : (
                  <>
                    {t.laBonneEtait}{' '}
                    {question.type === 'comprendre' ? sensPour(bonneOption, source, question.langue.id) : <MotCible texte={bonneOption.t} langue={question.langue} />}
                  </>
                )}
              </span>
            </span>
          </>
        ) : null}
      </div>
      {aRepondu ? (
        <button type="button" className="bouton bouton--primaire bouton--pleine" onClick={surContinuer}>
          {t.continuer}
        </button>
      ) : null}
    </div>
  )
}
