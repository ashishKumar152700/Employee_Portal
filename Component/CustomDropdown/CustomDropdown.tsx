import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";

const options = [
  { label: "Full-day", value: "full-day" },
  { label: "1st Half", value: "first-half" },
  { label: "2nd Half", value: "second-half" },
];

const CustomDropdown = ({ selectedOption, setSelectedOption, setTotalDays }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (item: any) => {
    setSelectedOption(item.value);
    setTotalDays(item.value === "full-day" ? 1 : 0.5);
    setModalVisible(false);
  };

  return (
    <>
      <Text style={styles.label}>Leave Day Part</Text>

      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.dropdownButtonText}>
          {options.find((o) => o.value === selectedOption)?.label ||
            "Select Leave Day Part"}
        </Text>
      </TouchableOpacity>

      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};
const styles = StyleSheet.create({
    label: {
      fontSize: 16,
      marginBottom: 8,
      color: "#333",
    },
    dropdownButton: {
      borderWidth: 1,
      borderColor: "gray",
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 12,
      backgroundColor: "#fff",
    },
    dropdownButtonText: {
      fontSize: 16,
      color: "#000",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    modalContainer: {
      backgroundColor: "#fff",
      borderRadius: 12,
      paddingVertical: 16,
    },
    optionButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    optionText: {
      fontSize: 16,
      color: "#333",
    },
  });
  

export default CustomDropdown;
