import { continueRender, delayRender } from 'remotion'
// Les mêmes fichiers que l'app (public/polices/) : pas de copie à tenir à jour.
import '../../public/polices/polices.css'

// Les polices embarquées de l'app (mêmes fichiers que public/polices/). Chaque sous-ensemble ne se charge
// qu'à la demande : on force ceux dont une image a besoin AVANT la capture, sinon le premier rendu
// partirait avec la police de repli.
const ECHANTILLONS = [
  ['400 40px "Amiri"', 'مرحبا بكم في رحلة'],
  ['700 40px "Amiri"', 'مرحبا بكم في رحلة'],
  ['400 40px "Young Serif"', 'MaRihla 1325'],
  ['400 40px "Readex Pro"', 'Rihla 9:41 ·'],
  ['500 40px "Readex Pro"', 'Rihla 9:41 · مرحبا'],
  ['600 40px "Readex Pro"', 'Rihla 9:41 · مرحبا'],
  ['700 40px "Readex Pro"', 'Rihla 9:41 · مرحبا'],
  ['400 40px "Readex Pro"', 'مرحبا بكم'],
]

export const attendrePolices = () => {
  const poignee = delayRender('polices')
  Promise.all(ECHANTILLONS.map(([police, texte]) => document.fonts.load(police, texte)))
    .then(() => document.fonts.ready)
    .then(() => continueRender(poignee))
    .catch((e) => {
      console.error('polices', e)
      continueRender(poignee)
    })
}
