import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, View, Button } from 'react-native';
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import Modal from "react-native-modal";

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
      id: 'MICX302',
      name: 'Headphone',
      location: 'Boat',
      image: require('../../assets/device/headphones_PNG101978.png'),
    },
    {
      id: 'MICX3064',
      name: 'Dockstation',
      location: 'Dlink',
      image: require('../../assets/device/docking.png'),
    },
  ];

  const renderItem = ({ item }: { item: Asset }) => {
    const handleChevronPress = (): void => {
      setSelectedItem(item);
      setShowAlert(true);
    };

    return (
      <TouchableOpacity>
        <LinearGradient
          colors={['white', 'white', '#D3D3D3']}
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
          <TouchableOpacity onPress={handleChevronPress}>
            <Ionicons name="arrow-forward" size={24} color="#999" />
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Raise Ticket For</Text>
      </View>

      <FlatList
        data={assets}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />

       
      <Modal isVisible={showAlert} onBackdropPress={() => setShowAlert(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.alertTitle}>Are you sure?</Text>
          <Text style={styles.alertMessage}>
            Do you want to raise a ticket for this category?
          </Text>
          <View style={styles.buttonContainer}>
            <Button title="Cancel" color="#DD6B55" onPress={() => setShowAlert(false)} />
            <Button title="OK" color="#2089dc" onPress={() => setShowAlert(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '400',
    marginBottom: 10,
  },
  list: {
    padding: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    margin: 5,
    borderWidth: 2,
    borderColor: '#fff',
    marginBottom: 10,
    borderRadius: 15,
  },
  itemImage: {
    width: 70,
    height: 80,
    borderRadius: 8,
    resizeMode: 'contain',
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
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
  },
});

