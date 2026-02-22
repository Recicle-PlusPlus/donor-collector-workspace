import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardTypeOptions,
} from 'react-native';
import { MaskedTextInput } from 'react-native-mask-text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export interface InputIconMaskProps {
  label: string;
  value: string;
  onChangeText: (text: string, rawText: string) => void; // Passa o texto com máscara e sem máscara
  mask: string;
  placeholder?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  btn?: boolean;
  cb?: (state: boolean) => void;
  secureTextEntry?: boolean;
  errorMsg?: string | null;
  keyboardType?: KeyboardTypeOptions;
  baseColor?: string;
  textColor?: string;
  errorColor?: string;
}

export const InputIconMask = ({
  label,
  value,
  onChangeText,
  mask,
  placeholder,
  icon,
  btn = false,
  cb,
  secureTextEntry = false,
  errorMsg,
  keyboardType = 'default',
  baseColor = colors.textSecondary,
  textColor = colors.text,
  errorColor = colors.error,
}: InputIconMaskProps) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const handleIconClick = () => {
    if (btn) {
      const newState = !isSecure;
      setIsSecure(newState);
      if (cb) cb(newState);
    }
  };

  const currentColor = errorMsg ? errorColor : baseColor;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: currentColor }]}>{label}</Text>

      <View style={[styles.inputContainer, { borderColor: currentColor }]}>
        <MaskedTextInput
          mask={mask}
          style={[styles.input, { color: textColor }]}
          onChangeText={onChangeText}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={baseColor}
          keyboardType={keyboardType}
          secureTextEntry={isSecure}
          autoCapitalize="none"
        />

        {icon && (
          <TouchableOpacity
            disabled={!btn}
            onPress={handleIconClick}
            style={styles.iconButton}>
            <MaterialCommunityIcons
              name={icon}
              size={24}
              color={currentColor}
            />
          </TouchableOpacity>
        )}
      </View>

      {!!errorMsg && (
        <Text style={[styles.errorText, { color: errorColor }]}>
          {errorMsg}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { width: '100%', marginBottom: 15 },
  label: { fontSize: 14, marginBottom: 5, fontWeight: '500' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 5,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 5 },
  iconButton: { paddingLeft: 10 },
  errorText: { fontSize: 12, marginTop: 5 },
});
