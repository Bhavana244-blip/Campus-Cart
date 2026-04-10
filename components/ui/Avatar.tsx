import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '../../constants/colors';
import { getRankInfo } from '../../lib/gamify';

interface AvatarProps {
  url?: string | null;
  name: string;
  size?: number;
  level?: number;
}

export default function Avatar({ url, name, size = 40, level = 1 }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const rank = getRankInfo(level);

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <View
        style={[
          styles.container,
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: rank.color,
          },
        ]}
      >
        {url ? (
          <Image source={{ uri: url }} style={styles.image} />
        ) : (
          <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
        )}
      </View>
      
      {level > 0 && (
        <View style={[styles.levelBadge, { backgroundColor: rank.color }]}>
           <Text style={styles.levelText}>{level}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: Colors.primary,
    fontFamily: 'Sora_700Bold',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  levelText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Sora_800ExtraBold',
  },
});
