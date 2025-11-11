/**
 * Game Detail Screen
 * Detailed EV breakdown and prize information
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function GameDetailScreen({ route, navigation }) {
  const { game: initialGame } = route.params;
  const [game, setGame] = useState(initialGame);
  const [loading, setLoading] = useState(false);
  const [showAllPrizes, setShowAllPrizes] = useState(false);

  useEffect(() => {
    // Fetch full game details including prizes
    fetchGameDetails();
  }, []);

  const fetchGameDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/game/${initialGame.id}`);
      if (response.data) {
        setGame(response.data);
      }
    } catch (error) {
      console.error('Error fetching game details:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBreakEvenOdds = () => {
    if (!game.prizes || game.prizes.length === 0) return 'N/A';

    const price = parseFloat(game.price);
    const totalTickets = 4000000; // Estimated

    let totalProb = 0;
    game.prizes.forEach(prize => {
      const amt = parseFloat(String(prize.prize_amt).replace(/[$,]/g, ''));
      if (amt >= price) {
        totalProb += prize.remaining / totalTickets;
      }
    });

    return totalProb > 0 ? `1:${Math.round(1 / totalProb)}` : 'N/A';
  };

  const renderPrizeRow = (prize, index) => {
    const remaining = prize.remaining || 0;
    const total = prize.total || 0;
    const percentage = total > 0 ? ((remaining / total) * 100).toFixed(1) : '0';

    return (
      <View key={index} style={styles.prizeRow}>
        <View style={styles.prizeLeft}>
          <Text style={styles.prizeAmount}>{prize.prize_amt}</Text>
          <Text style={styles.prizeTotal}>Total: {total}</Text>
        </View>

        <View style={styles.prizeRight}>
          <Text style={[styles.prizeRemaining, remaining === 0 && styles.prizeRemainingZero]}>
            {remaining} left
          </Text>
          <View style={styles.prizeBar}>
            <View style={[styles.prizeBarFill, { width: `${percentage}%` }]} />
          </View>
          <Text style={styles.prizePercentage}>{percentage}% remaining</Text>
        </View>
      </View>
    );
  };

  const openOfficialPage = () => {
    if (game.url) {
      Linking.openURL(game.url);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  const evPercentage = (game.ev * 100).toFixed(1);
  const breakEvenOdds = calculateBreakEvenOdds();
  const displayPrizes = showAllPrizes
    ? game.prizes
    : game.prizes?.slice(0, 5);

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <View style={[styles.headerCard, game.is_hot && styles.headerCardHot]}>
        {game.is_hot && (
          <View style={styles.hotBadge}>
            <Text style={styles.hotBadgeText}>🔥 HOT TICKET</Text>
          </View>
        )}

        <Text style={styles.gameName}>{game.name}</Text>
        <Text style={styles.gameId}>Game #{game.id}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Ticket Price</Text>
          <Text style={styles.priceValue}>${parseFloat(game.price).toFixed(2)}</Text>
        </View>

        {game.url && (
          <TouchableOpacity style={styles.linkButton} onPress={openOfficialPage}>
            <Text style={styles.linkButtonText}>View Official Page →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsCard}>
        <Text style={styles.cardTitle}>Key Metrics</Text>

        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Expected Value</Text>
            <Text style={[styles.metricValue, game.ev >= 0.7 && styles.metricValueGood]}>
              {evPercentage}%
            </Text>
            <Text style={styles.metricSubtext}>per dollar spent</Text>
          </View>

          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Value Score</Text>
            <Text style={styles.metricValue}>{game.value_score || 0}</Text>
            <Text style={styles.metricSubtext}>out of 100</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Break-Even Odds</Text>
            <Text style={styles.metricValue}>{breakEvenOdds}</Text>
            <Text style={styles.metricSubtext}>to win ≥ ${game.price}</Text>
          </View>

          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Top Prize</Text>
            <Text style={styles.metricValue}>
              ${game.top_prize_amount?.toLocaleString() || 'N/A'}
            </Text>
            <Text style={styles.metricSubtext}>
              {game.top_prize_remaining || 0} remaining
            </Text>
          </View>
        </View>

        {/* EV Interpretation */}
        <View style={styles.interpretationBox}>
          <Text style={styles.interpretationTitle}>💡 What This Means:</Text>
          {game.ev >= 0.8 ? (
            <Text style={styles.interpretationText}>
              Excellent value! This ticket returns {evPercentage}¢ per dollar on average. One of the best available.
            </Text>
          ) : game.ev >= 0.7 ? (
            <Text style={styles.interpretationText}>
              Good value. This ticket returns {evPercentage}¢ per dollar on average. Better than most options.
            </Text>
          ) : game.ev >= 0.6 ? (
            <Text style={styles.interpretationText}>
              Average value. This ticket returns {evPercentage}¢ per dollar on average. Consider other options.
            </Text>
          ) : (
            <Text style={styles.interpretationText}>
              Below average value. This ticket returns only {evPercentage}¢ per dollar on average. Better options available.
            </Text>
          )}
        </View>
      </View>

      {/* Prize Breakdown */}
      {game.prizes && game.prizes.length > 0 && (
        <View style={styles.prizesCard}>
          <Text style={styles.cardTitle}>Prize Breakdown</Text>
          <Text style={styles.prizesSubtitle}>
            {game.prizes.length} prize tiers • Live data
          </Text>

          {displayPrizes.map((prize, index) => renderPrizeRow(prize, index))}

          {game.prizes.length > 5 && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setShowAllPrizes(!showAllPrizes)}
            >
              <Text style={styles.showMoreText}>
                {showAllPrizes
                  ? 'Show Less ▲'
                  : `Show All ${game.prizes.length} Prizes ▼`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Disclaimer */}
      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerTitle}>⚠️ Important Notes</Text>
        <Text style={styles.disclaimerText}>
          • Expected values are statistical estimates based on remaining prizes
        </Text>
        <Text style={styles.disclaimerText}>
          • EV &lt; 100% means the house has an edge (you lose money on average)
        </Text>
        <Text style={styles.disclaimerText}>
          • Past performance doesn't guarantee future results
        </Text>
        <Text style={styles.disclaimerText}>
          • Gamble responsibly • Must be 18+
        </Text>
      </View>

      {/* Last Updated */}
      <Text style={styles.lastUpdated}>
        Last updated: {new Date(game.updated_at || Date.now()).toLocaleString()}
      </Text>
    </ScrollView>
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
  },
  headerCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerCardHot: {
    backgroundColor: '#fff5f0',
    borderBottomWidth: 3,
    borderBottomColor: '#FF5722',
  },
  hotBadge: {
    backgroundColor: '#FF5722',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  hotBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  gameName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  gameId: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  priceContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  linkButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  metricsCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  metricValueGood: {
    color: '#4CAF50',
  },
  metricSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  interpretationBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  interpretationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  interpretationText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  prizesCard: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prizesSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  prizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  prizeLeft: {
    flex: 1,
  },
  prizeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  prizeTotal: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  prizeRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  prizeRemaining: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  prizeRemainingZero: {
    color: '#f44336',
  },
  prizeBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginTop: 4,
    marginBottom: 4,
  },
  prizeBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  prizePercentage: {
    fontSize: 10,
    color: '#999',
  },
  showMoreButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  showMoreText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  disclaimerCard: {
    backgroundColor: '#fff9e6',
    margin: 15,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeb3b',
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },
  lastUpdated: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
});
