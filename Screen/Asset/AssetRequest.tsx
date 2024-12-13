
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import AwesomeAlert from 'react-native-awesome-alerts';

type Asset = {
  id: string;
  name: string;
  location: string;
  image: any;
};

export default function AssetModule() {
  const navigation = useNavigation();
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<Asset | null>(null);

  const handlePress = (): void => {
    navigation.navigate('MyTickets' as never);
  };

  const assets: Asset[] = [
    {
      id: 'LG0012',
      name: 'Laptop',
      location: 'Dell',
      image: require('../../assets/device/laptop_PNG101814.png'),
    },
    {
      id: 'EVA028',
      name: 'Mouse',
      location: 'Dell',
      image: require('../../assets/device/mouse_PNG7668.png'),
    },
    {
      id: 'APP69133',
      name: 'Keyboard',
      location: 'HP',
      image: require('../../assets/device/keyboard_PNG101890.png'),
    },
    {
      id: 'CAM486',
      name: 'Monitor',
      location: 'Acer',
      image: require('../../assets/device/Monitor.png'),
    },
    {
      id: 'MICX30',
      name: 'Docksection',
      location: 'HP',
      image: require('../../assets/device/printer_PNG101579.png'),
    },
    {
      id: 'MICX30',
      name: 'Headphone',
      location: 'Boat',
      image: require('../../assets/device/headphones_PNG101978.png'),
    },
    {
      id: 'MICX3064',
      name: 'Dockstation',
      location: 'Dlink',
      image: require('../../assets/device/docking-station-usb-c.png'),
    },
  ];

  const renderItem = ({ item }: { item: Asset }) => {
    const handleItemPress = (): void => {
      setSelectedItem(item);
      setShowAlert(true);
    };

    return (
      <TouchableOpacity onPress={handleItemPress}>
        <LinearGradient
          colors={['white', '#D3D3D3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.item}
        >
          <Image source={item.image} style={styles.itemImage} />
          <View>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDetails}>
              ID: {item.id} {item.location}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <View style={{ justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row' }}>
        <Text style={{ fontSize: 15, fontWeight: 'bold' }}>Raise Ticket For</Text>
        <Button style={{backgroundColor:"rgb(0,47,81)"}} mode="contained" onPress={handlePress}>
          MyTickets
        </Button>
      </View>

      <FlatList
        data={assets}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />

      {/* AwesomeAlert for displaying alert */}
      <AwesomeAlert
        show={showAlert}
        showProgress={false}
        closeOnTouchOutside={false}
        closeOnHardwareBackPress={false}
        showCancelButton={true}
        showConfirmButton={true}
        cancelText="Cancel"
        confirmText="OK"
        cancelButtonColor="#DD6B55"
        confirmButtonColor="#2089dc"
        onCancelPressed={() => setShowAlert(false)}
        onConfirmPressed={() => {
          setShowAlert(false);
        }}
        customView={
          <View style={styles.customAlertContainer}>
            <Ionicons name='ios-information-circle-outline' size={60} color="#4CAF50" />
            <Text style={styles.alertTitle}>Are you sure?</Text>
            <Text style={styles.alertMessage}>
              Do you want to raise a ticket for this category?
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    margin: 5,
    borderWidth: 2,
    borderColor: '#fff',
    marginBottom: 10,
    borderRadius: 5,
  },
  itemImage: {
    width: 70,
    height: 80,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  list: {
    padding: 0,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    margin: 6,
  },
  itemDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    justifyContent: 'space-between',
  },
  customAlertContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
});


