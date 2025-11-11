/**
 * Home Screen
 * Browse top lottery picks
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL, BUDGET_TIERS } from '../config';

export default function HomeScreen({ navigation }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [userState, setUserState] = useState('nc');
  const [showHotOnly, setShowHotOnly] = useState(false);

  useEffect(() => {
    loadUserState();
  }, []);

  useEffect(() => {
    if (userState) {
      fetchGames();
    }
  }, [userState, selectedBudget, showHotOnly]);

  const loadUserState = async () => {
    try {
      const state = await AsyncStorage.getItem('userState');
      setUserState(state || 'nc');
    } catch (error) {
      console.error('Error loading user state:', error);
    }
  };

  const fetchGames = async () => {
    try {
      setLoading(true);

      let url = `${API_BASE_URL}/games/${userState}`;

      const params = new URLSearchParams();
      if (selectedBudget) {
        params.append('maxPrice', selectedBudget);
      }
      if (showHotOnly) {
        params.append('hotOnly', 'true');
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      setGames(response.data.games || []);
    } catch (error) {
      console.error('Error fetching games:', error);
      Alert.alert(
        'Connection Error',
        'Could not load games. Make sure the backend server is running.',
        [{ text: 'Retry', onPress: () => fetchGames() }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGames();
  };

  const renderBudgetFilter = () => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterLabel}>Budget:</Text>
      <View style={styles.filterButtons}>
        <TouchableOpacity
          style={[styles.filterButton, !selectedBudget && styles.filterButtonActive]}
          onPress={() => setSelectedBudget(null)}
        >
          <Text style={[styles.filterButtonText, !selectedBudget && styles.filterButtonTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {BUDGET_TIERS.map(tier => (
          <TouchableOpacity
            key={tier.value}
            style={[
              styles.filterButton,
              selectedBudget === tier.value && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedBudget(tier.value)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedBudget === tier.value && styles.filterButtonTextActive,
              ]}
            >
              {tier.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderHotFilter = () => (
    <TouchableOpacity
      style={styles.hotFilterButton}
      onPress={() => setShowHotOnly(!showHotOnly)}
    >
      <Text style={styles.hotFilterText}>
        {showHotOnly ? '🔥 Hot Tickets Only' : '📊 Show All'}
      </Text>
    </TouchableOpacity>
  );

  const renderGameCard = ({ item }) => {
    const evPercentage = (item.ev * 100).toFixed(1);
    const isGoodValue = item.ev >= 0.7;

    return (
      <TouchableOpacity
        style={[styles.gameCard, item.is_hot && styles.gameCardHot]}
        onPress={() => navigation.navigate('Detail', { game: item })}
      >
        {item.is_hot && (
          <View style={styles.hotBadge}>
            <Text style={styles.hotBadgeText}>🔥 HOT</Text>
          </View>
        )}

        {/* Ticket Image */}
        {item.image_url && (
          <Image
            source={{ uri: item.image_url }}
            style={styles.ticketImage}
            resizeMode="contain"
          />
        )}

        <View style={styles.gameHeader}>
          <Text style={styles.gameName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.gamePrice}>${parseFloat(item.price).toFixed(2)}</Text>
        </View>

        <View style={styles.gameStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Expected Value</Text>
            <Text style={[styles.statValue, isGoodValue && styles.statValueGood]}>
              {evPercentage}%
            </Text>
            <Text style={styles.statSubtext}>per dollar</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Top Prize</Text>
            <Text style={styles.statValue}>
              ${item.top_prize_amount?.toLocaleString() || 'N/A'}
            </Text>
            <Text style={styles.statSubtext}>
              {item.top_prize_remaining || 0} left
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Value Score</Text>
            <Text style={styles.statValue}>{item.value_score || 0}</Text>
            <Text style={styles.statSubtext}>out of 100</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => navigation.navigate('Detail', { game: item })}
        >
          <Text style={styles.detailsButtonText}>View Details →</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No games found</Text>
      <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading games...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Top Picks - {userState.toUpperCase()}</Text>
        <Text style={styles.headerSubtitle}>{games.length} games available</Text>
      </View>

      {/* Scan Button */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate('Scan')}
      >
        <Text style={styles.scanButtonText}>📸 Scan Ticket Wall</Text>
      </TouchableOpacity>

      {/* Filters */}
      {renderBudgetFilter()}
      {renderHotFilter()}

      {/* Games List */}
      <FlatList
        data={games}
        renderItem={renderGameCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  scanButton: {
    backgroundColor: '#2196F3',
    margin: 15,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  hotFilterButton: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF5722',
  },
  hotFilterText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  listContainer: {
    padding: 15,
  },
  gameCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameCardHot: {
    borderWidth: 2,
    borderColor: '#FF5722',
  },
  ticketImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
  },
  hotBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF5722',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hotBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  gameName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  gamePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  gameStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statValueGood: {
    color: '#4CAF50',
  },
  statSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  detailsButton: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
});
