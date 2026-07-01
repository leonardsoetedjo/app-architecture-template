import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { logout, setCredentials } from './authSlice';
import { useLoginMutation, useRegisterMutation, useGetMeQuery } from './authApi';
import { useSelector } from 'react-redux';
import type { RootState } from 'app/store';
import { tokenProvider } from 'shared/api/tokenProvider';

export function useAuth() {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);

  const [loginMutation, { isLoading: isLoggingIn }] = useLoginMutation();
  const [registerMutation, { isLoading: isRegistering }] = useRegisterMutation();

  const { isLoading: isLoadingProfile } = useGetMeQuery(undefined, {
    skip: !auth.accessToken,
  });

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      const result = await loginMutation({ email, password }).unwrap();
      tokenProvider.setTokens(result.accessToken, result.refreshToken);
      dispatch(
        setCredentials({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: {
            id: '',
            email: result.email,
            roles: result.roles,
            enabled: true,
          },
        })
      );
      return result;
    },
    [loginMutation, dispatch]
  );

  const handleRegister = useCallback(
    async (email: string, password: string) => {
      const result = await registerMutation({ email, password }).unwrap();
      tokenProvider.setTokens(result.accessToken, result.refreshToken);
      dispatch(
        setCredentials({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: {
            id: '',
            email: result.email,
            roles: result.roles,
            enabled: true,
          },
        })
      );
      return result;
    },
    [registerMutation, dispatch]
  );

  const handleLogout = useCallback(() => {
    tokenProvider.clearTokens();
    dispatch(logout());
    window.location.href = '/login';
  }, [dispatch]);

  return {
    user: auth.user,
    accessToken: auth.accessToken,
    isAuthenticated: !!auth.accessToken,
    isInitialized: auth.isInitialized,
    isLoading: isLoggingIn || isRegistering || isLoadingProfile,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };
}
