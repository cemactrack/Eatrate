import React from 'react';
import { ScrollView, StyleSheet, Text, View, Linking, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const faqs = [
  {
    q: 'How do I create a review?',
    a: 'From the home screen, tap the "Create Post" button. You can then write your review, add photos, and rate the restaurant.',
  },
  {
    q: 'How can I edit my profile?',
    a: 'Navigate to the Profile tab and tap the "Edit Profile" button. You can update your display name, bio, and avatar there.',
  },
  {
    q: 'Is my location data stored?',
    a: 'We only use your location to find nearby restaurants if you grant permission. We do not store your location history.',
  },
  {
    q: 'How do I delete my account?',
    a: 'In the Settings screen, under "Account Management", you will find a "Delete Account" option. Please be aware that this action is permanent.',
  },
];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();

  const handleContactPress = () => {
    Linking.openURL('mailto:support@eatrate.com?subject=EatRate App Support');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ ...styles.contentContainer, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      <Text style={styles.title}>Help & Support</Text>

      <Text style={styles.heading}>Frequently Asked Questions</Text>
      {faqs.map((faq, index) => (
        <View key={index} style={styles.faqItem}>
          <Text style={styles.question}>{faq.q}</Text>
          <Text style={styles.answer}>{faq.a}</Text>
        </View>
      ))}

      <Text style={styles.heading}>Contact Us</Text>
      <Text style={styles.paragraph}>
        If you can't find the answer you're looking for, please don't hesitate to reach out to our support team.
      </Text>
      <TouchableOpacity onPress={handleContactPress}>
        <Text style={styles.email}>support@eatrate.com</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E10',
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#B9BBC6',
  },
  faqItem: {
    marginBottom: 24,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  answer: {
    fontSize: 16,
    lineHeight: 24,
    color: '#B9BBC6',
  },
  email: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FF6B3D',
    textDecorationLine: 'underline',
    marginTop: 8,
  },
});
