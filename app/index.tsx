import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the custom splash screen to handle auth routing
  return <Redirect href="/(auth)/splash" />;
}
