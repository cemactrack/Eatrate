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
  timestamp: string;
}

export default function VoiceAssistantScreen() {
  const { colors } = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [currentResponse, setCurrentResponse] = useState<string | null>(null);

  const processCommandMutation = trpc.voice.processCommand.useMutation({
    onSuccess: (data) => {
      setCurrentResponse(data.response);
      if (data.actions.length > 0) {
        Alert.alert(
          'Quick Actions',
          'What would you like to do next?',
          data.actions.map(action => ({
            text: action.text,
            onPress: () => handleAction(action.action)
          }))
        );
      }
    },
    onError: (error) => {
      Alert.alert('Voice Assistant Error', error.message);
    }
  });

  const historyQuery = trpc.voice.getHistory.useQuery({
    limit: 5
  });

  const handleVoiceCommand = useCallback((command: string) => {
    if (!command.trim()) return;
    
    processCommandMutation.mutate({
      command: command.trim(),
      location: {
        latitude: 4.0511,
        longitude: 9.7679,
        city: 'Douala'
      }
    });
  }, [processCommandMutation]);

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
      handleVoiceCommand(textInput);
      setTextInput('');
    }
  }, [textInput, handleVoiceCommand]);

  const handleAction = useCallback((action: string) => {
    if (!action?.trim()) return;
    
    switch (action) {
      case 'search_restaurants':
        router.push('/(tabs)/(search)/search');
        break;
      case 'view_profile':
        router.push('/(tabs)/(profile)/profile');
        break;
      case 'create_post':
        router.push('/(tabs)/(home)/create-post');
        break;
      case 'view_suppliers':
        router.push('/(tabs)/(suppliers)/suppliers');
        break;
      default:
        console.log('Unknown action:', action);
    }
  }, [router]);

  const startListening = useCallback(() => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      const mockCommands = [
        'Find me the best pizza in Douala',
        'Show me restaurants near me',
        'What are the trending dishes today?',
        'Find vegetarian restaurants in Yaounde'
      ];
      const randomCommand = mockCommands[Math.floor(Math.random() * mockCommands.length)];
      handleVoiceCommand(randomCommand);
    }, 2000);
  }, [handleVoiceCommand]);

  const suggestions = [
    'Find restaurants near me',
    'What are the trending dishes?',
    'Show me vegetarian options',
    'Find the best rated restaurants',
    'What\'s popular in Douala today?',
    'Show me my favorite restaurants'
  ];

  if (processCommandMutation.isPending || isListening) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ 
          title: 'Voice Assistant',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text
        }} />
        <View style={styles.loadingContainer}>
          <View style={[styles.pulseCircle, { backgroundColor: colors.tint }]}>
            <Mic size={32} color={colors.background} />
          </View>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {isListening ? 'Listening...' : 'Processing your request...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Stack.Screen options={{ 
        title: 'Voice Assistant',
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text
      }} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentResponse && (
          <View style={[styles.responseContainer, { backgroundColor: colors.card }]}>
            <MessageCircle size={20} color={colors.tint} />
            <Text style={[styles.responseText, { color: colors.text }]}>{currentResponse}</Text>
          </View>
        )}

        <View style={styles.voiceSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Voice Commands</Text>
          <TouchableOpacity
            style={[styles.voiceButton, { backgroundColor: colors.tint }]}
            onPress={startListening}
            disabled={isListening}
          >
            {isListening ? (
              <MicOff size={32} color={colors.background} />
            ) : (
              <Mic size={32} color={colors.background} />
            )}
          </TouchableOpacity>
          <Text style={[styles.voiceHint, { color: colors.secondary }]}>
            Tap to speak or type your request below
          </Text>
        </View>

        <View style={styles.textSection}>
          <View style={[styles.textInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder="Type your food question here..."
              placeholderTextColor={colors.secondary}
              value={textInput}
              onChangeText={setTextInput}
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

        <View style={styles.suggestionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Try asking:</Text>
          <View style={styles.suggestionsList}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={`suggestion-${index}`}
                style={[styles.suggestionChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  if (suggestion?.trim()) {
                    handleVoiceCommand(suggestion);
                  }
                }}
              >
                <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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