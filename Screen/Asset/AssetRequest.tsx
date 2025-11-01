// Screen/Asset/AssetRequest.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Category, 
  getCategoriesByRole, 
  raiseTicket,
  calculateTicketStats 
} from '../../Services/AssetModule/ticketService';

const { width } = Dimensions.get('window');

// Category icon mapping
const getCategoryIcon = (category: string) => {
  const iconConfig: { [key: string]: { icon: string; color: string; gradient: string[] } } = {
    'MOUSE': { icon: 'mouse-pointer', color: '#4A90E2', gradient: ['#667eea', '#764ba2'] },
    'KEYBOARD': { icon: 'keyboard-o', color: '#50C878', gradient: ['#f093fb', '#f5576c'] },
    'LAPTOP': { icon: 'laptop', color: '#FF6B35', gradient: ['#4facfe', '#00f2fe'] },
    'MONITOR': { icon: 'desktop', color: '#9B59B6', gradient: ['#43e97b', '#38f9d7'] },
    'STORAGE DEVICE': { icon: 'hdd-o', color: '#E67E22', gradient: ['#fa709a', '#fee140'] },
    'HEADPHONE': { icon: 'headphones', color: '#E74C3C', gradient: ['#a8edea', '#fed6e3'] },
    'BIOMETRIC': { icon: 'fingerprint', color: '#2ECC71', gradient: ['#ff9a9e', '#fecfef'] },
    'PRINTER': { icon: 'print', color: '#34495E', gradient: ['#ffecd2', '#fcb69f'] },
    'DOCKSTATION': { icon: 'plug', color: '#8E44AD', gradient: ['#a8caba', '#5d4e75'] },
    'DOCK STATION': { icon: 'plug', color: '#8E44AD', gradient: ['#a8caba', '#5d4e75'] },
    'LAPTOP CHARGER': { icon: 'battery-3', color: '#F39C12', gradient: ['#fdbb2d', '#22c1c3'] },
    'PENDRIVE': { icon: 'usb', color: '#3498DB', gradient: ['#e3ffe7', '#d9e7ff'] },
    'PEN DRIVE': { icon: 'usb', color: '#3498DB', gradient: ['#e3ffe7', '#d9e7ff'] },
    'SERVER': { icon: 'server', color: '#1ABC9C', gradient: ['#667eea', '#764ba2'] },
    'HARDDISK': { icon: 'hdd-o', color: '#7F8C8D', gradient: ['#4facfe', '#00f2fe'] },
    'HARD DISK': { icon: 'hdd-o', color: '#7F8C8D', gradient: ['#4facfe', '#00f2fe'] },
    'LAPTOP BAG': { icon: 'briefcase', color: '#D35400', gradient: ['#43e97b', '#38f9d7'] },
    'TIME ATTENDANCE MACHINE': { icon: 'clock-o', color: '#2C3E50', gradient: ['#667eea', '#764ba2'] },
  };

  return iconConfig[category.toUpperCase()] || {
    icon: 'desktop',
    color: '#95A5A6',
    gradient: ['#667eea', '#764ba2']
  };
};

