// Screen/Asset/MyTickets.tsx
import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  StatusBar,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Ticket, 
  TicketStats,
  getMyTickets, 
  cancelTicket, 
  calculateTicketStats 
} from '../../Services/AssetModule/ticketService';

// Status color configuration
const getStatusConfig = (status: string) => {
  const configs: { [key: string]: { bg: string; color: string; border: string; icon: string } } = {
    'pending for allocation': { 
      bg: '#fef3c7', color: '#92400e', border: '#f59e0b', icon: 'clock-o' 
    },
    'waiting for approval by manager': { 
      bg: '#e0e7ff', color: '#3730a3', border: '#4f46e5', icon: 'user' 
    },
    'allocated': { 
      bg: '#dcfce7', color: '#166534', border: '#16a34a', icon: 'check-circle' 
    },
    'approved': { 
      bg: '#dcfce7', color: '#166534', border: '#16a34a', icon: 'check-circle' 
    },
    'manager': { 
      bg: '#dcfce7', color: '#166534', border: '#16a34a', icon: 'check' 
    },
    'rejected': { 
      bg: '#fee2e2', color: '#991b1b', border: '#dc2626', icon: 'times-circle' 
    },
    'cancelled': { 
      bg: '#f3f4f6', color: '#374151', border: '#6b7280', icon: 'ban' 
    },
  };

  return configs[status.toLowerCase()] || {
    bg: '#f3f4f6', color: '#374151', border: '#6b7280', icon: 'question-circle'
  };
};

