import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from 'react-native';
import { colors } from '@workspace/ui';

interface RadiusBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  currentRadius: number;
  onApply: (radius: number) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISTANCES = [2, 5, 7.5, 10, 20, 50];

export function RadiusBottomSheet({
  visible,
  onClose,
  currentRadius,
  onApply,
}: RadiusBottomSheetProps) {
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [tempRadius, setTempRadius] = useState(currentRadius);

  useEffect(() => {
    if (visible) {
      setTempRadius(currentRadius);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleApply = () => {
    onApply(tempRadius);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.background} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}>
          <View style={styles.handle} />

          <Text style={styles.title}>Distância Máxima</Text>
          <Text style={styles.subtitle}>
            Busque coletas dentro de um raio específico.
          </Text>

          <View style={styles.optionsContainer}>
            {DISTANCES.map(d => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.optionBtn,
                  tempRadius === d && styles.optionBtnActive,
                ]}
                onPress={() => setTempRadius(d)}>
                <Text
                  style={[
                    styles.optionText,
                    tempRadius === d && styles.optionTextActive,
                  ]}>
                  {d} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyBtnText}>Aplicar Filtro</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.primaryDark },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 30,
  },
  optionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  optionBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: { fontSize: 16, color: colors.textSecondary, fontWeight: '500' },
  optionTextActive: { color: '#FFF', fontWeight: 'bold' },
  applyBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  applyBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
