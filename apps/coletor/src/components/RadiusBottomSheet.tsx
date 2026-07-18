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
import Slider from '@react-native-community/slider';
import { colors } from '@workspace/ui';

interface RadiusBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  currentRadius: number;
  onApply: (radius: number) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  }, [visible, currentRadius]);

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
            Arraste para ajustar o raio de busca das coletas.
          </Text>

          {/* SESSÃO DO SLIDER */}
          <View style={styles.sliderContainer}>
            <Text style={styles.distanceValue}>{tempRadius} km</Text>

            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={50}
              step={1}
              value={tempRadius}
              onValueChange={value => setTempRadius(value)}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor="#E2E8F0"
              thumbTintColor={colors.primary}
            />

            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>1 km</Text>
              <Text style={styles.sliderLabelText}>50 km</Text>
            </View>
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

  sliderContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  distanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 15,
    marginTop: -5,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },

  applyBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  applyBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
