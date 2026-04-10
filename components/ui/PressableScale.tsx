import React, { useRef } from 'react';
import { Animated, TouchableWithoutFeedback, ViewStyle, StyleProp } from 'react-native';

interface PressableScaleProps {
  children: React.ReactNode;
  onPress?: (event?: any) => void;
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
  activeOpacity?: number;
  disabled?: boolean;
}

export default function PressableScale({ 
  children, 
  onPress, 
  style, 
  scaleValue = 0.96,
  activeOpacity = 0.9,
  disabled = false
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.spring(scale, {
        toValue: scaleValue,
        useNativeDriver: true,
        speed: 50,
        bounciness: 10,
      }),
      Animated.timing(opacity, {
        toValue: activeOpacity,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
  };

  const onPressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View style={[
        style, 
        { transform: [{ scale }], opacity }
      ]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}
