/**
 * Scan Screen
 * Photo upload and OCR for ticket wall scanning
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { API_BASE_URL, FREE_TIER_SCANS } from '../config';

export default function ScanScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scansLeft, setScansLeft] = useState(FREE_TIER_SCANS);
  const [processing, setProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [detectedGames, setDetectedGames] = useState([]);

  useEffect(() => {
    requestPermissions();
    loadScanCount();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    setHasPermission(cameraStatus === 'granted' && libraryStatus === 'granted');
  };

  const loadScanCount = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const today = new Date().toISOString().split('T')[0];
      const lastScanDate = await AsyncStorage.getItem('lastScanDate');
      const scanCount = await AsyncStorage.getItem('dailyScanCount');

      if (lastScanDate === today && scanCount) {
        setScansLeft(FREE_TIER_SCANS - parseInt(scanCount));
      } else {
        // Reset count for new day
        await AsyncStorage.setItem('lastScanDate', today);
        await AsyncStorage.setItem('dailyScanCount', '0');
        setScansLeft(FREE_TIER_SCANS);
      }
    } catch (error) {
      console.error('Error loading scan count:', error);
    }
  };

  const incrementScanCount = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const scanCount = await AsyncStorage.getItem('dailyScanCount');
      const newCount = (parseInt(scanCount) || 0) + 1;

      await AsyncStorage.setItem('dailyScanCount', newCount.toString());
      setScansLeft(FREE_TIER_SCANS - newCount);
    } catch (error) {
      console.error('Error incrementing scan count:', error);
    }
  };

  const takePhoto = async () => {
    if (scansLeft <= 0) {
      Alert.alert(
        'Scan Limit Reached',
        'You\'ve used all your free scans for today. Upgrade to Pro for unlimited scans!',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade to Pro', onPress: () => handleUpgrade() },
        ]
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      processImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    if (scansLeft <= 0) {
      Alert.alert(
        'Scan Limit Reached',
        'You\'ve used all your free scans for today. Upgrade to Pro for unlimited scans!',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade to Pro', onPress: () => handleUpgrade() },
        ]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      processImage(result.assets[0].uri);
    }
  };

  const processImage = async (imageUri) => {
    try {
      setProcessing(true);
      setDetectedGames([]);

      const userId = await AsyncStorage.getItem('userId');
      const userState = await AsyncStorage.getItem('userState');

      // Create FormData for multipart upload
      const formData = new FormData();

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(imageUri);

      // Create file blob for upload
      const file = {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'lottery-scan.jpg'
      };

      formData.append('image', file);
      formData.append('userId', userId);
      formData.append('state', userState);

      console.log('Uploading image to Gemini AI...');

      // Send to backend for Gemini processing
      const response = await axios.post(
        `${API_BASE_URL}/scan/image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000 // 30 second timeout for AI processing
        }
      );

      console.log('Gemini response:', response.data);

      await incrementScanCount();

      if (!response.data.success) {
        Alert.alert(
          'No Games Detected',
          response.data.message || 'Could not detect any lottery tickets. Try a clearer photo with better lighting.'
        );
        setProcessing(false);
        return;
      }

      const { detected, matchedGames } = response.data;

      if (matchedGames && matchedGames.length > 0) {
        setDetectedGames(matchedGames);
        Alert.alert(
          '🎉 Games Detected!',
          `Found ${detected.length} ticket(s) in the image.\nMatched ${matchedGames.length} games in our database.\n\nScroll down to see recommendations sorted by value.`
        );
      } else if (detected && detected.length > 0) {
        Alert.alert(
          'Tickets Detected',
          `Detected ${detected.length} game(s):\n${detected.map(g => `#${g.gameNumber} - ${g.gameName}`).join('\n')}\n\nBut couldn't find them in our database. They may be discontinued or from another state.`
        );
      }

    } catch (error) {
      console.error('Error processing image:', error);

      let errorMessage = 'Failed to process the image. ';

      if (error.response?.status === 429) {
        errorMessage = error.response.data.message || 'Scan limit reached. Upgrade to Pro for unlimited scans!';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. The AI service may be busy. Try again in a moment.';
      } else if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again with a clearer photo.';
      }

      Alert.alert('Processing Error', errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpgrade = () => {
    Alert.alert(
      'Coming Soon',
      'Pro upgrade with unlimited scans is coming soon! For now, free tier resets daily.'
    );
  };

  const renderDetectedGame = (game) => {
    const evPercentage = (game.ev * 100).toFixed(1);

    return (
      <TouchableOpacity
        key={game.id}
        style={[styles.gameCard, game.is_hot && styles.gameCardHot]}
        onPress={() => navigation.navigate('Detail', { game })}
      >
        {game.is_hot && (
          <View style={styles.hotBadge}>
            <Text style={styles.hotBadgeText}>🔥 HOT</Text>
          </View>
        )}

        <Text style={styles.gameName}>{game.name}</Text>
        <View style={styles.gameStats}>
          <Text style={styles.gameStat}>Price: ${game.price}</Text>
          <Text style={[styles.gameStat, game.ev >= 0.7 && styles.gameStatGood]}>
            EV: {evPercentage}%
          </Text>
          <Text style={styles.gameStat}>Score: {game.value_score}/100</Text>
        </View>
        <Text style={styles.viewDetails}>Tap to view details →</Text>
      </TouchableOpacity>
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera or photo library</Text>
        <Text style={styles.errorSubtext}>
          Please enable permissions in your device settings
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Scan Ticket Wall</Text>
          <Text style={styles.subtitle}>
            Take a photo of lottery ticket displays to find the best picks
          </Text>
        </View>

        {/* Scan Counter */}
        <View style={styles.scanCounter}>
          <Text style={styles.scanCounterText}>
            Scans left today: <Text style={styles.scanCounterNumber}>{scansLeft}</Text>
          </Text>
          {scansLeft === 0 && (
            <TouchableOpacity onPress={handleUpgrade}>
              <Text style={styles.upgradeLink}>Upgrade to Pro →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={takePhoto}
            disabled={processing || scansLeft <= 0}
          >
            <Text style={styles.actionButtonText}>📷 Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={pickImage}
            disabled={processing || scansLeft <= 0}
          >
            <Text style={styles.actionButtonText}>🖼️ Choose from Library</Text>
          </TouchableOpacity>
        </View>

        {/* Processing Indicator */}
        {processing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.processingText}>Analyzing with Gemini 2.0 Flash...</Text>
            <Text style={styles.processingSubtext}>AI is recognizing lottery tickets</Text>
          </View>
        )}

        {/* Selected Image Preview */}
        {selectedImage && !processing && (
          <View style={styles.imagePreview}>
            <Text style={styles.sectionTitle}>Scanned Image:</Text>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          </View>
        )}

        {/* Detected Games */}
        {detectedGames.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>
              Found {detectedGames.length} Game{detectedGames.length > 1 ? 's' : ''}:
            </Text>
            <Text style={styles.resultsSubtitle}>
              Sorted by value score (best first)
            </Text>
            {detectedGames
              .sort((a, b) => b.value_score - a.value_score)
              .map(renderDetectedGame)}
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Tips for Best Results:</Text>
          <Text style={styles.instructionItem}>
            • Ensure good lighting and clear focus
          </Text>
          <Text style={styles.instructionItem}>
            • Capture game numbers and names clearly
          </Text>
          <Text style={styles.instructionItem}>
            • Try to minimize glare and reflections
          </Text>
          <Text style={styles.instructionItem}>
            • Get close enough to read the text
          </Text>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  scanCounter: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scanCounterText: {
    fontSize: 16,
    color: '#333',
  },
  scanCounterNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  upgradeLink: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonSecondary: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  processingContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  processingText: {
    fontSize: 16,
    color: '#333',
    marginTop: 15,
  },
  processingSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  imagePreview: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  resultsContainer: {
    marginBottom: 20,
  },
  resultsSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 15,
  },
  gameCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gameCardHot: {
    borderWidth: 2,
    borderColor: '#FF5722',
  },
  hotBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF5722',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hotBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gameName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  gameStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gameStat: {
    fontSize: 14,
    color: '#666',
  },
  gameStatGood: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  viewDetails: {
    fontSize: 12,
    color: '#2196F3',
    textAlign: 'center',
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  instructionItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
});
