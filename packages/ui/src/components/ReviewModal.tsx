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
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSubmitReview } from '@workspace/db';

type ReviewerRole = 'donor' | 'collector';

interface ReviewCriterion {
  key: string;
  label: string;
  description: string;
}

const REVIEW_CRITERIA: Record<ReviewerRole, ReviewCriterion[]> = {
  donor: [
    {
      key: 'punctuality',
      label: 'Pontualidade',
      description: 'Chegou no período combinado',
    },
    {
      key: 'material_care',
      label: 'Cuidado com os materiais',
      description: 'Manuseou os itens com cuidado',
    },
    {
      key: 'communication',
      label: 'Agilidade nas respostas',
      description: 'Respondeu e manteve você informado',
    },
    {
      key: 'courtesy',
      label: 'Cordialidade',
      description: 'Foi respeitoso durante a coleta',
    },
    {
      key: 'collection_experience',
      label: 'Experiência com a coleta',
      description: 'Como foi a coleta de modo geral',
    },
  ],
  collector: [
    {
      key: 'material_condition',
      label: 'Estado do material',
      description: 'Condição dos itens entregues',
    },
    {
      key: 'description_accuracy',
      label: 'Material conforme a descrição',
      description: 'Os itens correspondiam ao que foi informado',
    },
    {
      key: 'pickup_readiness',
      label: 'Material pronto para retirada',
      description: 'Os itens estavam separados e organizados',
    },
    {
      key: 'wait_time',
      label: 'Tempo de espera',
      description: 'A entrega no local foi ágil',
    },
    {
      key: 'communication',
      label: 'Agilidade nas respostas',
      description: 'Respondeu e facilitou a combinação da coleta',
    },
  ],
};

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  donationId: string;
  revieweeId: string;
  reviewerRole: ReviewerRole;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  onSuccess,
  title,
  donationId,
  revieweeId,
  reviewerRole,
}) => {
  const { submitReview } = useSubmitReview();
  const criteria = REVIEW_CRITERIA[reviewerRole];
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setRatings({});
      setComment('');
    }
  }, [visible, reviewerRole]);

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

  const isComplete = criteria.every(criterion => ratings[criterion.key] > 0);

  const handleSubmit = async () => {
    if (!isComplete || submitting) return;

    setSubmitting(true);
    try {
      const result = await submitReview({
        donation_id: donationId,
        reviewee_id: revieweeId,
        criteria_ratings: ratings,
        comment,
      });

      if (!result.success) {
        Alert.alert('Erro', 'Não foi possível salvar sua avaliação.');
        return;
      }

      setRatings({});
      setComment('');
      Alert.alert('Sucesso!', 'Sua avaliação foi registrada.');
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setRatings({});
    setComment('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.overlay, { paddingBottom: keyboardHeight }]}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
              <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.instructions}>
                  Avalie todos os itens de 1 a 5 estrelas.
                </Text>

                {criteria.map(criterion => (
                  <View key={criterion.key} style={styles.criterion}>
                    <Text style={styles.criterionLabel}>{criterion.label}</Text>
                    <Text style={styles.criterionDescription}>
                      {criterion.description}
                    </Text>
                    <View style={styles.starsContainer}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <TouchableOpacity
                          key={star}
                          accessibilityLabel={`${criterion.label}: ${star} estrelas`}
                          accessibilityRole="button"
                          onPress={() =>
                            setRatings(current => ({
                              ...current,
                              [criterion.key]: star,
                            }))
                          }>
                          <Text
                            style={[
                              styles.star,
                              ratings[criterion.key] >= star &&
                                styles.starSelected,
                            ]}>
                            ★
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}

                <TextInput
                  style={styles.input}
                  placeholder="Deixe um comentário (opcional)"
                  placeholderTextColor="#94A3B8"
                  value={comment}
                  onChangeText={setComment}
                  multiline
                />

                {!isComplete && (
                  <Text style={styles.requiredHint}>
                    Avalie todos os itens para continuar.
                  </Text>
                )}

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
                      (!isComplete || submitting) && styles.submitBtnDisabled,
                    ]}
                    disabled={!isComplete || submitting}>
                    <Text style={styles.submitText}>
                      {submitting ? 'Enviando...' : 'Avaliar'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.bottomSpacer} />
              </ScrollView>
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
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
    color: '#1E293B',
  },
  instructions: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  criterion: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 14,
    marginBottom: 14,
  },
  criterionLabel: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  criterionDescription: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
  },
  star: {
    fontSize: 34,
    color: '#E2E8F0',
    marginHorizontal: 5,
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
  requiredHint: {
    color: '#B45309',
    fontSize: 13,
    textAlign: 'center',
    marginTop: -12,
    marginBottom: 16,
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
