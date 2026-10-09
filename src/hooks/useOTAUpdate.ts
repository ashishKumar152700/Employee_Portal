import { useEffect, useRef } from 'react';
import * as Updates from 'expo-updates';
import { AppState, AppStateStatus } from 'react-native';
import { dialog } from '../../Component/Feedback/AppDialog';

export const useOTAUpdate = (): void => {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const updateCheckInProgress = useRef<boolean>(false);

  useEffect(() => {
    let subscription: any;

    const checkForUpdates = async (): Promise<void> => {
      if (updateCheckInProgress.current) return;

      try {
        updateCheckInProgress.current = true;
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          const install = await dialog.confirm({
            title: 'Update available',
            message:
              'A new version of the app is available. Would you like to download and install it now?',
            confirmLabel: 'Install',
            cancelLabel: 'Later',
            icon: 'cloud-download-outline',
          });
          if (!install) {
            updateCheckInProgress.current = false;
            return;
          }
          const hideLoading = dialog.loading('Installing update', 'The app will restart in a moment…');
          try {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          } catch (error) {
            console.error('Error installing update:', error);
            hideLoading();
            dialog.alert('Update failed', 'Failed to install the update. Please try again.', 'error');
            updateCheckInProgress.current = false;
          }
        } else {
          updateCheckInProgress.current = false;
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
        updateCheckInProgress.current = false;
      }
    };

    // Check for updates when app starts
    checkForUpdates();

    // Check for updates when app comes to foreground
    subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkForUpdates();
      }
      appState.current = nextAppState;
    });

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);
};