export default function AssetRequest() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // Redux state
  const {
    assetCategories,
    assetLoading,
    raisingTicket,
    myTickets
  } = useSelector((state: any) => state);

  useEffect(() => {
    console.log('📱 [AssetRequest] Component mounted');
    loadCategories();
  }, []);

  const loadCategories = async () => {
    if (assetCategories.length > 0) {
      console.log('📱 [AssetRequest] Using cached categories');
      return;
    }

    console.log('📱 [AssetRequest] Loading categories from API');
    dispatch({ type: 'SET_ASSET_LOADING', payload: true });
    
    try {
      const categoriesData = await getCategoriesByRole();
      dispatch({ type: 'SET_ASSET_CATEGORIES', payload: categoriesData });
      console.log('✅ [AssetRequest] Categories loaded:', categoriesData.length);
    } catch (error) {
      console.error('❌ [AssetRequest] Error loading categories:', error);
      showAlert("error", "Error", "Failed to load categories. Please try again.");
    } finally {
      dispatch({ type: 'SET_ASSET_LOADING', payload: false });
    }
  };

  const handleRaiseTicket = async (category: Category) => {
    showConfirmAlert(
      'Raise Asset Request',
      `Do you want to raise a request for ${category.category}?`,
      async () => {
        dispatch({ type: 'SET_RAISING_TICKET', payload: category.category });
        
        try {
          console.log('🎫 [AssetRequest] Raising ticket for:', category.category);
          await raiseTicket([category.category]);
          
          // Add optimistic update to Redux store
          const newTicket = {
            id: Date.now(), // Temporary ID
            category: category.category,
            status: 'Waiting for approval by manager',
            ticketRaisedOn: new Date().toISOString(),
            remark: null,
          };
          dispatch({ type: 'ADD_TICKET', payload: newTicket });
          
          // Update stats
          const updatedStats = calculateTicketStats([...myTickets, newTicket]);
          dispatch({ type: 'SET_TICKET_STATS', payload: updatedStats });
          
          showAlert("success", "Success", "Asset request raised successfully!");
          navigation.navigate('MyTickets');
          
        } catch (error: any) {
          console.error('❌ [AssetRequest] Error raising ticket:', error);
          if (error.message && error.message.includes('JSON Parse')) {
            // Handle JSON parse error as success
            const newTicket = {
              id: Date.now(),
              category: category.category,
              status: 'Waiting for approval by manager',
              ticketRaisedOn: new Date().toISOString(),
              remark: null,
            };
            dispatch({ type: 'ADD_TICKET', payload: newTicket });
            const updatedStats = calculateTicketStats([...myTickets, newTicket]);
            dispatch({ type: 'SET_TICKET_STATS', payload: updatedStats });
            
            showAlert("success", "Success", "Asset request raised successfully!");
            navigation.navigate('MyTickets');
          } else {
            showAlert("error", "Error", error.message || "Failed to raise request. Please try again.");
          }
        } finally {
          dispatch({ type: 'SET_RAISING_TICKET', payload: null });
        }
      }
    );
  };

  const refreshCategories = async () => {
    console.log('🔁 [AssetRequest] Refreshing categories');
    dispatch({ type: 'SET_ASSET_CATEGORIES', payload: [] });
    await loadCategories();
  };

  const showAlert = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    const icons = { success: '✅', error: '❌', warning: '⚠️' };
    Alert.alert(`${icons[type]} ${title}`, message, [{ text: "OK", style: "default" }]);
  };

  const showConfirmAlert = (title: string, message: string, onConfirm: () => void) => {
    Alert.alert(
      title,
      message,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes, Raise Request", style: "default", onPress: onConfirm }
      ]
    );
  };

  const renderCategoryItem = ({ item, index }: { item: Category; index: number }) => {
    const iconConfig = getCategoryIcon(item.category);
    const isRaising = raisingTicket === item.category;

    return (
      <TouchableOpacity
        style={[styles.categoryCard, { opacity: isRaising ? 0.7 : 1 }]}
        onPress={() => !isRaising && handleRaiseTicket(item)}
        disabled={isRaising}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={iconConfig.gradient}
          style={styles.categoryHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {isRaising ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.loadingText}>Raising Request...</Text>
            </View>
          ) : (
            <FontAwesome name={iconConfig.icon} size={40} color="white" style={styles.categoryIcon} />
          )}
        </LinearGradient>

        <View style={styles.categoryContent}>
          <Text style={styles.categoryTitle}>{item.category}</Text>
          <View style={[styles.actionBadge, { 
            backgroundColor: `${iconConfig.color}15`, 
            borderColor: `${iconConfig.color}30` 
          }]}>
            <FontAwesome name="hand-paper-o" size={12} color={iconConfig.color} />
            <Text style={[styles.actionText, { color: iconConfig.color }]}>
              {isRaising ? 'Processing...' : 'Tap to Request'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const LoadingOverlay = () => (
    <View style={styles.loadingOverlay}>
      <LinearGradient
        colors={['rgba(0,41,87,0.9)', 'rgba(0,41,87,0.7)']}
        style={styles.loadingGradient}
      >
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.overlayLoadingText}>Loading Asset Categories...</Text>
      </LinearGradient>
    </View>
  );

  if (assetLoading && assetCategories.length === 0) {
    return <LoadingOverlay />;
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="rgb(0, 41, 87)" barStyle="light-content" />
      
      {/* Enhanced Header */}
      <LinearGradient
        colors={['rgb(0, 41, 87)', 'rgba(0, 41, 87, 0.8)']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <FontAwesome name="cube" size={28} color="white" />
          <Text style={styles.headerTitle}>Asset Request</Text>
          <Text style={styles.headerSubtitle}>Select an asset category to raise a request</Text>
        </View>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={refreshCategories}
            disabled={assetLoading}
          >
            {assetLoading ? (
              <ActivityIndicator size={16} color="white" />
            ) : (
              <FontAwesome name="refresh" size={16} color="white" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.myTicketsButton}
            onPress={() => navigation.navigate('MyTickets')}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.myTicketsGradient}
            >
              <FontAwesome name="list" size={16} color="white" />
              <Text style={styles.myTicketsText}>My Requests</Text>
              {myTickets.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{myTickets.length}</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Categories Grid */}
      {assetCategories.length === 0 && !assetLoading ? (
        <View style={styles.emptyState}>
          <FontAwesome name="cube" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No Categories Available</Text>
          <Text style={styles.emptyStateText}>
            No asset categories are available for request at this time.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshCategories}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={assetCategories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item._id || item.id?.toString() || item.category}
          numColumns={2}
          contentContainerStyle={styles.categoriesContainer}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}
          onRefresh={refreshCategories}
          refreshing={assetLoading}
        />
      )}

      {/* Footer Info */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <FontAwesome name="info-circle" size={16} color="rgba(0,41,87,0.6)" />
          <Text style={styles.footerText}>
            Asset requests are subject to availability and approval
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 12,
  },
  myTicketsButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  myTicketsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  myTicketsText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  badge: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    padding: 20,
    paddingTop: 30,
  },
  row: {
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  categoryHeader: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  categoryIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryContent: {
    padding: 20,
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
    lineHeight: 22,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: 'rgb(0, 41, 87)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(0,41,87,0.6)',
    fontStyle: 'italic',
  },
  loadingOverlay: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  overlayLoadingText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
});


