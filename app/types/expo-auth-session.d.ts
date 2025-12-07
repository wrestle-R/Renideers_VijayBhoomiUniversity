declare module 'expo-auth-session' {
  export function makeRedirectUri(options?: { useProxy?: boolean }): string;
  export function startAsync(options: { authUrl: string }): Promise<any>;
}
