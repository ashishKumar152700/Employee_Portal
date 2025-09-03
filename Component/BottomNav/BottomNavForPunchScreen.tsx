import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import PunchScreen from '../../Screen/Attendance/Punch';
import Schedule from '../../Screen/Calander/Calander';

export default function BottomNavForPunchScreen() {
  const layout = useWindowDimensions();
  const [page, setPage] = useState(0);
  const pagerRef = useRef(null);

  const onPageSelected = (e) => {
    setPage(e.nativeEvent.position);
  };

  const navigateToPage = (pageNumber) => {
    if (pagerRef.current) {
      pagerRef.current.setPage(pageNumber);
      setPage(pageNumber);
    }
  };

  return (
    <View style={styles.container}>
      <PagerView
        style={[styles.pagerView, { width: layout.width }]}
        initialPage={0}
        onPageSelected={onPageSelected}
        ref={pagerRef}
      >
        <View key="1" style={styles.page}>
          <PunchScreen />
        </View>
        <View key="2" style={styles.page}>
          <Schedule />
        </View>
      </PagerView>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, page === 0 && styles.activeTab]}
          onPress={() => navigateToPage(0)}
        >
          <View style={styles.tabContent}>
            <Text style={[styles.tabText, page === 0 && styles.activeTabText]}>
              Attendance
            </Text>
            {page === 0 && <View style={styles.activeIndicator} />}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, page === 1 && styles.activeTab]}
          onPress={() => navigateToPage(1)}
        >
          <View style={styles.tabContent}>
            <Text style={[styles.tabText, page === 1 && styles.activeTabText]}>
              Calendar
            </Text>
            {page === 1 && <View style={styles.activeIndicator} />}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    color: 'rgba(0, 41, 87, 0.6)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
    activeTab: {
    borderTopWidth: 3,
    borderColor: '#ff9f43',
  },
  activeTabText: {
    color: 'rgb(0, 41, 87)',
    fontWeight: '600',
  },
  activeIndicator: {
    height: 3,
    width: '80%',
    backgroundColor: 'rgb(0, 41, 87)',
    borderRadius: 2,
  },
});
// import React, { useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   useWindowDimensions,
// } from 'react-native';
// import PagerView from 'react-native-pager-view';
// import PunchScreen from '../../Screen/Attendance/Punch';
// import Schedule from '../../Screen/Calander/Calander';

// export default function BottomNavForPunchScreen() {
//   const layout = useWindowDimensions();
//   const [page, setPage] = useState(0);
//   const pagerRef = useRef(null);

//   // Update the state when the page is swiped
//   const onPageSelected = (e) => {
//     setPage(e.nativeEvent.position);
//   };

//   // Navigate to the selected page when a tab is pressed
//   const navigateToPage = (pageNumber) => {
//     if (pagerRef.current) {
//       pagerRef.current.setPage(pageNumber);
//       setPage(pageNumber);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <PagerView
//         style={[styles.pagerView, { width: layout.width }]}
//         initialPage={0}
//         onPageSelected={onPageSelected}
//         ref={pagerRef}
//       >
//         <View key="1" style={styles.page}>
//           <PunchScreen />
//         </View>
//         <View key="2" style={styles.page}>
//           <Schedule />
//         </View>
//       </PagerView>

  
//       <View style={styles.tabBar}>
//         <TouchableOpacity
//           style={[styles.tabItem , page === 0 && styles.activeTab]}
//           onPress={() => navigateToPage(0)}
//         >
//           <Text style={[styles.tabText, page === 0 && styles.activeTabText]}>
//             Attendance
//           </Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.tabItem , page === 1 && styles.activeTab]}
//           onPress={() => navigateToPage(1)}
//         >
//           <Text style={[styles.tabText, page === 1 && styles.activeTabText]}>
//             Calander
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   pagerView: {
//     flex: 1,
//   },
//   page: {
//     flex: 1,
//   },
//   tabBar: {
//     flexDirection: 'row',
//     height: 66,
//     borderTopWidth: 1,
//     borderTopColor: '#e0e0e0',
//     backgroundColor: 'rgb(0, 41, 87)',
//   },
//   tabItem: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   tabText: {
//     color: '#fff',
//     fontSize: 16,
//   },
//   activeTabText: {
//     fontWeight: 'bold',
//     color: '#ff9f43',
//   },
//   activeTab: {
//     borderTopWidth: 3,
//     borderColor: '#ff9f43',
//   },
// });

