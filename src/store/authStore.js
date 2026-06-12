import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import { deliveryLogin, setAuthToken, clearAuthToken } from '../services/api';

// Default delivery partner — auto-login with phone + 1234 OTP
const DEFAULT_PHONE = '9999999999';
const DEFAULT_OTP = '1234';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      // Partner ke manual details — local only, no auth needed
      partnerName: '',
      partnerMobile: '',
      partnerId: '',

      /** Auto-login — gets a delivery token from backend automatically */
      autoLogin: async (phone = DEFAULT_PHONE) => {
        set({ isLoading: true });
        try {
          const result = await deliveryLogin(phone, DEFAULT_OTP);
          setAuthToken(result.token);
          set({
            user: result.user,
            token: result.token,
            isLoading: false,
          });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, error: err.message };
        }
      },

      /** Set partner info locally (no backend call) */
      setPartnerInfo: (name, mobile, id) => {
        set({ partnerName: name, partnerMobile: mobile, partnerId: id });
      },

      /** Check if partner has been set up */
      isSetupComplete: () => {
        const { partnerName, partnerMobile } = get();
        return !!(partnerName && partnerMobile);
      },

      login: async (phone, otp) => {
        set({ isLoading: true });
        try {
          const result = await deliveryLogin(phone, otp);
          setAuthToken(result.token);
          set({ user: result.user, token: result.token, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, error: err.message };
        }
      },
      restoreSession: async () => {
        const { token } = get();
        if (!token) return false;
        setAuthToken(token);
        try {
          const user = await deliveryLoginWithToken(token);
          set({ user });
          return true;
        } catch { set({ user: null, token: null }); clearAuthToken(); return false; }
      },
      logout: () => { set({ user: null, token: null }); clearAuthToken(); AsyncStorage.removeItem('aaplakart-delivery-auth'); },
    }),
    { name: 'aaplakart-delivery-auth', storage: createJSONStorage(() => AsyncStorage), skipHydration: true }
  )
);
