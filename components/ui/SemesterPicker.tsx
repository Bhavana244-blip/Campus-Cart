import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';

interface SemesterPickerProps {
  selectedSemester: number | null;
  onSelect: (semester: number | null) => void;
  horizontal?: boolean;
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function SemesterPicker({ selectedSemester, onSelect, horizontal = true }: SemesterPickerProps) {
  const renderPill = (sem: number) => {
    const isSelected = selectedSemester === sem;
    return (
      <TouchableOpacity
        key={sem}
        onPress={() => onSelect(isSelected ? null : sem)}
        style={[
          styles.pill,
          isSelected && styles.pillSelected,
          !horizontal && styles.pillVertical
        ]}
      >
        <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
          SEM {sem}
        </Text>
      </TouchableOpacity>
    );
  };

  if (horizontal) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalContainer}
      >
        {SEMESTERS.map(renderPill)}
      </ScrollView>
    );
  }

  return (
    <View style={styles.verticalContainer}>
      <View style={styles.grid}>
        {SEMESTERS.map(renderPill)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  horizontalContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  verticalContainer: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  pillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillVertical: {
    flexGrow: 1,
    minWidth: '22%',
  },
  pillText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13,
    color: Colors.muted,
  },
  pillTextSelected: {
    color: '#fff',
  },
});
