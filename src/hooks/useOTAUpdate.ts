import { useEffect, useRef } from 'react';
import * as Updates from 'expo-updates';
import { AppState, AppStateStatus } from 'react-native';
import { dialog } from '../../Component/Feedback/AppDialog';

// How it works (EAS Update):
// - `eas update --channel <preview|production>` publishes a JS/asset bundle.
// - Builds only receive updates for their own channel (eas.json build profile)
//   and their own runtimeVersion (app.json: policy "appVersion" → "1.0.0").
//   Changing native code/config means a new build AND a new app version.
// - This hook downloads new updates silently in the background, then offers a
//   restart. If the user picks "Later", expo-updates applies the downloaded
//   update automatically on the next cold start — nobody is left behind.

const FIRST_CHECK_DELAY_MS = 3000; // let the splash finish first
const MIN_CHECK_INTERVAL_MS = 15 * 60 * 1000; // throttle foreground checks

export const useOTAUpdate = (): void => {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const checking = useRef(false);
  const lastCheckAt = useRef(0);
  const readyToApply = useRef(false); // downloaded; waiting for a restart
  const declined = useRef(false); // "Later" — don't ask again this session

  useEffect(() => {
    // expo-updates is disabled in development (Expo Go / dev client / __DEV__).
    if (__DEV__ || !Updates.isEnabled) return;

    const promptRestart = async () => {
      if (declined.current) return;
      const restartNow = await dialog.confirm({
        title: 'Update ready',
        message:
          'A new version of the app has been downloaded. Restart now to start using it?',
        confirmLabel: 'Restart',
        cancelLabel: 'Later',
        icon: 'cloud-check-outline',
      });
      if (!restartNow) {
        declined.current = true; // applied automatically on the next launch
        return;
      }
      dialog.loading('Applying update', 'The app will restart in a moment…');
      try {
        await Updates.reloadAsync();
      } catch (error) {
        console.error('Error applying update:', error);
        dialog.alert(
          'Update will apply later',
          'The update is downloaded and will be applied the next time you open the app.',
          'info'
        );
      }
    };

    const checkForUpdates = async (force = false): Promise<void> => {
      if (checking.current) return;
      if (readyToApply.current) {
        if (!declined.current) promptRestart();
        return;
      }
      const now = Date.now();
      if (!force && now - lastCheckAt.current < MIN_CHECK_INTERVAL_MS) return;

      checking.current = true;
      lastCheckAt.current = now;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (!update.isAvailable) return;

        const result = await Updates.fetchUpdateAsync();
        if (result.isNew || (result as any).isRollBackToEmbedded) {
          readyToApply.current = true;
          await promptRestart();
        }
      } catch (error) {
        // Offline / server unreachable — try again on a later foreground.
        console.warn('OTA update check failed:', (error as Error)?.message);
      } finally {
        checking.current = false;
      }
    };

    const firstCheck = setTimeout(() => checkForUpdates(true), FIRST_CHECK_DELAY_MS);

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkForUpdates();
      }
      appState.current = nextAppState;
    });

    return () => {
      clearTimeout(firstCheck);
      subscription.remove();
    };
  }, []);
};

/** Short label for support screens: which bundle is this device running? */
export const getUpdateLabel = (): string => {
  if (!Updates.isEnabled) return 'development';
  if (Updates.isEmbeddedLaunch || !Updates.updateId) return 'built-in';
  return `update ${Updates.updateId.slice(0, 8)}`;
};
