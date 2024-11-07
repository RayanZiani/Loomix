import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const Circle = ({ size, position, duration, delay, isDarkMode }) => {
  const moveAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0.1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(moveAnim, {
            toValue: 1,
            duration: duration,
            delay: delay,
            useNativeDriver: true,
          }),
          Animated.timing(moveAnim, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: duration / 2,
            delay: delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isDarkMode ? '#333333' : '#E0E0E0',
          transform: [
            {
              translateY: moveAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [position.y, position.y - 100],
              }),
            },
            {
              translateX: moveAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [position.x, position.x + 50],
              }),
            },
          ],
          opacity: opacityAnim,
        },
      ]}
    />
  );
};

export default function AnimatedBackground({ isDarkMode }) {
  const circles = [
    { size: 150, position: { x: -30, y: height - 100 }, duration: 8000, delay: 0 },
    { size: 100, position: { x: width - 100, y: height - 200 }, duration: 10000, delay: 1000 },
    { size: 200, position: { x: width / 2 - 100, y: height - 150 }, duration: 12000, delay: 2000 },
    { size: 80, position: { x: 50, y: height - 300 }, duration: 9000, delay: 3000 },
    { size: 120, position: { x: width - 150, y: height - 400 }, duration: 11000, delay: 4000 },
  ];

  return (
    <View style={styles.container}>
      {circles.map((circle, index) => (
        <Circle key={index} {...circle} isDarkMode={isDarkMode} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
  },
});