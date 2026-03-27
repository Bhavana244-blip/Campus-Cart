import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PackageOpen } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  buttonText?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
}

export default function EmptyState({ title, subtitle, buttonText, onPress, icon }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {icon || <PackageOpen size={48} color={Colors.muted} strokeWidth={1.5} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {buttonText && onPress && (
        <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 18,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  buttonText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
});
