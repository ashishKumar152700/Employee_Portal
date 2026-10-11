import AsyncStorage from '@react-native-async-storage/async-storage';

// "Keep me logged in": the login already stores accessToken + user in
// AsyncStorage; this restores them into Redux on the next cold start.
// Logout calls AsyncStorage.clear(), which also wipes the flag.

const KEEP_KEY = 'keepLoggedIn';

export const setKeepLoggedIn = (keep: boolean) =>
  AsyncStorage.setItem(KEEP_KEY, keep ? '1' : '0');

// Seconds-since-epoch expiry from a JWT, or null if it has none / isn't a JWT.
const tokenExpiry = (token: string): number | null => {
  try {
    const part = token.split('.')[1];
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=')));
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
};

/** Puts a saved session back into Redux. Returns true if the user is logged in. */
export const restoreSession = async (dispatch: (action: any) => void): Promise<boolean> => {
  try {
    const [[, keep], [, accessToken], [, userJson]] = await AsyncStorage.multiGet([
      KEEP_KEY,
      'accessToken',
      'user',
    ]);
    if (keep !== '1' || !accessToken || !userJson) return false;

    const exp = tokenExpiry(accessToken);
    if (exp !== null && exp * 1000 <= Date.now()) return false; // expired: sign in again

    const user = JSON.parse(userJson);
    dispatch({ type: 'userDetails', payload: { accessToken, user } });
    if (user.manager) dispatch({ type: 'managerInfo', payload: user.manager });
    return true;
  } catch (error) {
    console.warn('Session restore failed:', error);
    return false;
  }
};
