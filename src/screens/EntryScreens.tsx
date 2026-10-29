import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from '../components/BrandMark';
import { useAura } from '../state/AppContext';

const INTRO_PAGES = [
  {
    eyebrow: 'A clearer view',
    title: 'Make your money easier to understand.',
    body: 'Bring spending, saving and planning into one calm, simple view.',
    icon: 'analytics-outline' as const,
    artTitle: 'A clear picture',
    artSubtitle: 'Income · spending · savings',
  },
  {
    eyebrow: 'Your choices',
    title: 'Plan for everyday life and bigger goals.',
    body: 'Compare budget approaches, explore estimates and keep your next steps in sight.',
    icon: 'options-outline' as const,
    artTitle: 'Plans that fit',
    artSubtitle: 'Essentials · Personal · Business',
  },
  {
    eyebrow: 'Start in your own way',
    title: 'Explore first, decide when you are ready.',
    body: 'Explore without a profile, or create an eBudget account to personalize your experience.',
    icon: 'shield-checkmark-outline' as const,
    artTitle: 'Start in your own way',
    artSubtitle: 'Explore as a guest or create an account',
  },
];

const AmbientArtwork = ({ icon, title, subtitle }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; subtitle: string }) => {
  const { colors } = useAura();
  const motion = useSharedValue(0);
  useEffect(() => {
    motion.value = withRepeat(withTiming(1, { duration: 7200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [motion]);
  const smoke = useAnimatedStyle(() => ({
    transform: [{ translateX: motion.value * 18 }, { translateY: -motion.value * 12 }, { scale: 1 + motion.value * 0.05 }],
  }));
  return (
    <View style={[styles.artwork, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      <LinearGradient colors={[`${colors.accent}22`, colors.surfaceMuted, `${colors.business}18`]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.smoke, styles.smokeOne, { backgroundColor: colors.accent }, smoke]} />
      <Animated.View style={[styles.smoke, styles.smokeTwo, { backgroundColor: colors.business, opacity: 0.08 }, smoke]} />
      <BlurView intensity={18} tint="light" pointerEvents="none" style={StyleSheet.absoluteFill} />
      <View style={[styles.artCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name={icon} size={38} color={colors.accent} />
      </View>
      <View style={[styles.artCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.artTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.artSubtitle, { color: colors.textDim }]}>{subtitle}</Text>
        <View style={styles.artBars}>
          {[colors.essentials, colors.personal, colors.business].map((color, index) => (
            <View key={color} style={[styles.artBar, { width: `${80 - index * 17}%`, backgroundColor: `${color}BB` }]} />
          ))}
        </View>
      </View>
    </View>
  );
};

const PrimaryButton = ({ label, onPress, colors, icon }: {
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useAura>['colors'];
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}) => (
  <Pressable onPress={onPress} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: colors.accent }]}>
    {icon ? <Ionicons name={icon} size={19} color="#FFFFFF" /> : null}
    <Text style={styles.primaryLabel}>{label}</Text>
  </Pressable>
);

export const SplashScreen = () => {
  const { colors } = useAura();
  return (
    <View style={[styles.splash, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={[colors.surfaceMuted, colors.bg, colors.surface]} style={StyleSheet.absoluteFill} />
      <BrandMark size={104} />
      <Text style={[styles.brandName, { color: colors.text }]}>eBudget</Text>
      <Text style={[styles.brandCaption, { color: colors.textDim }]}>Clarity for your financial choices</Text>
    </View>
  );
};

export const OnboardingScreen = () => {
  const { colors, finishOnboarding } = useAura();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const current = INTRO_PAGES[page];
  const advance = () => page === INTRO_PAGES.length - 1 ? finishOnboarding() : setPage((value) => value + 1);
  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <LinearGradient colors={[colors.surfaceMuted, colors.bg, colors.surface]} style={StyleSheet.absoluteFill} />
      <View style={styles.onboardingTop}>
        <View style={styles.miniBrand}>
          <BrandMark size={32} />
          <Text style={[styles.miniBrandName, { color: colors.text }]}>eBudget</Text>
        </View>
        <Pressable onPress={finishOnboarding} accessibilityRole="button">
          <Text style={[styles.skipText, { color: colors.textDim }]}>Skip</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.onboardingBody} showsVerticalScrollIndicator={false}>
        <Animated.View key={`art-${page}`} entering={FadeIn.duration(450)}>
          <AmbientArtwork icon={current.icon} title={current.artTitle} subtitle={current.artSubtitle} />
        </Animated.View>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>{current.eyebrow}</Text>
        <Text style={[styles.introTitle, { color: colors.text }]}>{current.title}</Text>
        <Text style={[styles.introBody, { color: colors.textDim }]}>{current.body}</Text>
      </ScrollView>
      <View style={[styles.onboardingFooter, { paddingBottom: Math.max(insets.bottom, 18) }]}>
        <View style={styles.dots}>
          {INTRO_PAGES.map((item, index) => (
            <Pressable
              key={item.eyebrow}
              accessibilityRole="button"
              accessibilityLabel={`Go to introduction page ${index + 1}`}
              onPress={() => setPage(index)}
              style={[styles.dot, { width: index === page ? 24 : 7, backgroundColor: index === page ? colors.accent : colors.border }]}
            />
          ))}
        </View>
        <PrimaryButton label={page === INTRO_PAGES.length - 1 ? 'Get started' : 'Continue'} onPress={advance} colors={colors} icon="arrow-forward-outline" />
      </View>
    </View>
  );
};

const SalutationPicker = ({ value, onChange, colors }: {
  value: string;
  onChange: (value: string) => void;
  colors: ReturnType<typeof useAura>['colors'];
}) => {
  const suggestions = ['', 'Mr.', 'Ms.', 'Mx.', 'Dr.', 'Prof.'];
  const custom = !suggestions.includes(value);
  return (
    <>
      <Text style={[styles.formLabel, { color: colors.textDim }]}>Title or prefix (optional)</Text>
      <View style={styles.prefixes}>
        {suggestions.map((prefix) => {
          const selected = value === prefix;
          return (
            <Pressable
              key={prefix || 'none'}
              onPress={() => onChange(prefix)}
              style={[styles.prefix, { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? `${colors.accent}18` : colors.surface }]}
            >
              <Text style={{ color: selected ? colors.accent : colors.textDim, fontWeight: '700', fontSize: 12 }}>{prefix || 'None'}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        value={custom ? value : ''}
        onChangeText={onChange}
        placeholder="Or enter a custom title"
        placeholderTextColor={colors.textDim}
        autoCapitalize="words"
        maxLength={24}
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
      />
    </>
  );
};

const GoogleMark = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.38 3.61v2.77h3.86c2.26-2.08 3.57-5.14 3.57-8.41z" />
    <Path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.92l-3.86-2.77c-1.08.72-2.46 1.15-4.09 1.15-3.14 0-5.8-2.12-6.75-4.98H1.26v2.86A12 12 0 0 0 12 24z" />
    <Path fill="#FBBC05" d="M5.25 14.48a7.2 7.2 0 0 1 0-4.96V6.66H1.26a12 12 0 0 0 0 10.68z" />
    <Path fill="#EA4335" d="M12 4.77c1.77 0 3.36.61 4.61 1.82l3.45-3.45C17.95 1.16 15.23 0 12 0A12 12 0 0 0 1.26 6.66l3.99 2.86C6.2 6.89 8.86 4.77 12 4.77z" />
  </Svg>
);

const ProviderOptions = ({ colors, heading }: {
  colors: ReturnType<typeof useAura>['colors'];
  heading: string;
}) => (
  <View style={[styles.providerPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <Text style={[styles.providerHeading, { color: colors.text }]}>{heading}</Text>
    <Text style={[styles.providerCaption, { color: colors.textDim }]}>
      {heading === 'Sign up with'
        ? 'Create your eBudget account with a provider when sign-up is available.'
        : 'Choose a provider to sign in when provider access is available.'}
    </Text>
    <View style={styles.providerButtons}>
      <View style={[styles.provider, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
        <GoogleMark />
        <View style={styles.providerCopy}>
          <Text style={[styles.providerLabel, { color: colors.text }]}>Google</Text>
          <Text style={[styles.providerStatus, { color: colors.textDim }]}>Coming soon</Text>
        </View>
      </View>
      <View style={[styles.provider, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
        <Ionicons name="logo-apple" size={20} color={colors.text} />
        <View style={styles.providerCopy}>
          <Text style={[styles.providerLabel, { color: colors.text }]}>Apple</Text>
          <Text style={[styles.providerStatus, { color: colors.textDim }]}>Coming soon</Text>
        </View>
      </View>
    </View>
  </View>
);

export const AuthenticationScreen = () => {
  const { colors, startGuestSession, startProfilePreview } = useAura();
  const insets = useSafeAreaInsets();
  const [authView, setAuthView] = useState<'welcome' | 'create' | 'sign-in'>('welcome');
  const [displayName, setDisplayName] = useState('');
  const [salutation, setSalutation] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState('');
  const createAccount = () => {
    if (!displayName.trim()) {
      setError('Enter your name to continue.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    if (!acceptedTerms) {
      setError('Please accept the Privacy Policy and Terms to continue.');
      return;
    }
    setPassword('');
    setConfirmPassword('');
    startProfilePreview({ displayName: displayName.trim(), salutation: salutation.trim(), email: email.trim() });
  };
  const openAccountForm = (view: 'create' | 'sign-in') => {
    setAuthView(view);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };
  const returnToWelcome = () => {
    setAuthView('welcome');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };
  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }];
  const passwordInput = (value: string, onChangeText: (text: string) => void, visible: boolean, setVisible: (next: boolean) => void, placeholder: string) => (
    <View style={[styles.passwordInput, { borderColor: colors.border, backgroundColor: colors.bg }]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        autoCapitalize="none"
        autoComplete="off"
        secureTextEntry={!visible}
        style={[styles.passwordTextInput, { color: colors.text }]}
      />
      <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'} onPress={() => setVisible(!visible)} style={styles.passwordVisibility}>
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textDim} />
      </Pressable>
    </View>
  );
  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <LinearGradient colors={[colors.surfaceMuted, colors.bg, colors.surface]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.authContent, { paddingBottom: Math.max(insets.bottom, 24) }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.authBrand}>
            <View style={styles.authGlow} />
            <BrandMark size={124} />
            <Text style={[styles.authBrandName, { color: colors.text }]}>eBudget</Text>
            <Text style={[styles.authTagline, { color: colors.textDim }]}>A considered approach to your money.</Text>
          </View>
          <View style={[styles.authPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {authView === 'welcome' ? (
              <>
                <Text style={[styles.panelHeading, { color: colors.text }]}>Welcome to eBudget</Text>
                <Text style={[styles.panelCaption, { color: colors.textDim }]}>Explore your finances without adding a profile, or create an account to personalize your experience.</Text>
                <PrimaryButton label="Continue as guest" onPress={startGuestSession} colors={colors} icon="eye-outline" />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openAccountForm('create')}
                  style={[styles.secondaryButton, { borderColor: colors.border }]}
                >
                  <Ionicons name="person-add-outline" size={18} color={colors.accent} />
                  <Text style={[styles.secondaryLabel, { color: colors.text }]}>Create an account</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => openAccountForm('sign-in')} style={styles.signInLink}>
                  <Text style={[styles.signInText, { color: colors.accent }]}>Already have an account? Sign in</Text>
                </Pressable>
              </>
            ) : authView === 'create' ? (
              <>
                <Pressable onPress={returnToWelcome} style={styles.backLink}>
                  <Ionicons name="arrow-back-outline" size={18} color={colors.accent} />
                  <Text style={{ color: colors.accent, fontWeight: '700' }}>Back</Text>
                </Pressable>
                <Text style={[styles.panelHeading, { color: colors.text }]}>Create an account</Text>
                <Text style={[styles.panelCaption, { color: colors.textDim }]}>Set up your eBudget profile with the name you want displayed.</Text>
                <Text style={[styles.formLabel, { color: colors.textDim }]}>Your name</Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="First and last name"
                  placeholderTextColor={colors.textDim}
                  autoCapitalize="words"
                  maxLength={50}
                  style={inputStyle}
                  returnKeyType="done"
                />
                <SalutationPicker value={salutation} onChange={setSalutation} colors={colors} />
                <Text style={[styles.formLabel, { color: colors.textDim }]}>Email address</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textDim}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  maxLength={254}
                  style={inputStyle}
                />
                <Text style={[styles.formLabel, { color: colors.textDim }]}>Password</Text>
                {passwordInput(password, setPassword, showPassword, setShowPassword, 'At least 8 characters')}
                <Text style={[styles.formLabel, { color: colors.textDim }]}>Confirm password</Text>
                {passwordInput(confirmPassword, setConfirmPassword, showConfirmPassword, setShowConfirmPassword, 'Enter your password again')}
                <Text style={[styles.passwordHint, { color: colors.textDim }]}>Use at least 8 characters.</Text>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: acceptedTerms }}
                  onPress={() => { setAcceptedTerms((accepted) => !accepted); setError(''); }}
                  style={styles.consentRow}
                >
                  <View style={[styles.checkbox, { borderColor: acceptedTerms ? colors.accent : colors.border, backgroundColor: acceptedTerms ? colors.accent : colors.surface }]}>
                    {acceptedTerms ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
                  </View>
                  <Text style={[styles.consentText, { color: colors.text }]}>I agree to the eBudget Privacy Policy and Terms.</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => setShowTerms(true)} style={styles.policyLinkButton}>
                  <Text style={[styles.consentLink, { color: colors.accent }]}>Read Privacy Policy and Terms</Text>
                </Pressable>
                <Text style={[styles.sessionDisclosure, { color: colors.textDim }]}>
                  Your profile and entries stay in this app session and are cleared when you sign out. Passwords are not saved in this version.
                </Text>
                {error ? <Text style={{ color: colors.crimson, marginBottom: 10, fontSize: 13 }}>{error}</Text> : null}
                <PrimaryButton label="Create account" onPress={createAccount} colors={colors} icon="arrow-forward-outline" />
              </>
            ) : (
              <>
                <Pressable onPress={returnToWelcome} style={styles.backLink}>
                  <Ionicons name="arrow-back-outline" size={18} color={colors.accent} />
                  <Text style={{ color: colors.accent, fontWeight: '700' }}>Back</Text>
                </Pressable>
                <Text style={[styles.panelHeading, { color: colors.text }]}>Sign in</Text>
                <Text style={[styles.panelCaption, { color: colors.textDim }]}>Enter the email and password for your eBudget account.</Text>
                <Text style={[styles.formLabel, { color: colors.textDim }]}>Email address</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textDim}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  style={inputStyle}
                />
                <Text style={[styles.formLabel, { color: colors.textDim }]}>Password</Text>
                {passwordInput(password, setPassword, showPassword, setShowPassword, 'Your password')}
                <Text style={[styles.sessionDisclosure, { color: colors.textDim }]}>Sign-in access will be available when account security is ready.</Text>
                <View style={[styles.disabledButton, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                  <Text style={[styles.disabledButtonText, { color: colors.textDim }]}>Sign in</Text>
                </View>
              </>
            )}
          </View>
          {authView === 'welcome' ? (
            <ProviderOptions colors={colors} heading="Sign-in options" />
          ) : authView === 'create' ? (
            <ProviderOptions colors={colors} heading="Sign up with" />
          ) : (
            <ProviderOptions colors={colors} heading="Sign in with" />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal visible={showTerms} transparent animationType="fade" onRequestClose={() => setShowTerms(false)}>
        <View style={styles.policyBackdrop}>
          <View style={[styles.policyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.policyHeader}>
              <Text style={[styles.panelHeading, { color: colors.text, flex: 1 }]}>Privacy Policy and Terms</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close privacy and terms" onPress={() => setShowTerms(false)} style={styles.policyClose}>
                <Ionicons name="close-outline" size={22} color={colors.textDim} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.policyHeading, { color: colors.text }]}>Your information</Text>
              <Text style={[styles.policyBody, { color: colors.textDim }]}>
                Your name, email, and finance entries are kept for this app session and cleared when you sign out or close the app. They are not uploaded or backed up online. Appearance and onboarding preferences are saved on this device.
              </Text>
              <Text style={[styles.policyHeading, { color: colors.text }]}>Keep your details safe</Text>
              <Text style={[styles.policyBody, { color: colors.textDim }]}>
                Do not reuse a password you use for another service. Passwords entered in this version are not saved. eBudget does not ask for full card numbers, PINs, or security codes. Card tracking uses only the last four digits.
              </Text>
              <Text style={[styles.policyHeading, { color: colors.text }]}>Using eBudget</Text>
              <Text style={[styles.policyBody, { color: colors.textDim }]}>
                Budget and investment projections are estimates for planning and are not financial, tax, or investment advice. Check entries for accuracy and make financial decisions using your own judgment.
              </Text>
            </ScrollView>
            <PrimaryButton label="I understand" onPress={() => setShowTerms(false)} colors={colors} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 27, fontWeight: '900', letterSpacing: -0.5, marginTop: 16 },
  brandCaption: { fontSize: 13, marginTop: 5 },
  onboardingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 10 },
  miniBrand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  miniBrandName: { fontSize: 16, fontWeight: '800' },
  skipText: { fontSize: 14, fontWeight: '700', padding: 8 },
  onboardingBody: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingBottom: 12 },
  artwork: { height: 300, borderWidth: 1, borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  smoke: { position: 'absolute', width: 220, height: 220, borderRadius: 110, opacity: 0.12 },
  smokeOne: { left: -60, top: -65 },
  smokeTwo: { right: -40, bottom: -90 },
  artCircle: { width: 104, height: 104, borderRadius: 52, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  artCard: { width: '78%', padding: 15, borderRadius: 16, borderWidth: 1, shadowColor: '#1C2A25', shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  artTitle: { fontSize: 14, fontWeight: '800' },
  artSubtitle: { fontSize: 11, marginTop: 3 },
  artBars: { gap: 5, marginTop: 12 },
  artBar: { height: 5, borderRadius: 4 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  introTitle: { fontSize: 31, fontWeight: '800', lineHeight: 38, letterSpacing: -0.7, marginTop: 9 },
  introBody: { fontSize: 15, lineHeight: 23, marginTop: 11 },
  onboardingFooter: { paddingHorizontal: 22, paddingTop: 8 },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, marginBottom: 18 },
  dot: { height: 7, borderRadius: 5 },
  primaryButton: { minHeight: 52, borderRadius: 14, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  authContent: { flexGrow: 1, paddingHorizontal: 20, justifyContent: 'center' },
  authBrand: { height: 250, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  authGlow: { position: 'absolute', width: 230, height: 230, borderRadius: 115, backgroundColor: '#758E9C12' },
  authBrandName: { fontSize: 25, fontWeight: '900', marginTop: 10 },
  authTagline: { fontSize: 13, marginTop: 4 },
  authPanel: { borderWidth: 1, borderRadius: 22, padding: 18, marginBottom: 10 },
  providerPanel: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12 },
  providerHeading: { fontSize: 15, fontWeight: '800' },
  providerCaption: { fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: 12 },
  providerButtons: { flexDirection: 'row', gap: 9 },
  provider: { minHeight: 58, flex: 1, borderWidth: 1, borderRadius: 13, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.88 },
  providerCopy: { alignItems: 'flex-start' },
  providerLabel: { fontSize: 12, fontWeight: '700' },
  providerStatus: { fontSize: 10, marginTop: 2 },
  panelHeading: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  panelCaption: { fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 15 },
  secondaryButton: { minHeight: 50, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 9 },
  secondaryLabel: { fontSize: 14, fontWeight: '700' },
  signInLink: { alignSelf: 'center', paddingHorizontal: 8, paddingVertical: 13 },
  signInText: { fontSize: 13, fontWeight: '700' },
  passwordInput: { minHeight: 47, borderWidth: 1, borderRadius: 12, paddingLeft: 12, paddingRight: 4, marginBottom: 4, flexDirection: 'row', alignItems: 'center' },
  passwordTextInput: { flex: 1, minHeight: 44, paddingVertical: 8, fontSize: 14 },
  passwordVisibility: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  passwordHint: { fontSize: 11, marginTop: 2 },
  disabledButton: { minHeight: 48, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  disabledButtonText: { fontSize: 14, fontWeight: '800' },
  consentRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 16, marginBottom: 4 },
  checkbox: { width: 22, height: 22, borderWidth: 1.5, borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  consentText: { fontSize: 12, lineHeight: 19 },
  policyLinkButton: { alignSelf: 'flex-start', marginTop: 4, marginBottom: 8, paddingVertical: 3 },
  consentLink: { fontSize: 12, lineHeight: 19, fontWeight: '700', textDecorationLine: 'underline' },
  sessionDisclosure: { fontSize: 11, lineHeight: 16, marginBottom: 12 },
  policyBackdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.46)' },
  policyCard: { maxHeight: '82%', borderWidth: 1, borderRadius: 22, padding: 18 },
  policyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  policyClose: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  policyHeading: { fontSize: 14, fontWeight: '800', marginTop: 10, marginBottom: 5 },
  policyBody: { fontSize: 13, lineHeight: 20, marginBottom: 6 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 15, alignSelf: 'flex-start' },
  formLabel: { fontSize: 12, fontWeight: '700', marginBottom: 7, marginTop: 10 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 14, marginBottom: 4 },
  prefixes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 9 },
  prefix: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7 },
});
