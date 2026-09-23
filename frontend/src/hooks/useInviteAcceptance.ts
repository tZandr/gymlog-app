import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

export type InviteAcceptanceStage = 'loading' | 'signup' | 'submitting' | 'check-email' | 'done' | 'error';

interface InvitePreviewBase {
  email: string;
  status: 'pending' | 'accepted' | 'revoked';
}

export function useInviteAcceptance<T extends InvitePreviewBase>(
  token: string | undefined,
  getPreview: (token: string) => Promise<T | null>,
  accept: (token: string) => Promise<void>,
) {
  const { user } = useAuth();
  const [preview, setPreview] = useState<T | null>(null);
  const [password, setPassword] = useState('');
  const [stage, setStage] = useState<InviteAcceptanceStage>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getPreview(token)
      .then((result) => {
        if (!result || result.status !== 'pending') {
          setError(!result ? 'Invite not found.' : 'This invite has already been used.');
          setStage('error');
          return;
        }
        setPreview(result);
        setStage('signup');
      })
      .catch(() => {
        setError('Invite not found.');
        setStage('error');
      });
  }, [token, getPreview]);

  useEffect(() => {
    if (!token || !user || stage !== 'signup') return;
    accept(token)
      .then(() => setStage('done'))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not accept invite');
        setStage('error');
      });
  }, [token, user, stage, accept]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!preview || !token) return;
    setStage('submitting');
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: preview.email,
      password,
    });
    if (signUpError) {
      setError(signUpError.message);
      setStage('signup');
      return;
    }

    if (data.session) {
      try {
        await accept(token);
        setStage('done');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not accept invite');
        setStage('error');
      }
    } else {
      setStage('check-email');
    }
  }

  return { preview, password, setPassword, stage, error, handleSignup };
}
