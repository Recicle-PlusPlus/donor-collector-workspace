import React from 'react';
import { Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { colors } from '../theme/colors';

export interface ButtonDefaultProps {
  title: string;
  color?: string;
  textColor?: string;
  textSize?: number;
  width?: number;
  padding?: number;
  opacity?: number;
  radius?: number;
  fun: () => void;
}

const { width: ScreenWidth } = Dimensions.get('window');

export const ButtonDefault = ({
  title,
  color = colors.primary,
  textColor = colors.textLight,
  textSize = 20,
  width = 0.8,
  padding = 15,
  opacity = 1,
  radius = 8,
  fun,
}: ButtonDefaultProps) => {
  return (
    <TouchableOpacity onPress={fun} activeOpacity={0.8}>
      <View
        style={{
          backgroundColor: color,
          opacity: opacity,
          width: ScreenWidth * width,
          alignItems: 'center',
          padding: padding,
          borderRadius: radius,
        }}>
        <Text
          style={{ color: textColor, fontSize: textSize, fontWeight: 'bold' }}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
