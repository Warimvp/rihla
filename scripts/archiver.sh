#!/usr/bin/env bash
# Archive Release + export App Store. Ne téléverse rien : le .ipa produit est
# à déposer via Transporter ou Xcode Organizer (identifiants Apple du dev).
set -euo pipefail
cd "$(dirname "$0")/.."

ARCHIVE="ios/build/App.xcarchive"
SORTIE="ios/build/export"

rm -rf "$ARCHIVE" "$SORTIE"

xcodebuild archive \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE" \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM=Q9L7244W3Z \
  CODE_SIGN_STYLE=Automatic

xcodebuild -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportOptionsPlist ios/ExportOptions.plist \
  -exportPath "$SORTIE" \
  -allowProvisioningUpdates

PLIST="$ARCHIVE/Products/Applications/App.app/Info.plist"
VERSION=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$PLIST")
BUILD=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' "$PLIST")

echo
echo "✅  $SORTIE/App.ipa  —  version $VERSION (build $BUILD)"
echo "    Téléverse-le avec Transporter, puis choisis ce build dans App Store Connect."
