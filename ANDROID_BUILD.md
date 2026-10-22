# Updating and building the Android app

The Android app is the same web app in `public/`, wrapped with Capacitor. The
native project lives in `android/`; Capacitor copies `public/` into
`android/app/src/main/assets/public/` and the app loads it from there. So the
Android app only changes when you **sync** and **rebuild** it.

## One-time setup

You need Node.js, a JDK 21 and the Android SDK. On this machine the SDK comes from
Homebrew's command-line tools (`android/local.properties` points at
`/opt/homebrew/share/android-commandlinetools`) and the JDK from `openjdk@21`.
macOS doesn't find the Homebrew JDK by itself, so set these in your shell
(add them to `~/.zshrc` to keep them):

```sh
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export PATH="$JAVA_HOME/bin:$PATH"
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
```

Then install the Capacitor packages once from the project root:

```sh
npm install
```

With Android Studio installed instead, you can skip the exports: it bundles a JDK
and installs the SDK, and `npm run open` opens the project in it.

## 1. Update the app with your web changes

Edit and test the web app as usual (`./run.sh`). When it's ready:

```sh
npm run sync          # = npx cap sync android
```

This copies `public/` (HTML, JS, CSS, sounds, the bundled JSON files) into the
Android project and updates native plugins. Run it after **every** change to
`public/`; a build without it still contains the old web files.

## 2. Bump the version (for a release you'll install over an older one)

In `android/app/build.gradle`:

```gradle
versionCode 2        // whole number, must go up with every release
versionName "1.1"    // what users see
```

Android refuses to install a release over one with the same or a higher
`versionCode`, so increase it every time you hand out a new APK. Debug builds
don't need it.

## 3. Build the APK

All commands run from the `android/` folder.

### Debug APK (for testing on your own phone)

```sh
cd android
./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

Signed with Android's automatic debug key. Fine for testing; not for sharing.

### Release APK (signed, for sharing)

Release signing reads `android/keystore.properties` (see
`keystore.properties.example`), which points at `android/taal-release.jks`:

```properties
storeFile=taal-release.jks
storePassword=...
keyAlias=taal
keyPassword=...
```

```sh
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

If `keystore.properties` is missing, the build still succeeds but the APK is
**unsigned** (`app-release-unsigned.apk`) and won't install.

**Back up `taal-release.jks` and its passwords somewhere safe.** Every update has to
be signed with the same key; if you lose it, phones with the app installed can't
take an update and users have to uninstall (losing their saved data) and reinstall.
Never commit the keystore or `keystore.properties`.

### Play Store bundle (optional)

The Play Store wants an AAB instead of an APK:

```sh
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

## 4. Install on a phone

Either copy the APK to the phone and open it (allow "install unknown apps" for
your file manager), or with USB debugging on:

```sh
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

`-r` replaces the installed app and keeps its data. A debug and a release build
are signed with different keys, so switching between them needs an uninstall
first (`adb uninstall com.taalstudio.app`), which deletes the app's saved
compositions, presets and sargam lines. Export them first (Settings → Export all).

## Quick reference

```sh
# after changing public/
npm run sync
# bump versionCode/versionName in android/app/build.gradle
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

## Troubleshooting

- **"Unable to locate a Java Runtime"** / **"JAVA_HOME is not set"**: the
  `export JAVA_HOME=...` line above isn't set in this terminal.
- **"SDK location not found"**: `android/local.properties` is missing or wrong;
  it should contain `sdk.dir=/opt/homebrew/share/android-commandlinetools`.
- **App still shows the old version**: you skipped `npm run sync`, or installed
  an older APK. Run `./gradlew clean` and build again if in doubt.
- **"App not installed" / "package conflicts"**: the new APK is signed with a
  different key or has a lower `versionCode` than the installed one.

## Note on `android/` and git

`.gitignore` currently lists `android/`, so the native project (including the
release signing setup in `android/app/build.gradle`) isn't in git. If the folder
is lost, `npx cap add android` recreates it, but you'd have to redo the
`signingConfigs` block, the version numbers and `local.properties`, and restore
the keystore from your backup. To keep the project but not the secrets, ignore
only those files instead:

```gitignore
android/keystore.properties
android/*.jks
android/local.properties
android/build/
android/app/build/
android/.gradle/
```
