import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import GoalsApp from './components/GoalsApp';
import WeatherApp from './components/WeatherApp';
import AnimatedBackground from './components/AnimatedBackground';

const API_KEY = '0477eeed5a4fba4055ecc65727d11946';

const themes = {
  dark: {
    isDark: true,
    background: '#121212',
    headerBg: 'rgba(30, 30, 30, 0.8)',
    surface: '#1E1E1E',
    primary: '#1E88E5',
    secondary: '#FB8C00',
    text: '#FFFFFF',
    textReverse: '#1E1E1E',
    textSecondary: '#AAAAAA',
    border: '#333333',
  },
  light: {
    isDark: false,
    background: '#F5F5F5',
    headerBg: 'rgba(255, 255, 255, 0.9)',
    surface: '#FFFFFF',
    primary: '#1976D2',
    secondary: '#F57C00',
    text: '#1E1E1E', 
    textReverse: '#FFFFFF',
    textSecondary: '#666666',
    border: '#E0E0E0',
  }
};
export default function App() {
  const [currentApp, setCurrentApp] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const theme = isDarkMode ? themes.dark : themes.light;

  const scaleAnims = {
    goals: new Animated.Value(1),
    weather: new Animated.Value(1)
  };

  const fetchWeather = async () => {
    if (!location) return;
    
    setLoading(true);
    setWeather(null); // Réinitialiser weather pour forcer l'affichage du skeleton
    setForecast(null); // Réinitialiser forecast
    
    try {
      const [weatherResponse, forecastResponse] = await Promise.all([
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${location.coords.latitude}&lon=${location.coords.longitude}&appid=${API_KEY}&units=metric&lang=fr`
        ),
        fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${location.coords.latitude}&lon=${location.coords.longitude}&appid=${API_KEY}&units=metric&lang=fr`
        )
      ]);
  
      const [weatherData, forecastData] = await Promise.all([
        weatherResponse.json(),
        forecastResponse.json()
      ]);
  
      setWeather(weatherData);
      setForecast(forecastData);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de récupérer les données météo');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'La permission de localisation est nécessaire pour la météo');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeather();
    }
  }, [location]);

  const animatePress = (key) => {
    Animated.sequence([
      Animated.timing(scaleAnims[key], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[key], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: theme.headerBg }]}>
      <View style={styles.headerContent}>
        <View style={styles.profileSection}>
          <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
            <MaterialIcons name="person" size={30} color={theme.text} />
          </View>
          <View style={styles.welcomeText}>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>Bienvenue sur</Text>
            <Text style={[styles.name, { color: theme.text }]}>Loomix Hub</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.themeButton, { backgroundColor: isDarkMode ? theme.surface : theme.border }]}
          onPress={() => setIsDarkMode(!isDarkMode)}
        >
          <MaterialIcons 
            name={isDarkMode ? "light-mode" : "dark-mode"} 
            size={24} 
            color={theme.text} 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.headerBottom}>
        <Text style={[styles.appTitle, { color: theme.text }]}>Mes Applications</Text>
        <View style={[styles.separator, { backgroundColor: theme.primary }]} />
      </View>
    </View>
  );

  const AppIcon = ({ title, icon, onPress, animKey, color }) => (
    <Animated.View style={{
      transform: [{ scale: scaleAnims[animKey] }]
    }}>
      <TouchableOpacity
        style={[styles.appIcon, { backgroundColor: color }]}
        onPress={() => {
          animatePress(animKey);
          setTimeout(onPress, 200);
        }}
        activeOpacity={0.7}
      >
        <MaterialIcons name={icon} size={40} color={theme.text} />
        <Text style={[styles.appTitle, { color: theme.text }]}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
 
  const renderContent = () => {
    if (currentApp === 'goals') {
      return <GoalsApp onBack={() => setCurrentApp(null)} theme={theme} />;
    }
    if (currentApp === 'weather') {
      return (
        <WeatherApp 
          weather={weather} 
          forecast={forecast} 
          loading={loading}
          onBack={() => setCurrentApp(null)}
          onRefresh={fetchWeather}
          theme={theme}
        />
      );
    }

    return (
      <ScrollView style={styles.mainContent}>
        {renderHeader()}
        <View style={styles.menuContainer}>
          <AppIcon
            title="Objectifs"
            icon="list-alt"
            color={theme.primary}
            animKey="goals"
            onPress={() => setCurrentApp('goals')}
          />
          <AppIcon
            title="Météo"
            icon="wb-sunny"
            color={theme.secondary}
            animKey="weather"
            onPress={() => setCurrentApp('weather')}
          />
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AnimatedBackground isDarkMode={isDarkMode} />
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  welcomeText: {
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 14,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBottom: {
    marginTop: 10,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  separator: {
    height: 3,
    width: 40,
    borderRadius: 3,
  },
  mainContent: {
    flex: 1,
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    padding: 20,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    padding: 20,
  },
  appIcon: {
    width: 120,
    height: 120,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  appTitle: {
    color: 'white',
    marginTop: 10,
    fontWeight: 'bold',
  },
});