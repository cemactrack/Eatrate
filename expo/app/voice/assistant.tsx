import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSettings } from '@/providers/SettingsProvider';
import { trpc } from '@/lib/trpc';
import { Mic, MicOff, Send, History, MessageCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface VoiceCommand {
  id: string;
  query: string;
  response: string;
  timestamp: string;
}

interface VoiceSuggestion {
  id: string;
  text: string;
  category: 'search' | 'recommendation' | 'action';
}

export default function VoiceAssistantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useSettings();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Queries
  const historyQuery = trpc.voice.getHistory.useQuery({});
  const suggestionsQuery = trpc.voice.getSuggestions.useQuery({});

  // Mutations
  const processCommandMutation = trpc.voice.processCommand.useMutation({
    onSuccess: (data) => {
      setCurrentResponse(data.response);
      setIsProcessing(false);
      historyQuery.refetch();
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to process voice command');
      setIsProcessing(false);
    },
  });

  const handleVoiceCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;

    setIsProcessing(true);
    setCurrentResponse('');
    
    try {
      await processCommandMutation.mutateAsync({ command: command.trim() });
    } catch (error) {
      console.error('Voice command error:', error);
    }
  }, [processCommandMutation]);

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      setIsListening(false);
      // In a real implementation, you would stop voice recording here
    } else {
      setIsListening(true);
      // In a real implementation, you would start voice recording here
      // For demo purposes, we'll simulate voice input after 3 seconds
      setTimeout(() => {
        setIsListening(false);
        handleVoiceCommand('Find me the best pizza places nearby');
      }, 3000);
    }
  }, [isListening, handleVoiceCommand]);

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
      handleVoiceCommand(textInput);
      setTextInput('');
    }
  }, [textInput, handleVoiceCommand]);

  const handleSuggestionPress = useCallback((suggestion: VoiceSuggestion) => {
    handleVoiceCommand(suggestion.text);
  }, [handleVoiceCommand]);

  if (isProcessing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Stack.Screen
          options={{
            title: 'Voice Assistant',
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.loadingContainer}>
          <View style={[styles.pulseCircle, { backgroundColor: colors.tint + '20' }]}>
            <Mic size={32} color={colors.tint} />
          </View>
          <Text style={[styles.loadingText, { color: colors.text }]}>Processing your request...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: 'Voice Assistant',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Response */}
        {currentResponse && (
          <View style={[styles.responseContainer, { backgroundColor: colors.card }]}>
            <MessageCircle size={20} color={colors.tint} />
            <Text style={[styles.responseText, { color: colors.text }]}>{currentResponse}</Text>
          </View>
        )}

        {/* Voice Input Section */}
        <View style={styles.voiceSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Voice Command</Text>
          <TouchableOpacity
            style={[
              styles.voiceButton,
              {
                backgroundColor: isListening ? colors.destructive : colors.tint,
              },
            ]}
            onPress={handleVoiceToggle}
          >
            {isListening ? (
              <MicOff size={32} color={colors.background} />
            ) : (
              <Mic size={32} color={colors.background} />
            )}
          </TouchableOpacity>
          <Text style={[styles.voiceHint, { color: colors.secondary }]}>
            {isListening ? 'Listening... Tap to stop' : 'Tap to start voice command'}
          </Text>
        </View>

        {/* Text Input Section */}
        <View style={styles.textSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Type Your Query</Text>
          <View style={[styles.textInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Ask me anything about restaurants..."
              placeholderTextColor={colors.secondary}
              multiline
              onSubmitEditing={handleTextSubmit}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: colors.tint }]}
              onPress={handleTextSubmit}
              disabled={!textInput.trim()}
            >
              <Send size={20} color={colors.background} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Suggestions */}
        {suggestionsQuery.data && suggestionsQuery.data.suggestions && suggestionsQuery.data.suggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Suggestions</Text>
            <View style={styles.suggestionsList}>
              {suggestionsQuery.data.suggestions.map((suggestion: any) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={[styles.suggestionChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handleSuggestionPress(suggestion)}
                >
                  <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* History */}
        {historyQuery.data && historyQuery.data.commands && historyQuery.data.commands.length > 0 && (
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <History size={20} color={colors.text} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Queries</Text>
            </View>
            {historyQuery.data.commands.map((item: any) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.historyItem, { backgroundColor: colors.card }]}
                onPress={() => handleVoiceCommand(item.query)}
              >
                <Text style={[styles.historyQuery, { color: colors.text }]}>{item.query}</Text>
                <Text style={[styles.historyTime, { color: colors.secondary }]}>
                  {new Date(item.timestamp).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  pulseCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500' as const,
  },
  responseContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  responseText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  voiceSection: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  voiceButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  voiceHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  textSection: {
    marginBottom: 32,
  },
  textInputContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsSection: {
    marginBottom: 32,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
  },
  historySection: {
    gap: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyItem: {
    padding: 16,
    borderRadius: 12,
    gap: 4,
  },
  historyQuery: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  historyTime: {
    fontSize: 12,
  },
});