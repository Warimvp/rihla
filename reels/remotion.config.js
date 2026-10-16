import { Config } from '@remotion/cli/config'

Config.setVideoImageFormat('jpeg')
Config.setCodec('h264')
Config.setOverwriteOutput(true)
// Le Chromium préinstallé dans l'environnement (rien à télécharger) ; en local, Remotion trouve le sien.
if (process.env.RIHLA_CHROMIUM) Config.setBrowserExecutable(process.env.RIHLA_CHROMIUM)
