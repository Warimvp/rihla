#!/usr/bin/env python3
"""Génère la voix off des pubs (public/voix/<voix>/<pub>-<id>.mp3) avec les voix marocaines de Microsoft.

    python3 -m venv .venv-voix && .venv-voix/bin/pip install edge-tts
    .venv-voix/bin/python scripts/voix.py                # jamal et mouna
    .venv-voix/bin/python scripts/voix.py --voix jamal   # une seule

Pour chaque réplique de src/textes/voix.json :
  1. on synthétise au débit normal et on mesure ;
  2. si la réplique dépasse sa fenêtre (`limite` - `debut`), on la refait en accélérant juste ce qu'il faut
     (la synthèse accélère mieux qu'un étirement après coup) ; au-delà de +30 %, on le dit : il faut raccourcir le texte ;
  3. on coupe le silence de tête et de queue (la voix démarre à l'instant `debut`) et on ramène le niveau à −16 LUFS.

Le paquet edge-tts passe par le service « lecture à voix haute » d'Edge, sans clé : usage non officiel de Microsoft.
Pour une campagne payante, mêmes voix via Azure Speech avec une clé.
"""
import argparse
import asyncio
import json
import math
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import edge_tts

RACINE = Path(__file__).resolve().parent.parent
VOIX = {"jamal": "ar-MA-JamalNeural", "mouna": "ar-MA-MounaNeural"}
MARGE = 0.15  # la réplique finit au moins 0,15 s avant sa limite
ACCELERATION_MAX = 30  # en %


def sh(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout


def duree(fichier):
    return float(sh("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(fichier)))


async def synthetiser(texte, voix, debit, sortie):
    # debit = pourcentage (0 = normal) ; edge-tts veut « +12% » / « -5% »
    # Derrière un proxy (conteneur de dev), le WebSocket n'en hérite pas tout seul : on le lui donne.
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    await edge_tts.Communicate(texte, voix, rate=f"{debit:+d}%", proxy=proxy).save(str(sortie))


def finir(brut, sortie):
    """Silences de tête et de queue retirés, niveau égalisé, mp3 final."""
    couper = "silenceremove=start_periods=1:start_threshold=-45dB:start_duration=0.02"
    chaine = f"{couper},areverse,{couper},areverse,loudnorm=I=-16:TP=-1.5:LRA=11"
    sh("ffmpeg", "-v", "error", "-y", "-i", str(brut), "-af", chaine, "-ar", "44100", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "192k", str(sortie))


async def une_replique(pub, r, nom, voix, dossier, tmp):
    fenetre = r["limite"] - r["debut"] - MARGE
    brut = tmp / f"{nom}-{pub}-{r['id']}.mp3"
    debit = 0
    for _ in range(4):
        await synthetiser(r["texte"], voix, debit, brut)
        finir(brut, dossier / f"{pub}-{r['id']}.mp3")
        d = duree(dossier / f"{pub}-{r['id']}.mp3")
        if d <= fenetre:
            break
        debit = min(ACCELERATION_MAX + 20, debit + max(3, math.ceil((d / fenetre - 1) * 100)))
    etat = "ok" if d <= fenetre else "TROP LONG"
    if debit > ACCELERATION_MAX and etat == "ok":
        etat = "accélérée au-delà de +30 % : à raccourcir"
    print(f"  {nom:6} {pub}-{r['id']:12} {d:5.2f} s / {fenetre:4.2f} s  débit {debit:+3d} %  {etat}")
    return d <= fenetre and debit <= ACCELERATION_MAX


async def main():
    p = argparse.ArgumentParser()
    p.add_argument("--voix", choices=[*VOIX, "toutes"], default="toutes")
    args = p.parse_args()
    repliques = json.loads((RACINE / "src/textes/voix.json").read_text(encoding="utf8"))
    voix = VOIX if args.voix == "toutes" else {args.voix: VOIX[args.voix]}
    bien = True
    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t)
        for nom, identifiant in voix.items():
            dossier = RACINE / "public/voix" / nom
            dossier.mkdir(parents=True, exist_ok=True)
            for pub in ("pub1", "pub4"):
                for r in repliques[pub]:
                    bien &= await une_replique(pub, r, nom, identifiant, dossier, tmp)
    sys.exit(0 if bien else 1)


asyncio.run(main())
