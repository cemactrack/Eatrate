import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { useSettings } from '@/providers/SettingsProvider';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress?: () => void;
  placeholder?: string;
  onSubmitEditing?: () => void;
}

const SearchBar = React.memo(function SearchBar({ 
  value, 
  onChangeText, 
  onFilterPress, 
  placeholder = "Search restaurants, dishes...",
  onSubmitEditing
}: SearchBarProps) {
  const { colors } = useSettings();
  
  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { backgroundColor: colors.border }]}>
        <Search size={20} color={colors.secondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.secondary}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="search"
        />
      </View>
      
      {onFilterPress && (
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.accent }]} onPress={onFilterPress}>
          <SlidersHorizontal size={20} color={colors.tint} />
        </TouchableOpacity>
      )}
    </View>
  );
});

export default SearchBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 12,
    padding: 10,
    borderRadius: 12,
  },
});