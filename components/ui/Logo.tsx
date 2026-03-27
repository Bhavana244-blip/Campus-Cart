import { View, Text, StyleSheet } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

export default function Logo({ size = 48, light = false }: { size?: number; light?: boolean }) {
  return (
    <View style={styles.container}>
      <ShoppingBag size={size} color={Colors.accent} strokeWidth={2.5} />
      <View style={styles.textContainer}>
        <Text style={[styles.textCampus, { fontSize: size * 0.6, color: light ? '#FFF' : Colors.primary }]}>Campus</Text>
        <Text style={[styles.textCart, { fontSize: size * 0.6 }]}>Cart</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  textContainer: {
    flexDirection: 'row',
  },
  textCampus: {
    fontFamily: 'Sora_700Bold',
    color: Colors.primary,
  },
  textCart: {
    fontFamily: 'Sora_700Bold',
    color: Colors.accent,
  },
});
