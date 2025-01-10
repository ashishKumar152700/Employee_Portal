import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Agenda } from 'react-native-calendars';

const AgendaScreen = () => {
  const [items, setItems] = useState({});

  const loadItems = (day) => {
    const newItems = {};
    for (let i = -15; i < 85; i++) {
      const time = day.timestamp + i * 24 * 60 * 60 * 1000;
      const date = new Date(time).toISOString().split('T')[0];
      if (!items[date]) {
        newItems[date] = [
          {
            name: `Event on ${date}`,
            height: Math.max(50, Math.floor(Math.random() * 150)),
          },
        ];
      }
    }
    setItems({ ...items, ...newItems });
  };

  const renderItem = (item) => {
    return (
      <View style={[styles.item, { height: item.height }]}>
        <Text>{item.name}</Text>
      </View>
    );
  };

  return (
    <Agenda
      items={items}
      loadItemsForMonth={loadItems}
      selected={new Date().toISOString().split('T')[0]}
      renderItem={renderItem}
      renderEmptyDate={() => (
        <View style={styles.emptyDate}>
          <Text>No events for this day</Text>
        </View>
      )}
      rowHasChanged={(r1, r2) => r1.name !== r2.name}
    />
  );
};

const styles = StyleSheet.create({
  item: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    marginTop: 17,
  },
  emptyDate: {
    height: 50,
    flex: 1,
    paddingTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AgendaScreen;
