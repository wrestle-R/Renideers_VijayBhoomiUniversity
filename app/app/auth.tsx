import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, signup, googleLogin } = useAuth();
  const router = useRouter();

  const webClientId = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = 'https://auth.expo.io/@gavin100305/trekky-app';

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: webClientId,
    redirectUri,
    responseType: 'id_token',
    scopes: ['openid', 'profile', 'email'],
  });

  // Some environments return the result via the `response` object instead of
  // the direct return value of `promptAsync`. Listen for it and handle sign-in.
  React.useEffect(() => {
    const handleResponse = async () => {
      try {
        if (!response) return;
        console.log('🔁 Auth response changed:', JSON.stringify(response, null, 2));
        if (response.type === 'success') {
          const params = (response as any).params;
          const idToken = params?.id_token || params?.idToken;
          console.log('🔑 id_token present in response?', !!idToken);
          if (idToken) {
            try {
              await googleLogin(idToken as string);
              console.log('✅ Signed into Firebase via id_token from response');
              router.replace('/(tabs)');
            } catch (err) {
              console.error('❌ Firebase sign-in failed from response handler:', err);
            }
          } else {
            console.warn('⚠️ No id_token in response params:', params);
          }
        } else if (response.type === 'error') {
          console.error('❌ Auth error response:', response);
        } else if (response.type === 'dismiss') {
          console.log('ℹ️ Auth dismissed by user');
        }
      } catch (e) {
        console.error('Response handler exception:', e);
      }
    };
    handleResponse();
  }, [response]);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const foreground = useThemeColor({}, 'foreground');
  const primary = useThemeColor({}, 'primary');
  const primaryForeground = useThemeColor({}, 'primaryForeground');
  const card = useThemeColor({}, 'card');
  const cardForeground = useThemeColor({}, 'cardForeground');
  const muted = useThemeColor({}, 'muted');
  const mutedForeground = useThemeColor({}, 'mutedForeground');
  const border = useThemeColor({}, 'border');
  const input = useThemeColor({}, 'input');

  const handleSubmit = async () => {
    if (!email || !password) return;
    if (!isLogin && !fullName) return;

    setIsLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, fullName);
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Auth error:', error.message);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      console.log('🚀 Starting Google login...');
      console.log('Client ID:', webClientId);
      console.log('Redirect URI:', redirectUri);
      
      if (!promptAsync) throw new Error('Google auth not initialized');
      
      console.log('📱 Calling promptAsync...');
      console.log('🔗 Auth request URL (open in browser to debug):', request?.url || 'request.url not available yet');
      const result = await promptAsync({ useProxy: true } as any);
      
      console.log('📦 Google auth result type:', result.type);
      console.log('📦 Full result:', JSON.stringify(result, null, 2));
      
      if (result.type !== 'success') {
        console.error('❌ Auth failed. Result type:', result.type);
        throw new Error(`Google Sign-In failed: ${result.type}`);
      }
      
      const params = (result as any).params;
      console.log('📋 Result params:', JSON.stringify(params, null, 2));
      
      const idToken = params?.id_token || params?.idToken;
      console.log('🔑 ID Token present:', !!idToken);
      console.log('🔑 ID Token (first 50 chars):', idToken?.substring(0, 50));
      
      if (!idToken) {
        console.error('❌ No id_token in params. Available keys:', Object.keys(params || {}));
        throw new Error('No id_token returned from Google');
      }
      
      console.log('🔥 Calling Firebase googleLogin...');
      await googleLogin(idToken as string);
      
      console.log('✅ Google login successful!');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('❌ Google login error:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      alert(`Login failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.title, { color: cardForeground }]}>
              {isLogin ? 'Login to Trekky' : 'Create an Account'}
            </Text>
            <Text style={[styles.description, { color: mutedForeground }]}>
              {isLogin ? 'Welcome back! Enter your details.' : 'Join Trekky today.'}
            </Text>
          </View>

          <View style={styles.cardContent}>
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: cardForeground }]}>Full Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: input, borderColor: border, color: foreground }]}
                  placeholder="John Doe"
                  placeholderTextColor={mutedForeground}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: cardForeground }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: input, borderColor: border, color: foreground }]}
                placeholder="m@example.com"
                placeholderTextColor={mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: cardForeground }]}>Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: input, borderColor: border, color: foreground }]}
                placeholder="••••••••"
                placeholderTextColor={mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: primary }]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={primaryForeground} />
              ) : (
                <Text style={[styles.buttonText, { color: primaryForeground }]}>
                  {isLogin ? 'Login' : 'Sign Up'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { borderColor: border }]} />
              <Text style={[styles.dividerText, { color: mutedForeground }]}>
                Or continue with
              </Text>
              <View style={[styles.dividerLine, { borderColor: border }]} />
            </View>

            <TouchableOpacity
              style={[styles.buttonOutline, { borderColor: border }]}
              onPress={handleGoogleLogin}
              disabled={isLoading}
            >
              <Text style={[styles.buttonOutlineText, { color: cardForeground }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardFooter}>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={[styles.linkText, { color: primary }]}>
                {isLogin
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 24,
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
  },
  cardHeader: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
  },
  cardContent: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  button: {
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    borderTopWidth: 1,
  },
  dividerText: {
    paddingHorizontal: 8,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  buttonOutline: {
    height: 40,
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonOutlineText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardFooter: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
  },
});
