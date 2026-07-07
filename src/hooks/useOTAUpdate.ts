import { useEffect, useRef } from 'react';
import * as Updates from 'expo-updates';
import { Alert, AppState, AppStateStatus } from 'react-native';

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
          Alert.alert(
            'Update Available',
            'A new version of the app is available. Would you like to download and install it now?',
            [
              {
                text: 'Cancel',
                onPress: () => {
                  updateCheckInProgress.current = false;
                },
              },
              {
                text: 'Install',
                onPress: async () => {
                  try {
                    await Updates.fetchUpdateAsync();
                    await Updates.reloadAsync();
                  } catch (error) {
                    console.error('Error installing update:', error);
                    Alert.alert('Error', 'Failed to install the update. Please try again.');
                    updateCheckInProgress.current = false;
                  }
                },
              },
            ]
          );
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
