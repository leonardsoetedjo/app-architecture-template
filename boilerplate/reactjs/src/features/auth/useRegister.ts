import { useCallback, useState } from 'react';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { useRegisterMutation } from './authApi';
import { setCredentials } from './authSlice';
import { tokenProvider } from 'shared/api/tokenProvider';
import { useFormValidation } from 'shared/lib/validation';

const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export interface UseRegisterReturn {
  values: RegisterFormValues;
  touched: Record<keyof RegisterFormValues, boolean>;
  errors: Partial<Record<keyof RegisterFormValues, string>>;
  isValid: boolean;
  isLoading: boolean;
  apiError: string | null;
  handleChange: (
    field: keyof RegisterFormValues
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (field: keyof RegisterFormValues) => () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function useRegister(): UseRegisterReturn {
  const dispatch = useDispatch();
  const [apiError, setApiError] = useState('');
  const [registerMutation, { isLoading }] = useRegisterMutation();

  const [values, setValues] = useState<RegisterFormValues>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const { touched, errors, isValid, touchField, touchAll } = useFormValidation(
    registerSchema,
    values
  );

  const handleChange = useCallback(
    (field: keyof RegisterFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues(prev => ({ ...prev, [field]: e.target.value }));
      if (apiError) setApiError('');
    },
    [apiError]
  );

  const handleBlur = useCallback(
    (field: keyof RegisterFormValues) => () => {
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
        const result = await registerMutation({
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
      } catch {
        setApiError('Registration failed. Email may already be in use.');
      }
    },
    [values, isValid, touchAll, registerMutation, dispatch]
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
