import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardTypeOptions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export interface InputIconProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  btn?: boolean; // Se o ícone é clicável (ex: mostrar senha)
  cb?: (state: boolean) => void; // Callback do clique
  secureTextEntry?: boolean;
  errorMsg?: string | null;
  keyboardType?: KeyboardTypeOptions;
  editable?: boolean;

  baseColor?: string;
  textColor?: string;
  errorColor?: string;
}

export const InputIcon = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  btn = false,
  cb,
  secureTextEntry = false,
  errorMsg,
  keyboardType = 'default',
  baseColor = '#757575',
  textColor = colors.text,
  errorColor = colors.error,
  editable = true,
}: InputIconProps) => {
  // Mantemos o estado interno para o botão de visualização de senha
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
        <TextInput
          style={[styles.input, { color: textColor }]}
          onChangeText={onChangeText}
          value={value}
          editable={editable}
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
  wrapper: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 5,
  },
  iconButton: {
    paddingLeft: 10,
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
  },
});
