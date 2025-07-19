import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Modal, 
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
// ADD this import at the top with your other imports
import { Ionicons } from '@expo/vector-icons';

// Update the logout function in your dashboard
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const fullColorMap = {
  green: '#49D0B0',  // Bulbasaur's card
  red: '#FB6C6C',    // Charmander's card
  blue: '#76BDFE',   // Squirtle's card
  yellow: '#FFD76F', // Pikachu's card
  purple: '#AC92EC',
  pink: '#F778A1',
  brown: '#B1736C',
  gray: '#AAB7B8',
  black: '#5D6D7E',
  white: '#AAB7B8',
};

export default function DashboardScreen() {
  const [pokemonList, setPokemonList] = useState([]);
  const [filteredPokemonList, setFilteredPokemonList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const fetchPokemons = async (currentOffset = 0, append = false) => {
    setLoading(true);
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=21&offset=${currentOffset}`);
      const data = await res.json();

      setHasMore(data.next !== null);

      const detailedData = await Promise.all(
        data.results.map(async (poke) => {
          const res = await fetch(poke.url);
          const fullData = await res.json();

          const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${fullData.id}`);
          const speciesData = await speciesRes.json();

          return {
            ...fullData,
            color: speciesData.color.name,
          };
        })
      );

      if (append) {
        setPokemonList(prev => [...prev, ...detailedData]);
        setFilteredPokemonList(prev => [...prev, ...detailedData]);
      } else {
        setPokemonList(detailedData);
        setFilteredPokemonList(detailedData);
      }
    } catch (err) {
      console.error('Error fetching:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPokemons();
  }, []);

  const loadMore = () => {
    const newOffset = offset + 21;
    setOffset(newOffset);
    fetchPokemons(newOffset, true);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredPokemonList(pokemonList);
      return;
    }
  
    setIsSearching(true);
    try {
      // Get all Pokemon from API (first 1000)
      const allPokemonResponse = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
      const allPokemonData = await allPokemonResponse.json();
      
      // Dictionary-style filtering
      const matchingPokemon = allPokemonData.results
        .filter(pokemon => pokemon.name.toLowerCase().startsWith(query.toLowerCase()))
        .slice(0, 10); // Show first 10 results
  
      if (matchingPokemon.length === 0) {
        // If no results starting with the query, fall back to contains search
        const containsMatches = allPokemonData.results
          .filter(pokemon => pokemon.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 10);
        
        if (containsMatches.length > 0) {
          const detailedContains = await Promise.all(
            containsMatches.map(async (pokemon) => {
              const pokemonResponse = await fetch(pokemon.url);
              const pokemonData = await pokemonResponse.json();
              
              const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonData.id}`);
              const speciesData = await speciesResponse.json();
              
              return {
                ...pokemonData,
                color: speciesData.color.name,
              };
            })
          );
          setFilteredPokemonList(detailedContains);
        } else {
          setFilteredPokemonList([]);
        }
      } else {
        // Fetch detailed data for Pokemon starting with the query
        const detailedMatches = await Promise.all(
          matchingPokemon.map(async (pokemon) => {
            const pokemonResponse = await fetch(pokemon.url);
            const pokemonData = await pokemonResponse.json();
            
            const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonData.id}`);
            const speciesData = await speciesResponse.json();
            
            return {
              ...pokemonData,
              color: speciesData.color.name,
            };
          })
        );
  
        setFilteredPokemonList(detailedMatches);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Failed to search Pokemon. Please try again.');
      setFilteredPokemonList([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredPokemonList(pokemonList);
  };

  const logout = async () => {
    try {
      // Clear login status from AsyncStorage
      await AsyncStorage.removeItem('isLoggedIn');
      await AsyncStorage.removeItem('userEmail');
      
      // Navigate to login
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error clearing login status:', error);
      // Still navigate even if there's an error
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
    <StatusBar style="dark" backgroundColor="#F5F5F5" />
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Pokemon Logo */}
      <Image 
        source={require('../../assets/pokeball.png')} // Make sure this path is correct
        style={styles.logo}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
  <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
  <TextInput
    style={styles.searchInput}
    placeholder="Search any Pokemon by name..."
    value={searchQuery}
    onChangeText={handleSearch}
    placeholderTextColor="#999"
  />
  {isSearching && (
    <ActivityIndicator size="small" color="#FFD76F" style={{ marginLeft: 10 }} />
  )}
  {searchQuery.length > 0 && !isSearching && (
    <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
      <Text style={styles.clearButtonText}>×</Text>
    </TouchableOpacity>
  )}
</View>
        {searchQuery.length > 0 && !isSearching && (
          <Text style={styles.searchResults}>
            Found {filteredPokemonList.length} Pokemon
            {filteredPokemonList.length === 20 && " (showing first 20 results)"}
          </Text>
        )}
        {isSearching && (
          <Text style={styles.searchResults}>Searching...</Text>
        )}
      </View>

      {/* Pokemon Grid - Exact same structure as React */}
      <View style={styles.pokemonGrid}>
        {filteredPokemonList.map((poke) => {
          const id = poke.id;
          const imageUrl = poke.sprites.other['official-artwork'].front_default || poke.sprites.front_default;
          const primaryType = poke.types[0].type.name;
          const bgColor = fullColorMap[poke.color] || '#ffffff';

          return (
            <TouchableOpacity
              key={id}
              style={[styles.pokemonCard, { backgroundColor: bgColor }]}
              onPress={() => setSelectedPokemon(poke)}
            >
              {/* Pokemon Name - Top Left - Exact positioning */}
              <View style={styles.pokemonInfo}>
                <Text style={styles.pokemonName}>
                  {poke.name.charAt(0).toUpperCase() + poke.name.slice(1)}
                </Text>
                <Text style={styles.pokemonType}>
                  {primaryType.toUpperCase()}
                </Text>
                <Text style={styles.pokemonAbility}>
                  {poke.abilities && poke.abilities.length > 0 
                    ? poke.abilities[0].ability.name.charAt(0).toUpperCase() + poke.abilities[0].ability.name.slice(1).replace('-', ' ')
                    : 'Unknown'}
                </Text>
              </View>

              {/* Pokemon Image - Bottom Right - Exact positioning */}
              <View style={styles.pokemonImageContainer}>
                <Image source={{ uri: imageUrl }} style={styles.pokemonImage} />
              </View>

              {/* Details Link - Bottom Left - Exact positioning */}
              <View style={styles.detailsLink}>
                <Text style={styles.detailsText}>Click for details</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Pokemon Detail Modal - Exact same as React */}
      <Modal
        visible={selectedPokemon !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPokemon(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setSelectedPokemon(null)}
          activeOpacity={1}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
            activeOpacity={1}
          >
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedPokemon(null)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            {selectedPokemon && (
              <>
                {/* Top Section with Pokemon Image */}
                <View style={[styles.modalTop, { backgroundColor: fullColorMap[selectedPokemon.color] || '#ffffff' }]}>
                  {/* HP Badge */}
                  <View style={styles.hpBadge}>
                    <Text style={styles.hpText}>
                      HP {selectedPokemon.stats.find(stat => stat.stat.name === 'hp')?.base_stat || 0}
                    </Text>
                  </View>

                  {/* Pokemon Image */}
                  <Image 
                    source={{ uri: selectedPokemon.sprites.other['official-artwork'].front_default || selectedPokemon.sprites.front_default }}
                    style={styles.modalPokemonImage}
                  />
                </View>

                {/* Pokemon Info Section */}
                <View style={styles.modalInfo}>
                  {/* Pokemon Name */}
                  <Text style={styles.modalPokemonName}>
                    {selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1)}
                  </Text>

                  {/* Type Badge */}
                  <View style={[styles.typeBadge, { backgroundColor: fullColorMap[selectedPokemon.color] || '#ffffff' }]}>
                    <Text style={styles.typeBadgeText}>
                      {selectedPokemon.types[0].type.name}
                    </Text>
                  </View>

                  {/* Stats */}
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {selectedPokemon.stats.find(stat => stat.stat.name === 'attack')?.base_stat || 0}
                      </Text>
                      <Text style={styles.statLabel}>Attack</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {selectedPokemon.stats.find(stat => stat.stat.name === 'defense')?.base_stat || 0}
                      </Text>
                      <Text style={styles.statLabel}>Defense</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {selectedPokemon.stats.find(stat => stat.stat.name === 'speed')?.base_stat || 0}
                      </Text>
                      <Text style={styles.statLabel}>Speed</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Load More Button - Only show if not searching */}
      {hasMore && searchQuery.length === 0 && (
        <View style={styles.loadMoreContainer}>
          <TouchableOpacity 
            style={[styles.loadMoreButton, loading && styles.loadMoreButtonDisabled]}
            onPress={loadMore}
            disabled={loading}
          >
            <Text style={styles.loadMoreText}>
              {loading ? 'Loading...' : 'Load More Pokémon'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pokemon Count Display */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {searchQuery.length > 0 
            ? `Found ${filteredPokemonList.length} Pokemon${filteredPokemonList.length === 20 ? " (first 20 results)" : ""}`
            : `Showing ${filteredPokemonList.length} Pokémon`
          }
        </Text>
      </View>

      {/* Logout Button - Exact same as React */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ADDED this new style
safeArea: {
  flex: 1,
  backgroundColor: '#F5F5F5',
},
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    width: screenWidth,
  },
  contentContainer: {
    padding: 20,
    width: screenWidth,
    minHeight: screenHeight,
  },
  logo: {
    width: 200,
    height: 60,
    alignSelf: 'center',
    marginVertical: 0,
  },
  searchContainer: {
    marginHorizontal: 0,
    marginTop: 20,
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  searchResults: {
    marginTop: 10,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  pokemonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    maxWidth: 325,
    width: '100%',
    alignSelf: 'center',
    marginTop: 0,
    paddingHorizontal: 0,
  },
  pokemonCard: {
    width: '30%', // 3 columns exactly like React
    minWidth: 150,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    minHeight: 200,
    position: 'relative',
  },
  pokemonInfo: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 2,
  },
  pokemonName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    margin: 0,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pokemonType: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    margin: 0,
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pokemonAbility: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    margin: 0,
    marginTop: 2,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pokemonImageContainer: {
    position: 'absolute',
    bottom: 25,
    right: 8,
    zIndex: 1,
  },
  pokemonImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  detailsLink: {
    position: 'absolute',
    bottom: 12,
    left: 10,
    zIndex: 2,
  },
  detailsText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 0,
    width: 350,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
  },
  modalTop: {
    backgroundColor: '#ffffff',
    padding: 30,
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: 'center',
    position: 'relative',
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
  },
  hpBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hpText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  modalPokemonImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  modalInfo: {
    padding: 20,
    alignItems: 'center',
  },
  modalPokemonName: {
    fontSize: 28,
    fontWeight: 'bold',
    margin: 0,
    marginBottom: 15,
    color: '#333',
  },
  typeBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 30,
  },
  typeBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  loadMoreContainer: {
    alignItems: 'center',
    margin: 30,
    marginTop: 30,
    marginBottom: 0,
  },
  loadMoreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  loadMoreButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loadMoreText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  countContainer: {
    alignItems: 'center',
    margin: 20,
    marginTop: 20,
    marginBottom: 0,
  },
  countText: {
    color: '#666',
    fontSize: 14,
  },
  logoutButton: {
    alignSelf: 'center', // Center the button
    marginVertical: 20,
    paddingVertical: 15,
    paddingHorizontal: 30,
    backgroundColor: '#FF9800',
    borderRadius: 25, // More rounded
    minWidth: 120, // Minimum width
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});