// // Screen/Ticket/CategorySelection.tsx
// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   FlatList,
//   Alert,
//   ActivityIndicator,
//   Dimensions,
//   StatusBar,
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { FontAwesome } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import { Category, getCategoriesByRole, raiseTicket } from '../../Services/AssetModule/ticketService';

// const { width } = Dimensions.get('window');

// // Category icon mapping based on web version
// const getCategoryIcon = (category: string) => {
//   const iconConfig: { [key: string]: { icon: string; color: string; gradient: string[] } } = {
//     'MOUSE': { icon: 'mouse-pointer', color: '#4A90E2', gradient: ['#667eea', '#764ba2'] },
//     'KEYBOARD': { icon: 'keyboard-o', color: '#50C878', gradient: ['#f093fb', '#f5576c'] },
//     'LAPTOP': { icon: 'laptop', color: '#FF6B35', gradient: ['#4facfe', '#00f2fe'] },
//     'MONITOR': { icon: 'desktop', color: '#9B59B6', gradient: ['#43e97b', '#38f9d7'] },
//     'STORAGE DEVICE': { icon: 'hdd-o', color: '#E67E22', gradient: ['#fa709a', '#fee140'] },
//     'HEADPHONE': { icon: 'headphones', color: '#E74C3C', gradient: ['#a8edea', '#fed6e3'] },
//     'BIOMETRIC': { icon: 'fingerprint', color: '#2ECC71', gradient: ['#ff9a9e', '#fecfef'] },
//     'PRINTER': { icon: 'print', color: '#34495E', gradient: ['#ffecd2', '#fcb69f'] },
//     'DOCKSTATION': { icon: 'plug', color: '#8E44AD', gradient: ['#a8caba', '#5d4e75'] },
//     'DOCK STATION': { icon: 'plug', color: '#8E44AD', gradient: ['#a8caba', '#5d4e75'] },
//     'LAPTOP CHARGER': { icon: 'battery-3', color: '#F39C12', gradient: ['#fdbb2d', '#22c1c3'] },
//     'PENDRIVE': { icon: 'usb', color: '#3498DB', gradient: ['#e3ffe7', '#d9e7ff'] },
//     'PEN DRIVE': { icon: 'usb', color: '#3498DB', gradient: ['#e3ffe7', '#d9e7ff'] },
//     'SERVER': { icon: 'server', color: '#1ABC9C', gradient: ['#667eea', '#764ba2'] },
//     'HARDDISK': { icon: 'hdd-o', color: '#7F8C8D', gradient: ['#4facfe', '#00f2fe'] },
//     'HARD DISK': { icon: 'hdd-o', color: '#7F8C8D', gradient: ['#4facfe', '#00f2fe'] },
//     'LAPTOP BAG': { icon: 'briefcase', color: '#D35400', gradient: ['#43e97b', '#38f9d7'] },
//   };

//   return iconConfig[category.toUpperCase()] || {
//     icon: 'desktop',
//     color: '#95A5A6',
//     gradient: ['#667eea', '#764ba2']
//   };
// };

// export default function AssetModule() {
// // export default function CategorySelection() {
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [raisingTicket, setRaisingTicket] = useState<string | null>(null);
//   const navigation = useNavigation();

//   useEffect(() => {
//     loadCategories();
//   }, []);

//   const loadCategories = async () => {
//     setLoading(true);
//     try {
//       const categoriesData = await getCategoriesByRole();
//       setCategories(categoriesData);
//     } catch (error) {
//       console.error('Error loading categories:', error);
//       Alert.alert('Error', 'Failed to load categories. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };


