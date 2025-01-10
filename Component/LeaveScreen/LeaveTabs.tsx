import * as React from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useEffect, useState } from 'react';
import { leaveHistoryPending } from '../../Services/Leave/Leave.service';
import { Swipeable } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/FontAwesome'; // Import the icon library

const LeaveRoute = ({ leaveType }) => {
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    
  useEffect(() => {
    const fetchLeaveData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await leaveHistoryPending(leaveType);
        if (response.status === 200) {
          setLeaveData(response.data.data);
        } else {
          setError('Failed to fetch data');
        }
      } catch (error) {
        setError('Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveData();
  }, [leaveType]);

  const handleCancel = (id) => {
    Alert.alert(
      'Cancel Leave',
      'Are you sure you want to cancel this leave?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => {
            setLeaveData((prev) => prev.filter((item) => item.id !== id));
          },
        },
      ]
    );
  };

  const renderRightActions = (id, cardHeight) => (
    <TouchableOpacity
      style={[styles.rightAction, { height: cardHeight }]} // Set height dynamically
      onPress={() => handleCancel(id)}
    >
      <Icon name="trash" size={24} color="white" />
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="purple" style={styles.loader} />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <FlatList
    data={leaveData}
    keyExtractor={(item) => item.id.toString()}
    renderItem={({ item }) => {
      // Measure card height dynamically
      let cardHeight : any;
      return (
        <View
          onLayout={(event) => {
            cardHeight = event.nativeEvent.layout.height; // Capture card height
          }}
        >
          {leaveType === 'Pending' ? (
            <Swipeable renderRightActions={() => renderRightActions(item.id, cardHeight)}>
              <View style={styles.itemContainer}>
                <Text style={styles.itemText}>Leave Type: {item.leavetype}</Text>
                <Text style={styles.itemText}>
                  Apply Date: {new Date(item.applydate).toLocaleDateString()}
                </Text>
                <Text style={styles.itemText}>
                  Period: {item.leavestart} to {item.leaveend}
                </Text>
                <Text style={styles.itemText}>Reason: {item.reason}</Text>
              </View>
            </Swipeable>
          ) : (
            <View style={styles.itemContainer}>
              <Text style={styles.itemText}>Leave Type: {item.leavetype}</Text>
              <Text style={styles.itemText}>
                Apply Date: {new Date(item.applydate).toLocaleDateString()}
              </Text>
              <Text style={styles.itemText}>
                Period: {item.leavestart} to {item.leaveend}
              </Text>
              <Text style={styles.itemText}>Reason: {item.reason}</Text>
            </View>
          )}
        </View>
      );
    }}
    contentContainerStyle={styles.contentContainer}
  />

  );
};

const renderScene = SceneMap({
  first: () => <LeaveRoute leaveType="Pending" />,
  second: () => <LeaveRoute leaveType="Approved" />,
  third: () => <LeaveRoute leaveType="Declined" />,
});

const routes = [
  { key: 'first', title: 'Pending' },
  { key: 'second', title: 'Approve' },
  { key: 'third', title: 'Declined' },
];

export default function TabViewExample() {
  const layout = useWindowDimensions();
  const [index, setIndex] = React.useState(0);

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      renderTabBar={(props) => (
        <TabBar
          {...props}
          style={styles.tabBar}
          indicatorStyle={styles.indicator}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    padding: 10,
    marginTop:14,
    margin: 5,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  contentContainer: {
    paddingBottom: 50,
  },
  tabBar: {
    backgroundColor: 'purple',
  },
  label: {
    color: 'white',
    fontWeight: 'bold',
  },
  indicator: {
    backgroundColor: 'white',
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    fontSize: 18,
  },
  rightAction: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: '100%', // Acts as a fallback if `cardHeight` is not passed
  },
  
  actionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