export default function MyTickets() {
  const dispatch = useDispatch();
  
  // Redux state
  const {
    myTickets,
    ticketStats,
    ticketLoading,
    cancellingTicket
  } = useSelector((state: any) => state);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredTickets, setFilteredTickets] = React.useState<Ticket[]>([]);

  useFocusEffect(
    useCallback(() => {
      console.log('🎫 [MyTickets] Component focused');
      loadTickets();
    }, [])
  );

  useEffect(() => {
    filterTickets();
  }, [myTickets, searchQuery]);

  const loadTickets = async () => {
    if (ticketLoading) return;

    console.log('🎫 [MyTickets] Loading tickets from API');
    dispatch({ type: 'SET_TICKET_LOADING', payload: true });
    
    try {
      const ticketData = await getMyTickets();
      dispatch({ type: 'SET_MY_TICKETS', payload: ticketData });
      
      // Calculate and update stats
      const stats = calculateTicketStats(ticketData);
      dispatch({ type: 'SET_TICKET_STATS', payload: stats });
      
      console.log('✅ [MyTickets] Tickets loaded:', ticketData.length);
    } catch (error) {
      console.error('❌ [MyTickets] Error loading tickets:', error);
      showAlert('error', 'Error', 'Failed to load tickets. Please try again.');
    } finally {
      dispatch({ type: 'SET_TICKET_LOADING', payload: false });
    }
  };

  const filterTickets = () => {
    const filtered = myTickets.filter((ticket: Ticket) =>
      ticket.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTickets(filtered);
  };

  const handleCancelTicket = (ticket: Ticket) => {
    const ticketId = (ticket.id || ticket._id || '').toString();
    
    showConfirmAlert(
      'Cancel Request',
      `Are you sure you want to cancel the ${ticket.category} request?`,
      async () => {
        dispatch({ type: 'SET_CANCELLING_TICKET', payload: ticketId });
        
        try {
          await cancelTicket(ticketId);
          
          // Remove ticket from Redux store
          dispatch({ type: 'DELETE_TICKET', payload: ticketId });
          
          // Update stats
          const updatedTickets = myTickets.filter((t: Ticket) => 
            (t.id || t._id || '').toString() !== ticketId
          );
          const updatedStats = calculateTicketStats(updatedTickets);
          dispatch({ type: 'SET_TICKET_STATS', payload: updatedStats });
          
          showAlert('success', 'Success', 'Request cancelled successfully!');
        } catch (error: any) {
          console.error('❌ [MyTickets] Error cancelling ticket:', error);
          
          if (error.message && error.message.includes('JSON Parse')) {
            // Handle JSON parse error as success
            dispatch({ type: 'DELETE_TICKET', payload: ticketId });
            const updatedTickets = myTickets.filter((t: Ticket) => 
              (t.id || t._id || '').toString() !== ticketId
            );
            const updatedStats = calculateTicketStats(updatedTickets);
            dispatch({ type: 'SET_TICKET_STATS', payload: updatedStats });
            showAlert('success', 'Success', 'Request cancelled successfully!');
          } else {
            showAlert('error', 'Error', error.message || 'Failed to cancel request.');
          }
        } finally {
          dispatch({ type: 'SET_CANCELLING_TICKET', payload: null });
        }
      }
    );
  };

  const canCancelTicket = (status: string): boolean => {
    const cancelableStatuses = [
      'pending for allocation',
      'waiting for approval by manager'
    ];
    return cancelableStatuses.includes(status.toLowerCase());
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
        { text: "Yes, Cancel Request", style: "destructive", onPress: onConfirm }
      ]
    );
  };

  const renderStatCard = ({ label, value, color, icon }: { 
    label: string; 
    value: number; 
    color: string; 
    icon: string; 
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <FontAwesome name={icon} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderTicketItem = ({ item }: { item: Ticket }) => {
    const statusConfig = getStatusConfig(item.status);
    const ticketId = (item.id || item._id || '').toString();
    const displayId = ticketId.length >= 6 ? ticketId.slice(-6) : ticketId.padStart(6, '0');
    const isCancelling = cancellingTicket === ticketId;
    const canCancel = canCancelTicket(item.status) && !isCancelling;

    return (
      <View style={styles.ticketCard}>
        <LinearGradient
          colors={['rgba(0, 41, 87, 0.02)', 'rgba(0, 41, 87, 0.01)']}
          style={styles.ticketCardGradient}
        >
          <View style={styles.ticketHeader}>
            <View style={styles.ticketInfo}>
              <Text style={styles.ticketId}>#{displayId.toUpperCase()}</Text>
              <Text style={styles.ticketCategory}>{item.category}</Text>
              {item.remark && (
                <Text style={styles.ticketRemark} numberOfLines={2}>
                  {item.remark}
                </Text>
              )}
            </View>
            
            <View style={[styles.statusBadge, { 
              backgroundColor: statusConfig.bg, 
              borderColor: statusConfig.border 
            }]}>
              <FontAwesome 
                name={statusConfig.icon} 
                size={12} 
                color={statusConfig.color} 
              />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {item.status}
              </Text>
            </View>
          </View>

          <View style={styles.ticketFooter}>
            <View style={styles.ticketDateContainer}>
              <FontAwesome name="calendar" size={12} color="#6B7280" />
              <Text style={styles.ticketDate}>
                {new Date(item.ticketRaisedOn).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </Text>
            </View>

            {canCancel && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelTicket(item)}
                disabled={isCancelling}
              >
                <LinearGradient
                  colors={['#dc2626', '#b91c1c']}
                  style={styles.cancelButtonGradient}
                >
                  {isCancelling ? (
                    <ActivityIndicator size={16} color="white" />
                  ) : (
                    <>
                      <FontAwesome name="times" size={14} color="white" />
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  const LoadingOverlay = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="rgb(0, 41, 87)" />
      <Text style={styles.loadingText}>Loading your requests...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="rgb(0, 41, 87)" barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['rgb(0, 41, 87)', 'rgba(0, 41, 87, 0.8)']}
        style={styles.header}
      >
        <FontAwesome name="list" size={24} color="white" />
        <Text style={styles.headerTitle}>My Requests</Text>
        <Text style={styles.headerSubtitle}>Track your asset requests</Text>
      </LinearGradient>

      {/* Enhanced Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          {renderStatCard({ 
            label: 'Total', 
            value: ticketStats.total, 
            color: '#6366f1', 
            icon: 'list' 
          })}
          {renderStatCard({ 
            label: 'Pending', 
            value: ticketStats.pending, 
            color: '#f59e0b', 
            icon: 'clock-o' 
          })}
        </View>
        <View style={styles.statsRow}>
          {renderStatCard({ 
            label: 'Approved', 
            value: ticketStats.approved + ticketStats.allocated, 
            color: '#10b981', 
            icon: 'check-circle' 
          })}
          {renderStatCard({ 
            label: 'Others', 
            value: ticketStats.rejected + ticketStats.cancelled, 
            color: '#ef4444', 
            icon: 'times-circle' 
          })}
        </View>
      </View>

      {/* Enhanced Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <FontAwesome name="search" size={16} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by category or status..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <FontAwesome name="times" size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tickets List */}
      {ticketLoading && myTickets.length === 0 ? (
        <LoadingOverlay />
      ) : filteredTickets.length === 0 ? (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={['rgba(0, 41, 87, 0.1)', 'rgba(0, 41, 87, 0.05)']}
            style={styles.emptyStateCard}
          >
            <FontAwesome name="ticket" size={64} color="rgba(0, 41, 87, 0.3)" />
            <Text style={styles.emptyStateTitle}>
              {myTickets.length === 0 ? 'No Requests Yet' : 'No Results Found'}
            </Text>
            <Text style={styles.emptyStateText}>
              {myTickets.length === 0 
                ? 'Raise your first asset request to get started'
                : 'Try adjusting your search criteria'
              }
            </Text>
          </LinearGradient>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          renderItem={renderTicketItem}
          keyExtractor={(item) => (item.id || item._id || Math.random()).toString()}
          contentContainerStyle={styles.ticketsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={ticketLoading}
              onRefresh={loadTickets}
              colors={['rgb(0, 41, 87)']}
              tintColor="rgb(0, 41, 87)"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
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
  },
  statsContainer: {
    padding: 20,
    paddingBottom: 10,
    marginTop: -10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateCard: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 30,
    borderRadius: 20,
    width: '100%',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(0, 41, 87, 0.8)',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: 'rgba(0, 41, 87, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
  },
  ticketsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  ticketCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  ticketCardGradient: {
    padding: 16,
    backgroundColor: 'white',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ticketInfo: {
    flex: 1,
    paddingRight: 12,
  },
  ticketId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  ticketCategory: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  ticketRemark: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketDate: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  cancelButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  cancelButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgb(0, 41, 87)',
    fontWeight: '600',
  },
});


// // Screen/Ticket/MyTickets.tsx
// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   TouchableOpacity,
//   ActivityIndicator,
//   Alert,
//   RefreshControl,
//   TextInput,
//   StatusBar,
// } from 'react-native';
// import { FontAwesome } from '@expo/vector-icons';
// import { useFocusEffect } from '@react-navigation/native';
// import { 
//   Ticket, 
//   TicketStats,
//   getMyTickets, 
//   cancelTicket, 
//   calculateTicketStats 
// } from '../../Services/AssetModule/ticketService';

// // Status color configuration - updated to match actual API response
// const getStatusConfig = (status: string) => {
//   const configs: { [key: string]: { bg: string; color: string; border: string; icon: string } } = {
//     'pending for allocation': { 
//       bg: '#fef3c7', color: '#92400e', border: '#f59e0b', icon: 'clock-o' 
//     },
//     'waiting for approval by manager': { 
//       bg: '#e0e7ff', color: '#3730a3', border: '#4f46e5', icon: 'user' 
//     },
//     'allocated': { 
//       bg: '#dcfce7', color: '#166534', border: '#16a34a', icon: 'check-circle' 
//     },
//     'approved': { 
//       bg: '#dcfce7', color: '#166534', border: '#16a34a', icon: 'check-circle' 
//     },
//     'manager': { 
//       bg: '#dcfce7', color: '#166534', border: '#16a34a', icon: 'check' 
//     },
//     'rejected': { 
//       bg: '#fee2e2', color: '#991b1b', border: '#dc2626', icon: 'times-circle' 
//     },
//     'cancelled': { 
//       bg: '#f3f4f6', color: '#374151', border: '#6b7280', icon: 'ban' 
//     },
//   };

//   return configs[status.toLowerCase()] || {
//     bg: '#f3f4f6', color: '#374151', border: '#6b7280', icon: 'question-circle'
//   };
// };

// export default function MyTickets() {
//   const [tickets, setTickets] = useState<Ticket[]>([]);
//   const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [cancellingTickets, setCancellingTickets] = useState<Set<string>>(new Set());
//   const [stats, setStats] = useState<TicketStats>({
//     total: 0, pending: 0, approved: 0, allocated: 0, rejected: 0, cancelled: 0
//   });

//   useFocusEffect(
//     useCallback(() => {
//       loadTickets();
//     }, [])
//   );

//   useEffect(() => {
//     filterTickets();
//   }, [tickets, searchQuery]);

//   const loadTickets = async () => {
//     try {
//       console.log('📋 [MyTickets] Loading tickets...');
//       const ticketData = await getMyTickets();
//       console.log('📋 [MyTickets] Raw ticket data:', JSON.stringify(ticketData, null, 2));
      
//       setTickets(ticketData);
//       setStats(calculateTicketStats(ticketData));
//     } catch (error) {
//       console.error('❌ [MyTickets] Error loading tickets:', error);
//       Alert.alert('Error', 'Failed to load tickets. Please try again.');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const filterTickets = () => {
//     const filtered = tickets.filter(ticket =>
//       ticket.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       ticket.status.toLowerCase().includes(searchQuery.toLowerCase())
//     );
//     setFilteredTickets(filtered);
//   };

//   const onRefresh = () => {
//     setRefreshing(true);
//     loadTickets();
//   };


//   // Update the handleCancelTicket function in MyTickets.tsx
// const handleCancelTicket = (ticket: Ticket) => {
//   // Handle both string and number IDs properly
//   const ticketId = (ticket.id || ticket._id || '').toString();
  
//   Alert.alert(
//     'Cancel Ticket',
//     `Are you sure you want to cancel the ${ticket.category} ticket?`,
//     [
//       { text: 'No', style: 'cancel' },
//       {
//         text: 'Yes, Cancel',
//         style: 'destructive',
//         onPress: async () => {
//           setCancellingTickets(prev => new Set([...prev, ticketId]));
//           try {
//             const result = await cancelTicket(ticketId);
//             console.log('✅ [MyTickets] Cancel ticket result:', result);
            
//             Alert.alert('Success', 'Ticket cancelled successfully!');
//             await loadTickets(); // Refresh the list
//           } catch (error: any) {
//             console.error('❌ [MyTickets] Error cancelling ticket:', error);
            
//             // Check if it's just a JSON parsing error but operation succeeded
//             if (error.message && error.message.includes('JSON Parse')) {
//               Alert.alert('Success', 'Ticket cancelled successfully!');
//               await loadTickets(); // Refresh the list anyway
//             } else {
//               Alert.alert('Error', error.message || 'Failed to cancel ticket.');
//             }
//           } finally {
//             setCancellingTickets(prev => {
//               const newSet = new Set(prev);
//               newSet.delete(ticketId);
//               return newSet;
//             });
//           }
//         }
//       }
//     ]
//   );
// };


//   const canCancelTicket = (status: string): boolean => {
//     const cancelableStatuses = [
//       'pending for allocation',
//       'waiting for approval by manager'
//     ];
//     return cancelableStatuses.includes(status.toLowerCase());
//   };

//   const renderStatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
//     <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
//       <Text style={[styles.statValue, { color }]}>{value}</Text>
//       <Text style={styles.statLabel}>{label}</Text>
//     </View>
//   );

//   const renderTicketItem = ({ item }: { item: Ticket }) => {
//     const statusConfig = getStatusConfig(item.status);
    
//     // Handle both string and number IDs properly with safe conversion
//     const ticketId = (item.id || item._id || '').toString();
//     const displayId = ticketId.length >= 6 ? ticketId.slice(-6) : ticketId.padStart(6, '0');
    
//     const isCancelling = cancellingTickets.has(ticketId);
//     const canCancel = canCancelTicket(item.status) && !isCancelling;

//     console.log('📋 [MyTickets] Rendering ticket:', {
//       originalId: item.id,
//       ticketId,
//       displayId,
//       category: item.category,
//       status: item.status
//     });

//     return (
//       <View style={styles.ticketCard}>
//         <View style={styles.ticketHeader}>
//           <View style={styles.ticketInfo}>
//             <Text style={styles.ticketId}>
//               #{displayId.toUpperCase()}
//             </Text>
//             <Text style={styles.ticketCategory}>{item.category}</Text>
//             {item.remark && (
//               <Text style={styles.ticketRemark} numberOfLines={2}>
//                 {item.remark}
//               </Text>
//             )}
//           </View>
          
//           <View style={[styles.statusBadge, { 
//             backgroundColor: statusConfig.bg, 
//             borderColor: statusConfig.border 
//           }]}>
//             <FontAwesome 
//               name={statusConfig.icon} 
//               size={12} 
//               color={statusConfig.color} 
//             />
//             <Text style={[styles.statusText, { color: statusConfig.color }]}>
//               {item.status}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.ticketFooter}>
//           <Text style={styles.ticketDate}>
//             Raised on {new Date(item.ticketRaisedOn).toLocaleDateString('en-IN', {
//               day: '2-digit',
//               month: 'short',
//               year: 'numeric'
//             })}
//           </Text>

//           {canCancel && (
//             <TouchableOpacity
//               style={styles.cancelButton}
//               onPress={() => handleCancelTicket(item)}
//               disabled={isCancelling}
//             >
//               {isCancelling ? (
//                 <ActivityIndicator size={16} color="#dc2626" />
//               ) : (
//                 <>
//                   <FontAwesome name="times" size={14} color="#dc2626" />
//                   <Text style={styles.cancelButtonText}>Cancel</Text>
//                 </>
//               )}
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>
//     );
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="rgb(0, 41, 87)" />
//         <Text style={styles.loadingText}>Loading your tickets...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar backgroundColor="rgb(0, 41, 87)" barStyle="light-content" />
      
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>My Tickets</Text>
//         <Text style={styles.headerSubtitle}>Track your support requests</Text>
//       </View>

//       {/* Stats Cards */}
//       <View style={styles.statsContainer}>
//         <View style={styles.statsRow}>
//           {renderStatCard({ label: 'Total', value: stats.total, color: '#6366f1' })}
//           {renderStatCard({ label: 'Pending', value: stats.pending, color: '#f59e0b' })}
//         </View>
//         <View style={styles.statsRow}>
//           {renderStatCard({ label: 'Approved', value: stats.approved + stats.allocated, color: '#10b981' })}
//           {renderStatCard({ label: 'Others', value: stats.rejected + stats.cancelled, color: '#ef4444' })}
//         </View>
//       </View>

//       {/* Search */}
//       <View style={styles.searchContainer}>
//         <View style={styles.searchInputContainer}>
//           <FontAwesome name="search" size={16} color="#6B7280" />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search by category or status..."
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//             placeholderTextColor="#9CA3AF"
//           />
//           {searchQuery.length > 0 && (
//             <TouchableOpacity onPress={() => setSearchQuery('')}>
//               <FontAwesome name="times" size={16} color="#6B7280" />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* Tickets List */}
//       {filteredTickets.length === 0 ? (
//         <View style={styles.emptyState}>
//           <FontAwesome name="ticket" size={64} color="#D1D5DB" />
//           <Text style={styles.emptyStateTitle}>
//             {tickets.length === 0 ? 'No Tickets Yet' : 'No Results Found'}
//           </Text>
//           <Text style={styles.emptyStateText}>
//             {tickets.length === 0 
//               ? 'Raise your first support ticket to get started'
//               : 'Try adjusting your search criteria'
//             }
//           </Text>
//         </View>
//       ) : (
//         <FlatList
//           data={filteredTickets}
//           renderItem={renderTicketItem}
//           keyExtractor={(item, index) => (item.id || item._id || index).toString()}
//           contentContainerStyle={styles.ticketsList}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               colors={['rgb(0, 41, 87)']}
//               tintColor="rgb(0, 41, 87)"
//             />
//           }
//         />
//       )}
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
//   },
//   statsContainer: {
//     padding: 20,
//     paddingBottom: 10,
//     marginTop: -10,
//   },
//   statsRow: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 12,
//   },
//   statCard: {
//     flex: 1,
//     backgroundColor: 'white',
//     padding: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   statValue: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#6B7280',
//     fontWeight: '500',
//   },
//   searchContainer: {
//     paddingHorizontal: 20,
//     paddingBottom: 20,
//   },
//   searchInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'white',
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     gap: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: '#374151',
//   },
//   emptyState: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//   },
//   emptyStateTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#374151',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptyStateText: {
//     fontSize: 16,
//     color: '#6B7280',
//     textAlign: 'center',
//     lineHeight: 24,
//   },
//   ticketsList: {
//     paddingHorizontal: 20,
//     paddingBottom: 20,
//   },
//   ticketCard: {
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   ticketHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 12,
//   },
//   ticketInfo: {
//     flex: 1,
//     paddingRight: 12,
//   },
//   ticketId: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#6B7280',
//     marginBottom: 4,
//   },
//   ticketCategory: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#111827',
//     marginBottom: 4,
//   },
//   ticketRemark: {
//     fontSize: 14,
//     color: '#6B7280',
//     lineHeight: 20,
//     fontStyle: 'italic',
//   },
//   statusBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 20,
//     borderWidth: 1,
//     gap: 6,
//     minWidth: 80,
//     justifyContent: 'center',
//   },
//   statusText: {
//     fontSize: 11,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   ticketFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   ticketDate: {
//     fontSize: 14,
//     color: '#6B7280',
//     flex: 1,
//   },
//   cancelButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 6,
//     backgroundColor: '#fef2f2',
//     gap: 6,
//   },
//   cancelButtonText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#dc2626',
//   },
// });

