import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from './authApi';
import { setCredentials } from './authSlice';
import { tokenProvider } from 'shared/api/tokenProvider';
import { useFormValidation } from 'shared/lib/validation';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export interface UseLoginReturn {
  values: LoginFormValues;
  touched: Record<keyof LoginFormValues, boolean>;
  errors: Partial<Record<keyof LoginFormValues, string>>;
  isValid: boolean;
  isLoading: boolean;
  apiError: string | null;
  handleChange: (field: keyof LoginFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (field: keyof LoginFormValues) => () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function useLogin(): UseLoginReturn {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [apiError, setApiError] = useState('');
  const [loginMutation, { isLoading }] = useLoginMutation();

  const [values, setValues] = useState<LoginFormValues>({ email: '', password: '' });

  const { touched, errors, isValid, touchField, touchAll } = useFormValidation(loginSchema, values);

  const handleChange = useCallback(
    (field: keyof LoginFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues(prev => ({ ...prev, [field]: e.target.value }));
      if (apiError) setApiError('');
    },
    [apiError]
  );

  const handleBlur = useCallback(
    (field: keyof LoginFormValues) => () => {
      touchField(field);
    },
    [touchField]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      touchAll();
      if (!isValid) return;
      setApiError('');
      try {
        const result = await loginMutation({
          email: values.email,
          password: values.password,
        }).unwrap();
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
        navigate('/orders');
      } catch {
        setApiError('Invalid email or password.');
      }
    },
    [values, isValid, touchAll, loginMutation, dispatch, navigate]
  );

  return {
    values,
    touched,
    errors,
    isValid,
    isLoading,
    apiError,
    handleChange,
    handleBlur,
    handleSubmit,
  };
}
