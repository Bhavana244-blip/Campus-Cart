import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface LevelBadgeProps {
  level: number;
  xp: number;
  size?: 'sm' | 'md' | 'lg';
}

const LEVELS = [
  { level: 1, minXp: 0,    label: 'Freshman',    color: '#9B99B8', icon: '🎓' },
  { level: 2, minXp: 100,  label: 'Trader',      color: '#059669', icon: '🤝' },
  { level: 3, minXp: 300,  label: 'Hustler',     color: '#2563EB', icon: '🔥' },
  { level: 4, minXp: 700,  label: 'Legend',      color: '#7C3AED', icon: '✨' },
  { level: 5, minXp: 1500, label: 'SRM Elite',   color: '#F4622A', icon: '👑' },
];

export default function LevelBadge({ level, xp, size = 'md' }: LevelBadgeProps) {
  const currentLevel = LEVELS.find(l => l.level === level) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.level === level + 1);
  const progress = nextLevel ? ((xp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) : 1;

  const isLg = size === 'lg';
  const isSm = size === 'sm';

  return (
    <View style={[styles.container, isLg && styles.containerLg, isSm && styles.containerSm]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: currentLevel.color + '20' }]}>
          <Text style={[styles.icon, isLg && styles.iconLg]}>{currentLevel.icon}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>{currentLevel.label}</Text>
          <Text style={styles.levelText}>LEVEL {level}</Text>
        </View>
        <View style={styles.xpContainer}>
          <Text style={styles.xpText}>{xp} XP</Text>
        </View>
      </View>

      {!isSm && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressSubText}>Lv.{level}</Text>
            {nextLevel ? (
              <Text style={styles.progressSubText}>{nextLevel.minXp - xp} XP to next level</Text>
            ) : (
              <Text style={styles.progressSubText}>Max Level</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  containerLg: {
    padding: 20,
    borderRadius: 24,
  },
  containerSm: {
    padding: 10,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  iconLg: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: Colors.text,
  },
  levelText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    color: Colors.primary,
    letterSpacing: 1,
  },
  xpContainer: {
    alignItems: 'flex-end',
  },
  xpText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: Colors.text,
  },
  progressSection: {
    marginTop: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F1F0F8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressSubText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 9,
    color: Colors.muted,
    textTransform: 'uppercase',
  },
});
