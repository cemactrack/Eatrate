import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Calendar, Clock, Users, Phone, Mail, MessageSquare, X } from 'lucide-react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { trpc } from '@/lib/trpc';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ReservationBookingProps {
  restaurantId: string;
  restaurantName: string;
  visible: boolean;
  onClose: () => void;
  onSuccess?: (reservation: any) => void;
}

export default function ReservationBooking({
  restaurantId,
  restaurantName,
  visible,
  onClose,
  onSuccess,
}: ReservationBookingProps) {
  const { colors } = useSettings();
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [partySize, setPartySize] = useState<number>(2);
  const [contactInfo, setContactInfo] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [step, setStep] = useState<'date' | 'time' | 'details' | 'confirm'>('date');

  // Get availability for selected date
  const availabilityQuery = trpc.reservations.availability.useQuery(
    {
      restaurantId,
      date: selectedDate,
      partySize,
    },
    {
      enabled: !!selectedDate && !!restaurantId,
    }
  );

  // Create reservation mutation
  const createReservationMutation = trpc.reservations.create.useMutation({
    onSuccess: (data) => {
      console.log('✅ Reservation created successfully:', data);
      onSuccess?.(data.reservation);
      onClose();
      resetForm();
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Reservation Confirmed!',
          `Your reservation at ${restaurantName} has been submitted. Confirmation code: ${data.reservation.confirmationCode}`,
          [{ text: 'OK' }]
        );
      }
    },
    onError: (error) => {
      console.error('❌ Failed to create reservation:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to create reservation. Please try again.');
      }
    },
  });

  const resetForm = useCallback(() => {
    setSelectedDate('');
    setSelectedTime('');
    setPartySize(2);
    setContactInfo({ name: '', phone: '', email: '' });
    setSpecialRequests('');
    setStep('date');
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    resetForm();
  }, [onClose, resetForm]);

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
    setStep('time');
  }, []);

  const handleTimeSelect = useCallback((time: string) => {
    setSelectedTime(time);
    setStep('details');
  }, []);

  const handleCreateReservation = useCallback(async () => {
    if (!contactInfo.name.trim() || !contactInfo.phone.trim()) {
      if (Platform.OS !== 'web') {
        Alert.alert('Missing Information', 'Please provide your name and phone number.');
      }
      return;
    }

    try {
      await createReservationMutation.mutateAsync({
        restaurantId,
        date: selectedDate,
        time: selectedTime,
        partySize,
        specialRequests: specialRequests.trim() || undefined,
        contactInfo: {
          name: contactInfo.name.trim(),
          phone: contactInfo.phone.trim(),
          email: contactInfo.email.trim() || undefined,
        },
      });
    } catch (error) {
      console.error('Failed to create reservation:', error);
    }
  }, [
    contactInfo,
    createReservationMutation,
    restaurantId,
    selectedDate,
    selectedTime,
    partySize,
    specialRequests,
  ]);

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        isToday: i === 0,
      });
    }
    
    return dates;
  };

  const renderDateSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Select Date</Text>
      <Text style={[styles.stepSubtitle, { color: colors.secondary }]}>
        Choose your preferred dining date
      </Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
        <View style={styles.dateContainer}>
          {generateDateOptions().map((date) => (
            <TouchableOpacity
              key={date.value}
              onPress={() => handleDateSelect(date.value)}
              style={[
                styles.dateOption,
                {
                  backgroundColor: selectedDate === date.value ? colors.tint : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.dateLabel,
                  {
                    color: selectedDate === date.value ? 'white' : colors.text,
                    fontWeight: selectedDate === date.value ? '700' : '500',
                  },
                ]}
              >
                {date.label}
              </Text>
              {date.isToday && (
                <Text
                  style={[
                    styles.todayLabel,
                    {
                      color: selectedDate === date.value ? 'rgba(255,255,255,0.8)' : colors.secondary,
                    },
                  ]}
                >
                  Today
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderTimeSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Select Time</Text>
      <Text style={[styles.stepSubtitle, { color: colors.secondary }]}>
        Available times for {new Date(selectedDate).toLocaleDateString()}
      </Text>
      
      <View style={styles.partySizeContainer}>
        <Text style={[styles.partySizeLabel, { color: colors.text }]}>Party Size:</Text>
        <View style={styles.partySizeControls}>
          <TouchableOpacity
            onPress={() => setPartySize(Math.max(1, partySize - 1))}
            style={[styles.partySizeButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.partySizeButtonText, { color: colors.text }]}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.partySizeText, { color: colors.text }]}>{partySize}</Text>
          <TouchableOpacity
            onPress={() => setPartySize(Math.min(20, partySize + 1))}
            style={[styles.partySizeButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.partySizeButtonText, { color: colors.text }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {availabilityQuery.isLoading ? (
        <LoadingSpinner text="Checking availability..." />
      ) : (
        <View style={styles.timeGrid}>
          {availabilityQuery.data?.availableSlots.map((time) => (
            <TouchableOpacity
              key={time}
              onPress={() => handleTimeSelect(time)}
              style={[
                styles.timeOption,
                {
                  backgroundColor: selectedTime === time ? colors.tint : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.timeLabel,
                  {
                    color: selectedTime === time ? 'white' : colors.text,
                    fontWeight: selectedTime === time ? '700' : '500',
                  },
                ]}
              >
                {time}
              </Text>
            </TouchableOpacity>
          )) || []}
        </View>
      )}
      
      <TouchableOpacity
        onPress={() => setStep('date')}
        style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.backButtonText, { color: colors.text }]}>← Back to Date</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDetailsForm = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Contact Details</Text>
      <Text style={[styles.stepSubtitle, { color: colors.secondary }]}>
        We&apos;ll use this information to confirm your reservation
      </Text>
      
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <View style={styles.inputLabelContainer}>
            <Users size={16} color={colors.tint} />
            <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name *</Text>
          </View>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={contactInfo.name}
            onChangeText={(text) => setContactInfo(prev => ({ ...prev, name: text }))}
            placeholder="Enter your full name"
            placeholderTextColor={colors.secondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputLabelContainer}>
            <Phone size={16} color={colors.tint} />
            <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number *</Text>
          </View>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={contactInfo.phone}
            onChangeText={(text) => setContactInfo(prev => ({ ...prev, phone: text }))}
            placeholder="+237 XXX XXX XXX"
            placeholderTextColor={colors.secondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputLabelContainer}>
            <Mail size={16} color={colors.tint} />
            <Text style={[styles.inputLabel, { color: colors.text }]}>Email (Optional)</Text>
          </View>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={contactInfo.email}
            onChangeText={(text) => setContactInfo(prev => ({ ...prev, email: text }))}
            placeholder="your@email.com"
            placeholderTextColor={colors.secondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputLabelContainer}>
            <MessageSquare size={16} color={colors.tint} />
            <Text style={[styles.inputLabel, { color: colors.text }]}>Special Requests</Text>
          </View>
          <TextInput
            style={[styles.textAreaInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={specialRequests}
            onChangeText={setSpecialRequests}
            placeholder="Any special requests or dietary requirements..."
            placeholderTextColor={colors.secondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => setStep('time')}
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.backButtonText, { color: colors.text }]}>← Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={handleCreateReservation}
          disabled={createReservationMutation.isPending || !contactInfo.name.trim() || !contactInfo.phone.trim()}
          style={[
            styles.confirmButton,
            {
              backgroundColor: colors.tint,
              opacity: (!contactInfo.name.trim() || !contactInfo.phone.trim()) ? 0.5 : 1,
            },
          ]}
        >
          {createReservationMutation.isPending ? (
            <LoadingSpinner size="small" color="white" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm Reservation</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'date':
        return renderDateSelection();
      case 'time':
        return renderTimeSelection();
      case 'details':
        return renderDetailsForm();
      default:
        return renderDateSelection();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Book a Table
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.secondary }]}>
            {restaurantName}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderCurrentStep()}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  dateScroll: {
    marginHorizontal: -20,
  },
  dateContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  dateOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 80,
  },
  dateLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  todayLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  partySizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  partySizeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  partySizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  partySizeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partySizeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  partySizeText: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  timeOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
  },
  formContainer: {
    gap: 20,
    marginBottom: 32,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});