import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '../../constants/colors';

interface AvatarProps {
  url?: string | null;
  name: string;
  size?: number;
}

export default function Avatar({ url, name, size = 40 }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {url ? (
        <Image source={{ uri: url }} style={styles.image} />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: '#fff',
    fontFamily: 'Sora_600SemiBold',
  },
});
