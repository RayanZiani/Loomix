import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Animated,
  Platform,
  UIManager,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function WeatherApp({ weather, forecast, loading, onBack, onRefresh, theme }) {
  const [refreshing, setRefreshing] = React.useState(false);
  const [isForecastExpanded, setIsForecastExpanded] = React.useState(false);
  const headerScaleAnim = React.useRef(new Animated.Value(1)).current;
  const arrowRotation = React.useRef(new Animated.Value(0)).current;

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const toggleForecast = () => {
    setIsForecastExpanded(!isForecastExpanded);
    Animated.spring(arrowRotation, {
      toValue: isForecastExpanded ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 40
    }).start();
  };

  const rotation = arrowRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

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

  const getWeatherIcon = (weatherId) => {
    if (weatherId >= 200 && weatherId < 300) return 'flash-on';
    if (weatherId >= 300 && weatherId < 500) return 'grain';
    if (weatherId >= 500 && weatherId < 600) return 'umbrella';
    if (weatherId >= 600 && weatherId < 700) return 'ac-unit';
    if (weatherId >= 700 && weatherId < 800) return 'blur-on';
    if (weatherId === 800) return 'wb-sunny';
    return 'cloud';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[date.getDay()];
  };

  const WeatherSkeleton = () => (
    <View style={styles.weatherContainer}>
      {/* Icon skeleton */}
      <View style={[styles.skeletonCircle, { backgroundColor: theme.border }]} />
      
      {/* Location skeleton */}
      <View style={[styles.skeletonLine, { 
        width: 200, 
        height: 30,
        marginTop: 20,
        backgroundColor: theme.border 
      }]} />
      
      {/* Temperature skeleton */}
      <View style={[styles.skeletonLine, { 
        width: 120, 
        height: 50,
        marginVertical: 10,
        backgroundColor: theme.border 
      }]} />
      
      {/* Description skeleton */}
      <View style={[styles.skeletonLine, { 
        width: 160,
        marginBottom: 20,
        backgroundColor: theme.border 
      }]} />

      {/* Details skeleton */}
      <View style={[styles.detailsContainer, { backgroundColor: theme.surface }]}>
        {[1, 2, 3].map((_, index) => (
          <View key={index} style={styles.detailItem}>
            <View style={[styles.skeletonCircle, { 
              width: 24, 
              height: 24, 
              backgroundColor: theme.border 
            }]} />
            <View style={[styles.skeletonLine, { 
              width: 40, 
              marginTop: 5,
              backgroundColor: theme.border 
            }]} />
          </View>
        ))}
      </View>
      
      {/* Forecast skeleton */}
      <View style={[styles.forecastContainer, { 
        backgroundColor: theme.surface,
        marginTop: 20
      }]}>
        <View style={styles.forecastHeader}>
          <View style={[styles.skeletonLine, { 
            width: 140,
            backgroundColor: theme.border 
          }]} />
          <View style={[styles.skeletonCircle, { 
            width: 24,
            height: 24,
            backgroundColor: theme.border 
          }]} />
        </View>
      </View>
    </View>
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
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: headerScaleAnim }] }}>
            <MaterialIcons name="arrow-back" size={24} color={theme.secondary} />
          </Animated.View>
        </TouchableOpacity>
        <Animated.Text style={[
          styles.title,
          { color: theme.text, transform: [{ scale: headerScaleAnim }] }
        ]}>
          Météo
        </Animated.Text>
      </View>

      <ScrollView
  contentContainerStyle={styles.scrollContent}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={theme.secondary}
      colors={[theme.secondary]}
    />
  }
>
  {!weather || loading ? (
    <WeatherSkeleton />
  ) : (
    <>
      <View style={styles.weatherContainer}>
        <MaterialIcons 
          name={getWeatherIcon(weather.weather[0].id)} 
          size={100} 
          color={theme.secondary} 
        />
        
        <Text style={[styles.location, { color: theme.text }]}>
          {weather.name}
        </Text>
        
        <Text style={[styles.temperature, { color: theme.text }]}>
          {Math.round(weather.main.temp)}°C
        </Text>
        
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {weather.weather[0].description}
        </Text>

        <View style={[styles.detailsContainer, { backgroundColor: theme.surface }]}>
          <View style={styles.detailItem}>
            <MaterialIcons name="opacity" size={24} color={theme.secondary} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {weather.main.humidity}%
            </Text>
          </View>

          <View style={styles.detailItem}>
            <MaterialIcons name="air" size={24} color={theme.secondary} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {Math.round(weather.wind.speed * 3.6)} km/h
            </Text>
          </View>

          <View style={styles.detailItem}>
            <MaterialIcons name="compress" size={24} color={theme.secondary} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {Math.round(weather.main.pressure)} hPa
            </Text>
          </View>
        </View>
      </View>
      
      <View style={[styles.forecastContainer, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          onPress={toggleForecast}
          style={styles.forecastHeader}
          activeOpacity={0.7}
        >
          <Text style={[styles.forecastTitle, { color: theme.text }]}>
            Prévisions 5 jours
          </Text>
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <MaterialIcons
              name="keyboard-arrow-down"
              size={24}
              color={theme.secondary}
            />
          </Animated.View>
        </TouchableOpacity>

        {isForecastExpanded && (
          <View style={styles.forecastContent}>
            {forecast?.list?.filter((item, index) => index % 8 === 0).slice(0, 5).map((day, index) => (
              <View key={index} style={styles.forecastDay}>
                <Text style={[styles.forecastDayText, { color: theme.text }]}>
                  {formatDate(day.dt)}
                </Text>
                <View style={styles.forecastIconTemp}>
                  <MaterialIcons
                    name={getWeatherIcon(day.weather[0].id)}
                    size={24}
                    color={theme.secondary}
                  />
                  <Text style={[styles.forecastTemp, { color: theme.text }]}>
                    {Math.round(day.main.temp)}°C
                  </Text>
                </View>
                <Text style={[styles.forecastDescription, { color: theme.textSecondary }]}>
                  {day.weather[0].description}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </>
  )}
</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 44,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherContainer: {
    alignItems: 'center',
    padding: 20,
  },
  location: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  description: {
    fontSize: 20,
    textTransform: 'capitalize',
    marginBottom: 20,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailText: {
    marginTop: 5,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  forecastContainer: {
    margin: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  forecastTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  forecastContent: {
    overflow: 'hidden',
  },
  forecastDay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  forecastDayText: {
    fontSize: 16,
    width: 50,
  },
  forecastIconTemp: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  forecastTemp: {
    fontSize: 16,
    marginLeft: 8,
  },
  forecastDescription: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  skeletonCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  skeletonLine: {
    height: 20,
    borderRadius: 4,
    marginVertical: 8,
  },
});