//   // Update the handleRaiseTicket function in CategorySelection.tsx
// const handleRaiseTicket = async (category: Category) => {
//   Alert.alert(
//     'Raise Ticket',
//     `Do you want to raise a ticket for ${category.category}?`,
//     [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Yes, Raise Ticket',
//         style: 'default',
//         onPress: async () => {
//           setRaisingTicket(category.category);
//           try {
//             const result = await raiseTicket([category.category]);
//             console.log('✅ [CategorySelection] Ticket raised result:', result);
            
//             Alert.alert(
//               'Success',
//               'Ticket raised successfully!',
//               [{ text: 'OK', onPress: () => navigation.navigate('MyTickets') }]
//             );
//           } catch (error: any) {
//             console.error('❌ [CategorySelection] Error raising ticket:', error);
            
//             // Check if it's just a JSON parsing error but operation succeeded
//             if (error.message && error.message.includes('JSON Parse')) {
//               Alert.alert(
//                 'Success',
//                 'Ticket raised successfully!',
//                 [{ text: 'OK', onPress: () => navigation.navigate('MyTickets') }]
//               );
//             } else {
//               Alert.alert('Error', error.message || 'Failed to raise ticket. Please try again.');
//             }
//           } finally {
//             setRaisingTicket(null);
//           }
//         }
//       }
//     ]
//   );
// };


//   const renderCategoryItem = ({ item, index }: { item: Category; index: number }) => {
//     const iconConfig = getCategoryIcon(item.category);
//     const isRaising = raisingTicket === item.category;

//     return (
//       <TouchableOpacity
//         style={[styles.categoryCard, { animationDelay: index * 100 }]}
//         onPress={() => !isRaising && handleRaiseTicket(item)}
//         disabled={isRaising}
//         activeOpacity={0.8}
//       >
//         <LinearGradient
//           colors={iconConfig.gradient}
//           style={styles.categoryHeader}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//         >
//           {isRaising ? (
//             <ActivityIndicator size="large" color="white" />
//           ) : (
//             <FontAwesome name={iconConfig.icon} size={45} color="white" />
//           )}
//         </LinearGradient>

//         <View style={styles.categoryContent}>
//           <Text style={styles.categoryTitle}>{item.category}</Text>
//           <View style={[styles.actionBadge, { backgroundColor: `${iconConfig.color}20` }]}>
//             <Text style={[styles.actionText, { color: iconConfig.color }]}>
//               {isRaising ? 'Raising Ticket...' : 'Click to Raise Ticket'}
//             </Text>
//           </View>
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="rgb(0, 41, 87)" />
//         <Text style={styles.loadingText}>Loading Categories...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar backgroundColor="rgb(0, 41, 87)" barStyle="light-content" />
      
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Raise Ticket</Text>
//         <Text style={styles.headerSubtitle}>Select a category to raise a support ticket</Text>
        
//         <TouchableOpacity
//           style={styles.myTicketsButton}
//           onPress={() => navigation.navigate('MyTickets')}
//         >
//           <FontAwesome name="ticket" size={16} color="white" />
//           <Text style={styles.myTicketsText}>My Tickets</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Categories Grid */}
//       <FlatList
//         data={categories}
//         renderItem={renderCategoryItem}
//         keyExtractor={(item) => item._id || item.id || item.category}
//         numColumns={2}
//         contentContainerStyle={styles.categoriesContainer}
//         showsVerticalScrollIndicator={false}
//         columnWrapperStyle={styles.row}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8fafc',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8fafc',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: 'rgb(0, 41, 87)',
//     fontWeight: '600',
//   },
//   header: {
//     backgroundColor: 'rgb(0, 41, 87)',
//     paddingHorizontal: 20,
//     paddingTop: 20,
//     paddingBottom: 30,
//     borderBottomLeftRadius: 25,
//     borderBottomRightRadius: 25,
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: 'white',
//     marginBottom: 8,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: 'rgba(255, 255, 255, 0.8)',
//     marginBottom: 20,
//   },
//   myTicketsButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     alignSelf: 'flex-end',
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 25,
//     gap: 8,
//   },
//   myTicketsText: {
//     color: 'white',
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   categoriesContainer: {
//     padding: 20,
//     paddingTop: 30,
//   },
//   row: {
//     justifyContent: 'space-between',
//   },
//   categoryCard: {
//     width: (width - 60) / 2,
//     backgroundColor: 'white',
//     borderRadius: 20,
//     marginBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.1,
//     shadowRadius: 20,
//     elevation: 8,
//     overflow: 'hidden',
//   },
//   categoryHeader: {
//     height: 120,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   categoryContent: {
//     padding: 20,
//     alignItems: 'center',
//   },
//   categoryTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#2c3e50',
//     textAlign: 'center',
//     marginBottom: 12,
//     letterSpacing: 0.5,
//   },
//   actionBadge: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 15,
//     borderWidth: 1,
//     borderColor: 'transparent',
//   },
//   actionText: {
//     fontSize: 12,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
// });

