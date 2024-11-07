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
  Animated
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function CocktailsApp({ onBack, theme }) {
  const [cocktails, setCocktails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCocktail, setSelectedCocktail] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const headerScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchCocktails();
  }, []);

  const fetchCocktails = async () => {
    try {
      const response = await fetch('https://www.thecocktaildb.com/api/json/v1/1/search.php?f=a');
      const data = await response.json();
      setCocktails(data.drinks || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleCocktailPress = async (cocktailId) => {
    try {
      const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${cocktailId}`);
      const data = await response.json();
      setSelectedCocktail(data.drinks[0]);
      setModalVisible(true);
    } catch (error) {
      console.error(error);
    }
  };

  const getIngredients = (cocktail) => {
    const ingredients = [];
    for (let i = 1; i <= 45; i++) {
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
            style={[styles.closeButton, { backgroundColor: theme.green }]}
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
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.green} style={styles.loader} />
      ) : (
        <FlatList
          data={cocktails}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.cocktailCard, { backgroundColor: theme.surface }]}
              onPress={() => handleCocktailPress(item.idDrink)}
            >
              <Image
                source={{ uri: item.strDrinkThumb }}
                style={styles.cocktailImage}
              />
              <Text 
                style={[styles.cocktailName, { color: theme.text }]}
                numberOfLines={2}
              >
                {item.strDrink}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.idDrink}
        />
      )}
      
      {renderCocktailModal()}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    padding: 10,
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
});