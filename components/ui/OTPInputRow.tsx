import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Keyboard } from 'react-native';
import { Colors } from '../../constants/colors';

interface OTPInputRowProps {
  length: number;
  onComplete: (otp: string) => void;
  error?: string;
}

export default function OTPInputRow({ length, onComplete, error }: OTPInputRowProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (digits.every(d => d !== '')) {
      onComplete(digits.join(''));
      Keyboard.dismiss();
    }
  }, [digits]);

  const handleChange = (text: string, index: number) => {
    // Only keep numeric digits
    const value = text.replace(/[^0-9]/g, '');
    if (!value && text !== '') return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1].focus();
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
    }
  };

  return (
    <View style={styles.container}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => ref && (inputRefs.current[index] = ref)}
          style={[styles.input, error && styles.inputError, digit && styles.inputFilled]}
          maxLength={1}
          keyboardType="numeric"
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 16,
  },
  input: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    fontSize: 24,
    fontFamily: 'Sora_600SemiBold',
    textAlign: 'center',
    color: Colors.primary,
  },
  inputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.tagBackground,
  },
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: '#FEF2F2',
  },
});
