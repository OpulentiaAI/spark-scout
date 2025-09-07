'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { GoogleLogo, GithubLogo } from '@phosphor-icons/react';

type ProviderMap = Record<string, { id: string; name: string }>;

export function SocialAuthProviders() {
  const [providers, setProviders] = useState<ProviderMap>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/providers')
      .then(async (res) => {
        if (!res.ok) return {} as ProviderMap;
        return (await res.json()) as ProviderMap;
      })
      .then((data) => {
        if (!cancelled) {
          setProviders(data || {});
          setLoaded(true);
        }
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const hasGoogle = !!providers.google;
  const hasGitHub = !!providers.github;

  if (!loaded) return null;

  if (!hasGoogle && !hasGitHub) {
    return (
      <div className="text-sm text-muted-foreground">
        No OAuth providers are configured.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {hasGoogle && (
        <Button
          variant="outline"
          type="button"
          onClick={() => signIn('google')}
          className="w-full"
        >
          <GoogleLogo className="mr-2 h-4 w-4" />
          Continue with Google
        </Button>
      )}
      {hasGitHub && (
        <Button
          variant="outline"
          type="button"
          onClick={() => signIn('github')}
          className="w-full"
        >
          <GithubLogo className="mr-2 h-4 w-4" />
          Continue with GitHub
        </Button>
      )}
    </div>
  );
}
