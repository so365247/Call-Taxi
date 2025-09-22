// Main_Map.tsx
import { JSX, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import GooglePlacesTextInput from 'react-native-google-places-textinput';
import api from './API';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation, ParamListBase } from '@react-navigation/native';
import { GOOGLE_MAPS_API_KEY } from '@env';

function Main_Map(): JSX.Element {
  console.log('-- Main_Map()');

  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');

  const callTaxi = async () => {
    let userId = (await AsyncStorage.getItem('userId')) || '';

    let startAddr = startAddress;
    let endAddr = endAddress;

    let startLat = `${marker1.latitude}`;
    let startLng = `${marker1.longitude}`;
    let endLat = `${marker2.latitude}`;
    let endLng = `${marker2.longitude}`;

    if (!(startAddr && endAddr)) {
      Alert.alert('알림', '출발지/도착지가 모두 입력되어야합니다.', [
        { text: '확인', style: 'cancel' },
      ]);
      return;
    }

    api
      .call(userId, startLat, startLng, startAddr, endLat, endLng, endAddr)
      .then(response => {
        let { code, message } = response.data[0];
        let title = '알림';
        if (code == 0) {
          navigation.navigate('Main_List');
        } else {
          title = '오류';
        }

        Alert.alert(title, message, [{ text: '확인', style: 'cancel' }]);
      })
      .catch(err => {
        console.log(JSON.stringify(err));
      });
  };

  const [loading, setLoading] = useState(false);
  const [selectedLatLng, setSelectedLatLng] = useState({
    latitude: 0,
    longitude: 0,
  });
  const [selectedAddress, setSelectedAddress] = useState('');

  const mapRef: any = useRef(null);

  const [initialRegion, setInitialRegion] = useState({
    latitude: 37.5666612,
    longitude: 126.9783785,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [showBtn, setShowBtn] = useState(false);

  const handleLongPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;

    setSelectedLatLng(coordinate);

    setLoading(true);
    api
      .geoCoding(coordinate, query.key)
      .then(response => {
        setSelectedAddress(response.data.results[0].formatted_address);
        setShowBtn(true);
        setLoading(false);
      })
      .catch(err => {
        console.log(JSON.stringify(err));
        setLoading(false);
      });
  };

  // ref 대신 setEndAddress를 사용하여 주소 업데이트
  const handleAddMarker = (title: string) => {
    if (selectedAddress) {
      if (title == '출발지') {
        setMarker1(selectedLatLng);
        setStartAddress(selectedAddress);
      } else {
        setMarker2(selectedLatLng);
        setEndAddress(selectedAddress);
      }
      setShowBtn(false);
    }
  };

  let query = {
    key: GOOGLE_MAPS_API_KEY,
  };

  const [marker1, setMarker1] = useState({ latitude: 0, longitude: 0 });
  const [marker2, setMarker2] = useState({ latitude: 0, longitude: 0 });

  const onSelectAddr = (data: any, details: any, type: string) => {
    if (details) {
      let lat = details.geometry.location.lat;
      let lng = details.geometry.location.lng;

      const address = data.description || details.formatted_address;
      if (type === 'start') {
        setStartAddress(address);
        setMarker1({ latitude: lat, longitude: lng });
        if (marker2.longitude == 0) {
          setInitialRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.0073,
            longitudeDelta: 0.0064,
          });
        }
      } else {
        setEndAddress(address);
        setMarker2({ latitude: lat, longitude: lng });
        if (marker1.longitude) {
          setInitialRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.0073,
            longitudeDelta: 0.0064,
          });
        }
      }
    }
  };

  if (marker1.latitude != 0 && marker2.latitude != 0) {
    if (mapRef.current) {
      mapRef.current.fitToCoordinates([marker1, marker2], {
        edgePadding: { top: 150, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }

  const setMyLocation = () => {
    setLoading(true);

    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;

        let coords = { latitude, longitude };
        setMarker1(coords);
        setInitialRegion({
          latitude: 0,
          longitude: 0,
          latitudeDelta: 0,
          longitudeDelta: 0,
        });
        setInitialRegion({
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: 0.0073,
          longitudeDelta: 0.0064,
        });

        api
          .geoCoding(coords, query.key)
          .then(response => {
            let addr = response.data.results[0].formatted_address;
            setStartAddress(addr);
            setLoading(false);
          })
          .catch(err => {
            console.log(JSON.stringify(err));
            setLoading(false);
          });
      },
      error => {
        setLoading(false);
        console.log('Geolocation 오류 / error = ' + JSON.stringify(error));
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 1000,
      },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 지도 */}
      <MapView
        style={styles.container}
        provider={PROVIDER_GOOGLE}
        region={initialRegion}
        ref={mapRef}
        onLongPress={handleLongPress}
        onPress={() => {
          setShowBtn(false);
        }}
      >
        <Marker coordinate={marker1} title="출발 위치" />
        <Marker coordinate={marker2} title="도착 위치" pinColor="blue" />

        {marker1.latitude != 0 && marker2.latitude != 0 && (
          <Polyline
            coordinates={[marker1, marker2]}
            strokeColor="blue"
            strokeWidth={3}
          />
        )}
      </MapView>

      <View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          padding: 10,
        }}
      >
        <View style={{ position: 'absolute', padding: wp(2) }}>
          <View style={{ width: wp(75) }}>
            <GooglePlacesTextInput
              placeHolderText="출발지 검색"
              value={startAddress}
              onTextChange={setStartAddress}
              onPlaceSelect={(data: any, details: any) =>
                onSelectAddr(data, details, 'start')
              }
              fetchDetails={true}
              apiKey={query.key}
              languageCode="ko"
              style={autocompleteStyles}
            />
          </View>

          <View style={{ width: wp(75), marginTop: 10 }}>
            <GooglePlacesTextInput
              placeHolderText="도착지 검색"
              value={endAddress}
              onTextChange={setEndAddress}
              onPlaceSelect={(data: any, details: any) =>
                onSelectAddr(data, details, 'end')
              }
              fetchDetails={true}
              apiKey={query.key}
              languageCode="ko"
              style={autocompleteStyles}
            />
          </View>
        </View>

        {/* 호출 */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              position: 'absolute',
              width: wp(18),
              top: wp(2),
              right: 0,
              height: 90,
              justifyContent: 'center',
            },
          ]}
          onPress={callTaxi}
        >
          <Text style={styles.buttonText}>호출</Text>
        </TouchableOpacity>
      </View>

      {/* 내 위치 */}
      <TouchableOpacity
        style={[{ position: 'absolute', bottom: 20, right: 20 }]}
        onPress={setMyLocation}
      >
        <Icon name="crosshairs" size={40} color={'#3498db'} />
      </TouchableOpacity>

      {showBtn && (
        <View
          style={{
            position: 'absolute',
            top: hp(50) - 45,
            left: wp(50) - 75,
            height: 90,
            width: 150,
          }}
        >
          <TouchableOpacity
            style={[styles.button, { flex: 1, marginVertical: 1 }]}
            onPress={() => handleAddMarker('출발지')}
          >
            <Text style={styles.buttonText}>출발지로 등록</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { flex: 1 }]}
            onPress={() => handleAddMarker('도착지')}
          >
            <Text style={styles.buttonText}>도착지로 등록</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal transparent={true} visible={loading}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Icon name="spinner" size={50} color="blue" />
          <Text
            style={{
              backgroundColor: 'white',
              color: 'black',
              height: 20,
            }}
          >
            Loading...
          </Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const autocompleteStyles = StyleSheet.create({
  container: {
    width: '100%',
    marginHorizontal: 0,
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  suggestionsContainer: {
    backgroundColor: '#ffffff',
    maxHeight: 250,
  },
  suggestionItem: {
    padding: 15,
  },
  loadingIndicator: {
    color: '#999',
  },
  placeholder: {
    color: '#999',
  },
});
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonDisable: {
    backgroundColor: 'gray',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderWidth: 2,
    borderColor: 'gray',
    marginVertical: 1,
    padding: 10,
  },
});

export default Main_Map;
