import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { ButtonDefault } from './ButtonDefault';
import { colors } from '../theme/colors';

export interface ErrorModalProps {
  title?: string;
  content: string;
  closeFunc: () => void;
  buttonText?: string;
  overlayColor?: string;
  modalColor?: string;
  titleColor?: string;
  textColor?: string;
  buttonColor?: string;
}

const { width: ScreenWidth } = Dimensions.get('window');

export const ErrorModal = ({
  title = 'Atenção',
  content,
  closeFunc,
  buttonText = 'Confirmar',
  overlayColor = 'rgba(0, 0, 0, 0.25)',
  modalColor = colors.background,
  titleColor = colors.error,
  textColor = colors.text,
  buttonColor = colors.primary,
}: ErrorModalProps) => {
  return (
    <View style={styles.absoluteOverlay}>
      {/* Fundo escuro clicável para fechar */}
      <TouchableOpacity
        style={[styles.absoluteOverlay, { backgroundColor: overlayColor }]}
        activeOpacity={1}
        onPress={closeFunc}
      />

      {/* Caixa do Modal */}
      <View
        style={[
          styles.modalBox,
          { backgroundColor: modalColor, width: ScreenWidth * 0.85 },
        ]}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        <Text style={[styles.content, { color: textColor }]}>{content}</Text>

        <View style={styles.buttonContainer}>
          <ButtonDefault
            title={buttonText}
            fun={closeFunc}
            color={buttonColor}
            textColor={modalColor}
            width={0.4}
            padding={10}
            radius={16}
            textSize={16}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  absoluteOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    elevation: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  content: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    marginTop: 10,
  },
});
