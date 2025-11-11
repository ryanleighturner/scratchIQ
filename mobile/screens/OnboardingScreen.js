/**
 * Onboarding Screen
 * State selection and disclaimer
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STATES, DISCLAIMER_TEXT } from '../config';

export default function OnboardingScreen({ navigation }) {
  const [selectedState, setSelectedState] = useState('nc');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    // Check if user has already onboarded
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const userState = await AsyncStorage.getItem('userState');
      const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');

      if (hasOnboarded === 'true' && userState) {
        // Skip onboarding
        navigation.replace('Home');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleGetStarted = async () => {
    if (!agreedToTerms) {
      Alert.alert(
        'Terms Required',
        'Please read and acknowledge the disclaimer to continue.'
      );
      return;
    }

    const stateInfo = STATES.find(s => s.value === selectedState);

    if (!stateInfo?.supported) {
      Alert.alert(
        'Coming Soon',
        `${stateInfo?.label || 'This state'} is not yet supported. Only North Carolina is available in the MVP.`
      );
      return;
    }

    try {
      // Save user preferences
      await AsyncStorage.setItem('userState', selectedState);
      await AsyncStorage.setItem('hasOnboarded', 'true');
      await AsyncStorage.setItem('userId', generateUserId());

      Alert.alert(
        'Welcome to ScratchIQ!',
        `Now tracking hot tickets in ${stateInfo.label}. Find the best-value scratch-offs based on real-time data.`,
        [
          {
            text: 'Start Exploring',
            onPress: () => navigation.replace('Home'),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    }
  };

  const generateUserId = () => {
    return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to ScratchIQ</Text>
          <Text style={styles.subtitle}>
            Find the best-value scratch-off lottery tickets using data-driven Expected Value analysis
          </Text>
        </View>

        {/* State Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Your State</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedState}
              onValueChange={(itemValue) => setSelectedState(itemValue)}
              style={styles.picker}
            >
              {STATES.map(state => (
                <Picker.Item
                  key={state.value}
                  label={`${state.label}${!state.supported ? ' (Coming Soon)' : ''}`}
                  value={state.value}
                  enabled={state.supported}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Important Disclaimer</Text>
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>{DISCLAIMER_TEXT}</Text>
          </View>

          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            <View style={[styles.checkboxBox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              I understand and agree to use ScratchIQ responsibly
            </Text>
          </TouchableOpacity>
        </View>

        {/* Get Started Button */}
        <TouchableOpacity
          style={[styles.button, !agreedToTerms && styles.buttonDisabled]}
          onPress={handleGetStarted}
          disabled={!agreedToTerms}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        {/* Features List */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>What You Get:</Text>
          <Text style={styles.featureItem}>📊 Real-time Expected Value (EV) calculations</Text>
          <Text style={styles.featureItem}>🔥 Hot ticket alerts for high-value games</Text>
          <Text style={styles.featureItem}>📸 Scan ticket walls to find the best picks</Text>
          <Text style={styles.featureItem}>💰 Filter by budget and prize tier</Text>
          <Text style={styles.featureItem}>📈 Prize availability tracking</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  picker: {
    height: 50,
  },
  disclaimerBox: {
    backgroundColor: '#fff9e6',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ffeb3b',
    marginBottom: 15,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  featuresSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
});
