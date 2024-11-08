import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
  ActivityIndicator,
  ScrollView,
  Animated,
  TextInput,
  PanResponder,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_STORAGE_KEY = '@cocktails_favorites';
const { width } = Dimensions.get('window');

export default function CocktailsApp({ onBack, theme }) {
  const [cocktails, setCocktails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCocktail, setSelectedCocktail] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [favoritesModalVisible, setFavoritesModalVisible] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [favoriteCocktails, setFavoriteCocktails] = useState([]);

  // filtres
  const [searchText, setSearchText] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [selectedIngredients, setSelectedIngredients] = useState(new Set());
  const [filteredCocktails, setFilteredCocktails] = useState([]);
  const [allCocktails, setAllCocktails] = useState([]);

  //load
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [indicatorAnim] = useState(new Animated.Value(0));
 
  //scroll 
  const [scrollIndicatorVisible, setScrollIndicatorVisible] = useState(false);
  const [currentLetter, setCurrentLetter] = useState('');
  const listRef = useRef(null);
  const windowHeight = Dimensions.get('window').height;
  const alphabet = '#ABCDEFG'.split('');
  const sortCocktailsByName = (cocktails) => {
    return [...cocktails].sort((a, b) => a.strDrink.localeCompare(b.strDrink));
  };

  const headerScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Promise.all([
      fetchCocktails(),
      loadFavorites(),
      fetchCategories(),
      fetchIngredients()
    ]);
  }, []);

  useEffect(() => {
    filterCocktails();
  }, [searchText, selectedCategories, selectedIngredients, allCocktails]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('https://www.thecocktaildb.com/api/json/v1/1/list.php?c=list');
      const data = await response.json();
      setCategories(data.drinks.map(item => item.strCategory));
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await fetch('https://www.thecocktaildb.com/api/json/v1/1/list.php?i=list');
      const data = await response.json();
      setIngredients(data.drinks.map(item => item.strIngredient1));
    } catch (error) {
      console.error('Erreur lors du chargement des ingrédients:', error);
    }
  };

  const handleLetterPress = (letter) => {
    setCurrentLetter(letter);
    setScrollIndicatorVisible(true);
  
    const index = filteredCocktails.findIndex(cocktail => {
      const firstChar = cocktail.strDrink.charAt(0).toUpperCase();
      if (letter === '#') {
        return !isNaN(firstChar);
      }
      return firstChar === letter;
    });
  
    if (index !== -1) {
      listRef.current?.scrollToIndex({
        index,
        viewPosition: 0,
        animated: true
      });
    }

    setTimeout(() => {
      setScrollIndicatorVisible(false);
      setCurrentLetter('');
    }, 1000);
  };
  
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt, gestureState) => {
          setScrollIndicatorVisible(true);
          handleScroll(gestureState);
        },
        onPanResponderMove: (evt, gestureState) => {
          handleScroll(gestureState);
        },
        onPanResponderRelease: () => {
          setTimeout(() => {
            setScrollIndicatorVisible(false);
            setCurrentLetter('');
          }, 500);
        },
      })
    ).current;
  
    const handleScroll = (gestureState) => {
      const sectionHeight = windowHeight / alphabet.length;
      const sectionIndex = Math.min(
        Math.max(Math.floor(gestureState.moveY / sectionHeight), 0),
        alphabet.length - 1
      );
      const letter = alphabet[sectionIndex];
      setCurrentLetter(letter);
    
      if (!listRef.current) return;
    
      const index = filteredCocktails.findIndex(cocktail => {
        const firstChar = cocktail.strDrink.charAt(0).toUpperCase();
        if (letter === '#') {
          return !isNaN(firstChar);
        }
        return firstChar === letter;
      });
    
      if (index !== -1) {
        const offset = 220 * Math.floor(index / 2);
        listRef.current.scrollToOffset({
          offset,
          animated: false
        });
      }
    };

    const preloadImage = (uri) => {
      return new Promise((resolve, reject) => {
        Image.prefetch(uri)
          .then(() => resolve())
          .catch(() => resolve()); 
      });
    };

    const filterCocktails = () => {
      let filtered = [...allCocktails];
    
      if (searchText) {
        filtered = filtered.filter(cocktail => 
          cocktail.strDrink.toLowerCase().includes(searchText.toLowerCase())
        );
      }
    
      if (selectedCategories.size > 0) {
        filtered = filtered.filter(cocktail => 
          selectedCategories.has(cocktail.strCategory)
        );
      }
    
      if (selectedIngredients.size > 0) {
        filtered = filtered.filter(cocktail => {
          const cocktailIngredients = getIngredients(cocktail).map(i => i.name);
          return Array.from(selectedIngredients).some(ingredient => 
            cocktailIngredients.includes(ingredient)
          );
        });
      }
      filtered = sortCocktailsByName(filtered);
      setFilteredCocktails(filtered);
    };
    
    const fetchCocktails = async () => {
      try {
        setLoading(true);
        const letters = 'abcdefg'.split('');
        const allDrinks = [];   
        const groupSize = 5;
        let totalLoadedItems = 0;
        
        for (let i = 0; i < letters.length; i += groupSize) {
          const letterGroup = letters.slice(i, i + groupSize);
          const promises = letterGroup.map(letter =>
            fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?f=${letter}`)
              .then(response => response.json())
          );
    
          const results = await Promise.all(promises);
          const newDrinks = results
            .flatMap(result => result.drinks || [])
            .filter(Boolean);
          
          const imagePromises = newDrinks.map(drink => 
            preloadImage(drink.strDrinkThumb)
          );
          await Promise.all(imagePromises);
          allDrinks.push(...newDrinks);
          totalLoadedItems = allDrinks.length;
          setLoadingProgress(((i + groupSize) / letters.length) * 100);
          const sortedDrinks = sortCocktailsByName(allDrinks);
          setAllCocktails(sortedDrinks);
          setFilteredCocktails(sortedDrinks);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
    
      } catch (error) {
        console.error('Erreur lors du chargement des cocktails:', error);
      } finally {
        setLoading(false);
        setLoadingProgress(0);
      }
    };

  const toggleCategory = (category) => {
    const newCategories = new Set(selectedCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setSelectedCategories(newCategories);
  };

  const toggleIngredient = (ingredient) => {
    const newIngredients = new Set(selectedIngredients);
    if (newIngredients.has(ingredient)) {
      newIngredients.delete(ingredient);
    } else {
      newIngredients.add(ingredient);
    }
    setSelectedIngredients(newIngredients);
  };

  const resetFilters = () => {
    setSelectedCategories(new Set());
    setSelectedIngredients(new Set());
  };

  const renderLoader = () => (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loaderText, { color: theme.text }]}>
        Chargement des cocktails... {Math.round(loadingProgress)}%
      </Text>
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              backgroundColor: theme.primary,
              width: `${loadingProgress}%` 
            }
          ]} 
        />
      </View>
    </View>
  );

  const letterIndicatorStyle = {
    ...styles.letterIndicator,
    opacity: indicatorAnim,
    transform: [
      { translateY: -25 },
      {
        scale: indicatorAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1]
        })
      }
    ]
  };
  

  const renderFilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={filterModalVisible}
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalView, { backgroundColor: theme.surface }]}>
          <View style={styles.filterHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Filtres</Text>
            <TouchableOpacity
              onPress={resetFilters}
              style={[styles.resetButton, { borderColor: theme.primary }]}
            >
              <Text style={[styles.resetButtonText, { color: theme.primary }]}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.filterSectionTitle, { color: theme.text }]}>Catégories</Text>
            <View style={styles.filterGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => toggleCategory(category)}
                  style={[
                    styles.filterChip,
                    selectedCategories.has(category) && { backgroundColor: theme.primary },
                    { borderColor: theme.primary }
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: selectedCategories.has(category) ? theme.textReverse : theme.text }
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.filterSectionTitle, { color: theme.text }]}>Ingrédients</Text>
            <View style={styles.filterGrid}>
              {ingredients.slice(0, 20).map((ingredient) => (
                <TouchableOpacity
                  key={ingredient}
                  onPress={() => toggleIngredient(ingredient)}
                  style={[
                    styles.filterChip,
                    selectedIngredients.has(ingredient) && { backgroundColor: theme.primary },
                    { borderColor: theme.primary }
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: selectedIngredients.has(ingredient) ? theme.textReverse : theme.text }
                    ]}
                  >
                    {ingredient}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.primary }]}
            onPress={() => setFilterModalVisible(false)}
          >
            <Text style={[styles.closeButtonText, { color: theme.textReverse }]}>Appliquer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={[styles.searchInputContainer, { backgroundColor: theme.surface }]}>
        <MaterialIcons name="search" size={24} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Rechercher un cocktail..."
          placeholderTextColor={theme.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText !== '' && (
          <TouchableOpacity 
            onPress={() => setSearchText('')}
            style={styles.clearButton}
          >
            <MaterialIcons name="clear" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity 
        style={[styles.filterButton, { backgroundColor: theme.surface }]}
        onPress={() => setFilterModalVisible(true)}
      >
        <MaterialIcons 
          name="filter-list" 
          size={24} 
          color={selectedCategories.size > 0 || selectedIngredients.size > 0 ? theme.primary : theme.text} 
        />
      </TouchableOpacity>
    </View>
  );

  const animateHeaderPress = () => {
    Animated.sequence([
      Animated.timing(headerScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(headerScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (storedFavorites) {
        const favoritesArray = JSON.parse(storedFavorites);
        setFavorites(new Set(favoritesArray));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
    }
  };

  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(newFavorites)));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des favoris:', error);
    }
  };

  const toggleFavorite = async (cocktailId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(cocktailId)) {
      newFavorites.delete(cocktailId);
    } else {
      newFavorites.add(cocktailId);
    }
    setFavorites(newFavorites);
    await saveFavorites(newFavorites);
  };

  const showFavorites = async () => {
    if (favorites.size === 0) return;

    const favCocktails = [];
    for (const id of favorites) {
      try {
        const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${id}`);
        const data = await response.json();
        if (data.drinks && data.drinks[0]) {
          favCocktails.push(data.drinks[0]);
        }
      } catch (error) {
        console.error(error);
      }
    }
    setFavoriteCocktails(favCocktails);
    setFavoritesModalVisible(true);
  };

  const handleCocktailPress = async (cocktailId) => {
    try {
      const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${cocktailId}`);
      const data = await response.json();
      setSelectedCocktail(data.drinks[0]);
      setModalVisible(true);
      setFavoritesModalVisible(false);
    } catch (error) {
      console.error(error);
    }
  };

  const getIngredients = (cocktail) => {
    const ingredients = [];
    for (let i = 1; i <= 15; i++) {
      const ingredient = cocktail[`strIngredient${i}`];
      const measure = cocktail[`strMeasure${i}`];
      if (ingredient) {
        ingredients.push({
          name: ingredient,
          measure: measure || ''
        });
      }
    }
    return ingredients;
  };

  const renderFavoritesModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={favoritesModalVisible}
      onRequestClose={() => setFavoritesModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalView, { backgroundColor: theme.surface }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Mes Cocktails Favoris</Text>
          <ScrollView>
            {favoriteCocktails.map((cocktail) => (
              <TouchableOpacity
                key={cocktail.idDrink}
                style={[styles.favoriteItem, { backgroundColor: theme.background }]}
                onPress={() => handleCocktailPress(cocktail.idDrink)}
              >
                <Image
                  source={{ uri: cocktail.strDrinkThumb }}
                  style={styles.favoriteItemImage}
                />
                <Text style={[styles.favoriteItemText, { color: theme.text }]}>
                  {cocktail.strDrink}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.primary }]}
            onPress={() => setFavoritesModalVisible(false)}
          >
            <Text style={[styles.closeButtonText, { color: theme.textReverse }]}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderCocktailModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalView, { backgroundColor: theme.surface }]}>
          <ScrollView>
            {selectedCocktail && (
              <>
                <Image
                  source={{ uri: selectedCocktail.strDrinkThumb }}
                  style={styles.modalImage}
                />
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {selectedCocktail.strDrink}
                </Text>
                
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Catégorie</Text>
                <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                  {selectedCocktail.strCategory}
                </Text>
                
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Ingrédients</Text>
                {getIngredients(selectedCocktail).map((ingredient, index) => (
                  <Text 
                    key={index} 
                    style={[styles.modalText, { color: theme.textSecondary }]}
                  >
                    • {ingredient.measure} {ingredient.name}
                  </Text>
                ))}
                
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Instructions</Text>
                <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                  {selectedCocktail.strInstructions}
                </Text>
              </>
            )}
          </ScrollView>
          
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.primary }]}
            onPress={() => setModalVisible(false)}
          >
            <Text style={[styles.closeButtonText, { color: theme.textReverse }]}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            animateHeaderPress();
            setTimeout(onBack, 200);
          }} 
          style={styles.backButton}
        >
          <Animated.View style={{ transform: [{ scale: headerScaleAnim }] }}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </Animated.View>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Cocktails</Text>
        <TouchableOpacity 
          onPress={showFavorites}
          style={styles.favoriteButton}
        >
          <MaterialIcons 
            name={favorites.size > 0 ? "star" : "star-border"}
            size={24} 
            color={theme.text} 
          />
        </TouchableOpacity>
      </View>

      {renderSearchBar()}
    <View style={styles.contentContainer}>
      {loading ? (
        renderLoader()
      ) : (
        <FlatList
          ref={listRef}
          data={filteredCocktails}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={[styles.cocktailCard, { backgroundColor: theme.surface }]}>
              <TouchableOpacity
                style={styles.favoriteCardButton}
                onPress={() => toggleFavorite(item.idDrink)}
              >
                <MaterialIcons 
                  name={favorites.has(item.idDrink) ? "star" : "star-border"}
                  size={24} 
                  color={theme.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleCocktailPress(item.idDrink)}
                style={styles.cocktailCardContent}
              >
                <Image
                   source={{ uri: item.strDrinkThumb }}
                   style={styles.cocktailImage}
                   progressiveRenderingEnabled={true}
                   fadeDuration={0}
                />
                <Text 
                  style={[styles.cocktailName, { color: theme.text }]}
                  numberOfLines={2}
                >
                  {item.strDrink}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={item => item.idDrink}
          getItemLayout={(data, index) => ({
            length: 220,
            offset: 220 * Math.floor(index / 2),
            index,
          })}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={21}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
          onScrollToIndexFailed={(info) => {
            const wait = new Promise(resolve => setTimeout(resolve, 100));
            wait.then(() => {
              if (listRef.current) {
                listRef.current.scrollToOffset({ offset: 0, animated: false });
                setTimeout(() => {
                  listRef.current?.scrollToIndex({
                    index: info.index,
                    animated: false,
                    viewPosition: 0
                  });
                }, 100);
              }
            });
          }}
        />
      )}

        <View
          style={styles.alphabetContainer}
          {...panResponder.panHandlers}
        >
          {alphabet.map((letter) => (
            <TouchableOpacity
              key={letter}
              onPress={() => handleLetterPress(letter)}
              style={styles.alphabetButton}
            >
              <Text
                style={[
                  styles.alphabetLetter,
                  { color: theme.textSecondary },
                  currentLetter === letter && styles.alphabetLetterActive
                ]}
              >
                {letter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {scrollIndicatorVisible && (
          <Animated.View style={[letterIndicatorStyle, { backgroundColor: theme.primary }]}>
          <Text style={[styles.letterIndicatorText, { color: theme.textReverse }]}>
            {currentLetter}
          </Text>
        </Animated.View>
        )}
      </View>
      
      {renderCocktailModal()}
      {renderFavoritesModal()}
      {renderFilterModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
  },
  favoriteButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 10,
    paddingRight: 30, 
  },
  cocktailCard: {
    flex: 1,
    margin: 10,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  cocktailCardContent: {
    flex: 1,
  },
  favoriteCardButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    padding: 5,
  },
  cocktailImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  cocktailName: {
    padding: 10,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalView: {
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
  closeButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  favoriteItemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  favoriteItemText: {
    fontSize: 16,
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  resetButton: {
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 15,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  alphabetButton: {
    padding: 2,
    width: 20,
    alignItems: 'center',
  },
  alphabetLetterActive: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  alphabetContainer: {
    position: 'absolute',
    right: 5,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 10,
    width: 20,
    zIndex: 1, 
  },
  alphabetLetter: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  letterIndicator: {
    position: 'absolute',
    right: 35,
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -25 }],
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  letterIndicatorText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loaderText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '80%',
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.5s ease-in-out',
  },
});