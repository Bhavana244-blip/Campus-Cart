import { Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import PressableScale from './PressableScale';

interface CategoryChipProps {
  label: string;
  isSelected?: boolean;
  onPress: () => void;
}

export default function CategoryChip({ label, isSelected, onPress }: CategoryChipProps) {
  return (
    <PressableScale
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onPress}
      activeOpacity={isSelected ? 1 : 0.8}
    >
      <Text style={[styles.text, isSelected && styles.selectedText]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#DDD6FE',
    marginRight: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedContainer: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  text: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13,
    color: '#6D6E9C',
  },
  selectedText: {
    color: '#fff',
  },
});
