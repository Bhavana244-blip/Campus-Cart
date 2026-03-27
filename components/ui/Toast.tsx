import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../constants/colors';
import { CheckCircle, AlertCircle, Info } from 'lucide-react-native';

interface ToastProps {
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
}

export default function Toast({ title, message, type = 'info', visible }: ToastProps) {
  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle size={24} color={Colors.success} />;
      case 'error': return <AlertCircle size={24} color={Colors.danger} />;
      default: return <Info size={24} color={Colors.info} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {getIcon()}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    width: width - 32,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: Colors.primary,
  },
  message: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
});
