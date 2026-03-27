import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup/step1" />
      <Stack.Screen name="signup/step2" />
      <Stack.Screen name="signup/step3" />
      <Stack.Screen name="otp" />
    </Stack>
  );
}
