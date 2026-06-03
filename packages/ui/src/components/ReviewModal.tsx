import React, { useState, useEffect } from 'react';
import {
  Alert,
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSubmitReview } from '@workspace/db';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  donationId: string;
  revieweeId?: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  onSuccess,
  title,
  donationId,
  revieweeId,
}) => {
  const { submitReview } = useSubmitReview();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setRating(0);
      setComment('');
    }
  }, [visible]);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, e => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleSubmit = async () => {
    if (rating === 0 || submitting) return;

    if (!revieweeId) {
      Alert.alert(
        'Erro',
        'Não foi possível identificar a pessoa que será avaliada.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitReview({
        donation_id: donationId,
        reviewee_id: revieweeId,
        rating,
        comment,
      });

      if (!result.success) {
        Alert.alert('Erro', 'Não foi possível salvar sua avaliação.');
        return;
      }

      setRating(0);
      setComment('');
      Alert.alert('Sucesso!', 'Sua avaliação foi registrada.');
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setRating(0);
    setComment('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.overlay, { paddingBottom: keyboardHeight }]}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
              <Text style={styles.title}>{title}</Text>

              {/* Estrelas */}
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <Text
                      style={[
                        styles.star,
                        rating >= star && styles.starSelected,
                      ]}>
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder="Deixe um comentário (opcional)"
                placeholderTextColor="#94A3B8"
                value={comment}
                onChangeText={setComment}
                multiline
              />

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={handleClose}
                  disabled={submitting}
                  style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Depois</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit}
                  style={[
                    styles.submitBtn,
                    (rating === 0 || submitting) && styles.submitBtnDisabled,
                  ]}
                  disabled={rating === 0 || submitting}>
                  <Text style={styles.submitText}>
                    {submitting ? 'Enviando...' : 'Avaliar'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.bottomSpacer} />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1E293B',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  star: {
    fontSize: 44,
    color: '#E2E8F0',
    marginHorizontal: 4,
  },
  starSelected: {
    color: '#F59E0B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
    color: '#1E293B',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelBtn: {
    padding: 16,
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  cancelText: {
    color: '#64748B',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitBtn: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#A7F3D0',
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bottomSpacer: {
    height: 60,
    width: '100%',
  },
});
