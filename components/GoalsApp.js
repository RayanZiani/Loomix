import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';


const sampleGoals = [
  {
    id: '1',
    title: "Faire les courses",
    description: "Acheter des fruits, légumes et produits essentiels"
  },
  {
    id: '2',
    title: "Sport hebdomadaire",
    description: "Aller à la salle de sport 3 fois par semaine"
  },
  {
    id: '3',
    title: "Randonnée",
    description: "Monter à plus de 5000m d'altitude"
  },
];

export default function GoalsApp({ onBack, theme }) {
  const [goals, setGoals] = useState(sampleGoals);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingGoal, setEditingGoal] = useState(null);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const headerScaleAnim = useRef(new Animated.Value(1)).current;

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

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateSlide = (toValue) => {
    Animated.spring(slideAnim, {
      toValue,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const addGoal = () => {
    if (title.trim().length > 0) {
      const newGoal = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
      };
      setGoals(currentGoals => [...currentGoals, newGoal]);
      setTitle('');
      setDescription('');
      setModalVisible(false);
    }
  };

  const deleteGoal = (goalId) => {
    setGoals(currentGoals => currentGoals.filter(goal => goal.id !== goalId));
  };

  const editGoal = (goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description);
    setModalVisible(true);
  };

  const saveEdit = () => {
    if (title.trim().length > 0) {
      setGoals(currentGoals =>
        currentGoals.map(goal =>
          goal.id === editingGoal.id
            ? { ...goal, title: title.trim(), description: description.trim() }
            : goal
        )
      );
      setModalVisible(false);
      setTitle('');
      setDescription('');
      setEditingGoal(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            animateHeaderPress();
            setTimeout(onBack, 200);
          }} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: headerScaleAnim }] }}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </Animated.View>
        </TouchableOpacity>
        <Animated.Text 
          style={[
            styles.title, 
            { 
              color: theme.text,
              transform: [{ scale: headerScaleAnim }]
            }
          ]}
        >
          Mes Objectifs
        </Animated.Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            setEditingGoal(null);
            setTitle('');
            setDescription('');
            setModalVisible(true);
          }}
        >
          <MaterialIcons name="add" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={goals}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item, index }) => (
          <Animated.View
            style={[
              styles.goalItemContainer,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateX: slideAnim },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.goalItem,
                { backgroundColor: theme.surface }
              ]}
              onPress={() => editGoal(item)}
              activeOpacity={0.7}
            >
              <View style={styles.goalContent}>
                <Text style={[styles.goalTitle, { color: theme.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.goalDescription, { color: theme.textSecondary }]}>
                  {item.description}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => deleteGoal(item.id)}
                style={styles.deleteButton}
              >
                <MaterialIcons name="delete-outline" size={22} color={theme.text} />
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        )}
        keyExtractor={item => item.id}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalView, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingGoal ? 'Modifier l\'objectif' : 'Nouvel objectif'}
            </Text>
            
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: theme.border
              }]}
              placeholder="Titre"
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
            />
            
            <TextInput
              style={[styles.modalInput, {
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: theme.border,
                height: 100
              }]}
              placeholder="Description"
              placeholderTextColor={theme.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: theme.text }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.buttonText, { color: theme.text }]}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.text }]}
                onPress={editingGoal ? saveEdit : addGoal}
              >
                <Text style={[styles.buttonText, { color: theme.background }]}>
                  {editingGoal ? 'Modifier' : 'Ajouter'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: {
    padding: 8,
  },
  listContainer: {
    padding: 20,
  },
  goalItemContainer: {
    marginBottom: 15,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  goalDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalView: {
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 0.48,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});