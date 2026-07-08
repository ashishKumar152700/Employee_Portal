import React, {useEffect, useState, useRef, useCallback} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Animated,
  Easing,
  Modal,
  Dimensions,
} from "react-native";
import {Swipeable, GestureHandlerRootView} from "react-native-gesture-handler";
import {useSelector} from "react-redux";
import Icon from "react-native-vector-icons/MaterialIcons";
import {managerLeaveRequestClass} from "../../Services/LeaveRequest/LeaveRequest.service";
import {useFocusEffect} from "@react-navigation/native";

const {width} = Dimensions.get('window');

const LeaveRequest = () => {
  const userDetails = useSelector((state: any) => state.userDetails);
  const userID = userDetails?.user?.id;

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [confirmationModal, setConfirmationModal] = useState({visible: false, type: '', request: null});
  const [processingRequest, setProcessingRequest] = useState(null);
  const swipeableRefs = useRef(new Map());

  const fetchLeaveRequests = useCallback(async () => {
    try {
      setLoading(true);

      const data =
          await managerLeaveRequestClass.LeaveRequestGet(
              userID
          );

      setLeaveRequests(data.data);
    } catch (error) {
      console.error(
          "Failed to fetch leave requests:",
          error
      );
    } finally {
      setLoading(false);
    }
  }, [userID]);

  useFocusEffect(
      useCallback(() => {
        fetchLeaveRequests();
      }, [fetchLeaveRequests])
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const showConfirmation = (type, request) => {
    setConfirmationModal({visible: true, type, request});
  };

  const hideConfirmation = () => {
    setConfirmationModal({visible: false, type: '', request: null});
  };

  const updateLeaveStatus = async (
      request: any,
      status: "approved" | "declined"
  ) => {
    setProcessingRequest(request.id);
    hideConfirmation();

    try {
      await managerLeaveRequestClass.LeaveStatusUpdate(
          request.id,
          status
      );

      setLeaveRequests((prevRequests) =>
          prevRequests.filter(
              (req) => req.id !== request.id
          )
      );
    } catch (error) {
      console.error(
          `Error updating leave status (${status}):`,
          error
      );
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleApprove = async (request: any) => {
    await updateLeaveStatus(request, "approved");
  };

  const handleReject = async (request: any) => {
    await updateLeaveStatus(request, "declined");
  };

  // Close all other swipeables when one is opened
  const handleSwipeableOpen = (id) => {
    swipeableRefs.current.forEach((ref, key) => {
      if (key !== id && ref) {
        ref.close();
      }
    });
  };

  const renderRightActions = (request) => (
      <View style={styles.actions}>
        <TouchableOpacity
            style={styles.approve}
            onPress={() => showConfirmation('approve', request)}
        >
          <Icon name="check" size={24} color="white"/>
          <Text style={styles.actionText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={styles.reject}
            onPress={() => showConfirmation('reject', request)}
        >
          <Icon name="close" size={24} color="white"/>
          <Text style={styles.actionText}>Reject</Text>
        </TouchableOpacity>
      </View>
  );

  const formatDate = (dateString) => {
    if (!dateString) return "Invalid Date";

    try {
      // Parse ISO date string
      const date = new Date(dateString);

      if (isNaN(date.getTime())) return dateString;

      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];

      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();

      return `${day} ${month}, ${year}`;
    } catch (error) {
      console.error("Date formatting error:", error);
      return dateString;
    }
  };

  const renderItem = ({item, index}) => (
      <Swipeable
          ref={(ref) => {
            if (ref) {
              swipeableRefs.current.set(item.id, ref);
            } else {
              swipeableRefs.current.delete(item.id);
            }
          }}
          renderRightActions={() => renderRightActions(item)}
          overshootFriction={8}
          onSwipeableOpen={() => handleSwipeableOpen(item.id)}
          enabled={processingRequest !== item.id}
      >
        <View style={[styles.card, processingRequest === item.id && styles.processingCard]}>
          {index === 0 && (
              <View style={styles.instructionContainer}>
                <Icon name="swipe" size={20} color="#002957"/>
                <Text style={styles.instructionText}>Swipe left to approve or reject</Text>
              </View>
          )}

          {processingRequest === item.id ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#002957"/>
                <Text style={styles.processingText}>
                  {confirmationModal.type === 'approve' ? 'Approving...' : 'Rejecting...'}
                </Text>
              </View>
          ) : (
              <>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Icon name="person" size={24} color="#002957"/>
                  </View>
                  <View style={styles.headerContent}>
                    <Text style={styles.name}>{item.user?.name || "N/A"}</Text>
                    <View style={styles.dateContainer}>
                      <Icon name="event" size={16} color="#6c757d"/>
                      <Text style={styles.date}>
                        {formatDate(item.leavestart)} to {formatDate(item.leaveend)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.detailRow}>
                    <Icon name="work-outline" size={18} color="#6c757d"/>
                    <Text style={styles.detailText}>
                      {item.leavetype} • {item.leavepart}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Icon name="chat-bubble-outline" size={18} color="#6c757d"/>
                    <Text style={styles.detailText}>{item.reason}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={[styles.statusBadge,
                    item.leavestatus === "approved" ? styles.approvedBadge :
                        item.leavestatus === "declined" ? styles.rejectedBadge :
                            styles.pendingBadge
                  ]}>
                    <Text style={styles.statusText}>{item.leavestatus || "Pending"}</Text>
                  </View>
                  <Text style={styles.applyDate}>
                    Applied on {formatDate(item.applydate)}
                  </Text>
                </View>
              </>
          )}
        </View>
      </Swipeable>
  );

  if (loading) {
    return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#002957"/>
        </View>
    );
  }

  return (
      <GestureHandlerRootView style={styles.container}>
        <Animated.View style={[styles.animatedContainer, {opacity: fadeAnim}]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Leave Requests</Text>
            <Text style={styles.headerSubtitle}>
              {leaveRequests.length} pending request{leaveRequests.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {leaveRequests.length > 0 ? (
              <FlatList
                  data={leaveRequests}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={styles.listContainer}
                  showsVerticalScrollIndicator={false}
              />
          ) : (
              <View style={styles.emptyContainer}>
                <Icon name="inbox" size={64} color="#dee2e6"/>
                <Text style={styles.emptyText}>No leave requests available</Text>
                <Text style={styles.emptySubtext}>
                  All leave requests have been processed
                </Text>
              </View>
          )}

          {/* Custom Confirmation Modal */}
          <Modal
              visible={confirmationModal.visible}
              transparent={true}
              animationType="fade"
              onRequestClose={hideConfirmation}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {confirmationModal.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                  </Text>
                  <TouchableOpacity onPress={hideConfirmation} style={styles.closeButton}>
                    <Icon name="close" size={24} color="#002957"/>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <Text style={styles.modalMessage}>
                    Are you sure you want
                    to {confirmationModal.type} {confirmationModal.request?.user?.name || 'this employee'}'s
                    leave request?
                  </Text>

                  {confirmationModal.request && (
                      <View style={styles.requestDetails}>
                        <Text style={styles.detailLabel}>Leave Type:</Text>
                        <Text style={styles.detailValue}>{confirmationModal.request.leavetype}</Text>

                        <Text style={styles.detailLabel}>Duration:</Text>
                        <Text style={styles.detailValue}>
                          {formatDate(confirmationModal.request.leavestart)} to {formatDate(confirmationModal.request.leaveend)}
                        </Text>

                        <Text style={styles.detailLabel}>Reason:</Text>
                        <Text style={styles.detailValue}>{confirmationModal.request.reason}</Text>
                      </View>
                  )}
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                      onPress={hideConfirmation}
                      style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                      onPress={() => {
                        if (confirmationModal.type === 'approve') {
                          handleApprove(confirmationModal.request);
                        } else {
                          handleReject(confirmationModal.request);
                        }
                      }}
                      style={[
                        styles.confirmButton,
                        confirmationModal.type === 'approve' ? styles.approveButton : styles.rejectButton
                      ]}
                  >
                    <Text style={styles.confirmButtonText}>
                      {confirmationModal.type === 'approve' ? 'Approve' : 'Reject'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </Animated.View>
      </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  animatedContainer: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#002957",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6c757d",
  },
  listContainer: {
    padding: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  processingCard: {
    opacity: 0.8,
  },
  instructionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9f0f7",
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: "#002957",
    marginLeft: 8,
    fontWeight: "500",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e9f0f7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#002957",
    marginBottom: 4,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  date: {
    fontSize: 14,
    color: "#6c757d",
    marginLeft: 4,
  },
  cardBody: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#495057",
    marginLeft: 8,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pendingBadge: {
    backgroundColor: "#fff3cd",
  },
  approvedBadge: {
    backgroundColor: "#d4edda",
  },
  rejectedBadge: {
    backgroundColor: "#f8d7da",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#002957",
  },
  applyDate: {
    fontSize: 12,
    color: "#6c757d",
  },
  actions: {
    flexDirection: "column",
    alignItems: "center",
    height: "44%",
    gap: 8,
    paddingHorizontal: 10,
  },
  approve: {
    backgroundColor: "#002957",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  reject: {
    backgroundColor: "#1a4a7a",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6c757d",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#adb5bd",
    textAlign: "center",
  },
  processingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  processingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#002957",
    fontWeight: "500",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#002957",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: "#495057",
    marginBottom: 16,
  },
  requestDetails: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#002957",
    marginTop: 8,
  },
  detailValue: {
    fontSize: 14,
    color: "#495057",
    marginBottom: 4,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#f8f9fa",
  },
  cancelButtonText: {
    color: "#6c757d",
    fontWeight: "600",
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: "#002957",
  },
  rejectButton: {
    backgroundColor: "#dc3545",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "600",
  },
});

export default LeaveRequest;


// import React, { useEffect, useState, useRef } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ActivityIndicator,
//   FlatList,
//   Animated,
//   Easing,
//   Modal,
//   Dimensions,
// } from "react-native";
// import { Swipeable, GestureHandlerRootView } from "react-native-gesture-handler";
// import { useSelector } from "react-redux";
// import Icon from "react-native-vector-icons/MaterialIcons";
// import { managerLeaveRequestClass } from "../../Services/LeaveRequest/LeaveRequest.service";
//
// const { width } = Dimensions.get('window');
//
// const LeaveRequest = () => {
//   const userDetails = useSelector((state: any) => state.userDetails);
//   const userID = userDetails?.user?.id;
//
//   const [leaveRequests, setLeaveRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [fadeAnim] = useState(new Animated.Value(0));
//   const [confirmationModal, setConfirmationModal] = useState({ visible: false, type: '', request: null });
//   const [processingRequest, setProcessingRequest] = useState(null);
//   const swipeableRefs = useRef(new Map());
//
//   useEffect(() => {
//     const fetchLeaveRequests = async () => {
//       try {
//         const data = await managerLeaveRequestClass.LeaveRequestGet(userID);
//         setLeaveRequests(data.data);
//       } catch (error) {
//         console.error("Failed to fetch leave requests:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//
//     fetchLeaveRequests();
//   }, [userID]);
//
//   useEffect(() => {
//     Animated.timing(fadeAnim, {
//       toValue: 1,
//       duration: 600,
//       easing: Easing.out(Easing.ease),
//       useNativeDriver: true,
//     }).start();
//   }, []);
//
//   const showConfirmation = (type, request) => {
//     setConfirmationModal({ visible: true, type, request });
//   };
//
//   const hideConfirmation = () => {
//     setConfirmationModal({ visible: false, type: '', request: null });
//   };
//
//   const handleApprove = async (request) => {
//     setProcessingRequest(request.id);
//     hideConfirmation();
//
//     try {
//       await managerLeaveRequestClass.LeaveStatusUpdate(request.id, "Approve");
//
//       // Remove the request after a short delay
//       setTimeout(() => {
//         setLeaveRequests((prevRequests) =>
//           prevRequests.filter((req) => req.id !== request.id)
//         );
//         setProcessingRequest(null);
//       }, 500);
//     } catch (error) {
//       console.error("Error approving request:", error);
//       setProcessingRequest(null);
//     }
//   };
//
//   const handleReject = async (request) => {
//     setProcessingRequest(request.id);
//     hideConfirmation();
//
//     try {
//       await managerLeaveRequestClass.LeaveStatusUpdate(request.id, "Decline");
//
//       // Remove the request after a short delay
//       setTimeout(() => {
//         setLeaveRequests((prevRequests) =>
//           prevRequests.filter((req) => req.id !== request.id)
//         );
//         setProcessingRequest(null);
//       }, 500);
//     } catch (error) {
//       console.error("Error rejecting request:", error);
//       setProcessingRequest(null);
//     }
//   };
//
//   // Close all other swipeables when one is opened
//   const handleSwipeableOpen = (id) => {
//     swipeableRefs.current.forEach((ref, key) => {
//       if (key !== id && ref) {
//         ref.close();
//       }
//     });
//   };
//
//   const renderRightActions = (request) => (
//     <View style={styles.actions}>
//       <TouchableOpacity
//         style={styles.approve}
//         onPress={() => showConfirmation('approve', request)}
//       >
//         <Icon name="check" size={24} color="white" />
//         <Text style={styles.actionText}>Approve</Text>
//       </TouchableOpacity>
//       <TouchableOpacity
//         style={styles.reject}
//         onPress={() => showConfirmation('reject', request)}
//       >
//         <Icon name="close" size={24} color="white" />
//         <Text style={styles.actionText}>Reject</Text>
//       </TouchableOpacity>
//     </View>
//   );
//
//   const formatDate = (dateString) => {
//     if (!dateString) return "Invalid Date";
//
//     try {
//       // Parse ISO date string
//       const date = new Date(dateString);
//
//       if (isNaN(date.getTime())) return dateString;
//
//       const months = [
//         "Jan", "Feb", "Mar", "Apr", "May", "Jun",
//         "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
//       ];
//
//       const day = date.getDate();
//       const month = months[date.getMonth()];
//       const year = date.getFullYear();
//
//       return `${day} ${month}, ${year}`;
//     } catch (error) {
//       console.error("Date formatting error:", error);
//       return dateString;
//     }
//   };
//
//   const renderItem = ({ item, index }) => (
//     <Swipeable
//       ref={(ref) => {
//         if (ref) {
//           swipeableRefs.current.set(item.id, ref);
//         } else {
//           swipeableRefs.current.delete(item.id);
//         }
//       }}
//       renderRightActions={() => renderRightActions(item)}
//       overshootFriction={8}
//       onSwipeableOpen={() => handleSwipeableOpen(item.id)}
//       enabled={processingRequest !== item.id}
//     >
//       <View style={[styles.card, processingRequest === item.id && styles.processingCard]}>
//         {index === 0 && (
//           <View style={styles.instructionContainer}>
//             <Icon name="swipe" size={20} color="#002957" />
//             <Text style={styles.instructionText}>Swipe left to approve or reject</Text>
//           </View>
//         )}
//
//         {processingRequest === item.id ? (
//           <View style={styles.processingContainer}>
//             <ActivityIndicator size="large" color="#002957" />
//             <Text style={styles.processingText}>
//               {confirmationModal.type === 'approve' ? 'Approving...' : 'Rejecting...'}
//             </Text>
//           </View>
//         ) : (
//           <>
//             <View style={styles.cardHeader}>
//               <View style={styles.avatar}>
//                 <Icon name="person" size={24} color="#002957" />
//               </View>
//               <View style={styles.headerContent}>
//                 <Text style={styles.name}>{item.user?.name || "N/A"}</Text>
//                 <View style={styles.dateContainer}>
//                   <Icon name="event" size={16} color="#6c757d" />
//                   <Text style={styles.date}>
//                     {formatDate(item.leavestart)} to {formatDate(item.leaveend)}
//                   </Text>
//                 </View>
//               </View>
//             </View>
//
//             <View style={styles.cardBody}>
//               <View style={styles.detailRow}>
//                 <Icon name="work-outline" size={18} color="#6c757d" />
//                 <Text style={styles.detailText}>
//                   {item.leavetype} • {item.leavepart}
//                 </Text>
//               </View>
//
//               <View style={styles.detailRow}>
//                 <Icon name="chat-bubble-outline" size={18} color="#6c757d" />
//                 <Text style={styles.detailText}>{item.reason}</Text>
//               </View>
//             </View>
//
//             <View style={styles.cardFooter}>
//               <View style={[styles.statusBadge,
//                 item.leavestatus === "Approve" ? styles.approvedBadge :
//                 item.leavestatus === "Decline" ? styles.rejectedBadge :
//                 styles.pendingBadge
//               ]}>
//                 <Text style={styles.statusText}>{item.leavestatus || "Pending"}</Text>
//               </View>
//               <Text style={styles.applyDate}>
//                 Applied on {formatDate(item.applydate)}
//               </Text>
//             </View>
//           </>
//         )}
//       </View>
//     </Swipeable>
//   );
//
//   if (loading) {
//     return (
//       <View style={styles.loaderContainer}>
//         <ActivityIndicator size="large" color="#002957" />
//       </View>
//     );
//   }
//
//   return (
//     <GestureHandlerRootView style={styles.container}>
//       <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
//         <View style={styles.header}>
//           <Text style={styles.headerTitle}>Leave Requests</Text>
//           <Text style={styles.headerSubtitle}>
//             {leaveRequests.length} pending request{leaveRequests.length !== 1 ? 's' : ''}
//           </Text>
//         </View>
//
//         {leaveRequests.length > 0 ? (
//           <FlatList
//             data={leaveRequests}
//             renderItem={renderItem}
//             keyExtractor={(item) => item.id.toString()}
//             contentContainerStyle={styles.listContainer}
//             showsVerticalScrollIndicator={false}
//           />
//         ) : (
//           <View style={styles.emptyContainer}>
//             <Icon name="inbox" size={64} color="#dee2e6" />
//             <Text style={styles.emptyText}>No leave requests available</Text>
//             <Text style={styles.emptySubtext}>
//               All leave requests have been processed
//             </Text>
//           </View>
//         )}
//
//         {/* Custom Confirmation Modal */}
//         <Modal
//           visible={confirmationModal.visible}
//           transparent={true}
//           animationType="fade"
//           onRequestClose={hideConfirmation}
//         >
//           <View style={styles.modalOverlay}>
//             <View style={styles.modalContainer}>
//               <View style={styles.modalHeader}>
//                 <Text style={styles.modalTitle}>
//                   {confirmationModal.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
//                 </Text>
//                 <TouchableOpacity onPress={hideConfirmation} style={styles.closeButton}>
//                   <Icon name="close" size={24} color="#002957" />
//                 </TouchableOpacity>
//               </View>
//
//               <View style={styles.modalBody}>
//                 <Text style={styles.modalMessage}>
//                   Are you sure you want to {confirmationModal.type} {confirmationModal.request?.user?.name || 'this employee'}'s leave request?
//                 </Text>
//
//                 {confirmationModal.request && (
//                   <View style={styles.requestDetails}>
//                     <Text style={styles.detailLabel}>Leave Type:</Text>
//                     <Text style={styles.detailValue}>{confirmationModal.request.leavetype}</Text>
//
//                     <Text style={styles.detailLabel}>Duration:</Text>
//                     <Text style={styles.detailValue}>
//                       {formatDate(confirmationModal.request.leavestart)} to {formatDate(confirmationModal.request.leaveend)}
//                     </Text>
//
//                     <Text style={styles.detailLabel}>Reason:</Text>
//                     <Text style={styles.detailValue}>{confirmationModal.request.reason}</Text>
//                   </View>
//                 )}
//               </View>
//
//               <View style={styles.modalFooter}>
//                 <TouchableOpacity
//                   onPress={hideConfirmation}
//                   style={styles.cancelButton}
//                 >
//                   <Text style={styles.cancelButtonText}>Cancel</Text>
//                 </TouchableOpacity>
//
//                 <TouchableOpacity
//                   onPress={() => {
//                     if (confirmationModal.type === 'approve') {
//                       handleApprove(confirmationModal.request);
//                     } else {
//                       handleReject(confirmationModal.request);
//                     }
//                   }}
//                   style={[
//                     styles.confirmButton,
//                     confirmationModal.type === 'approve' ? styles.approveButton : styles.rejectButton
//                   ]}
//                 >
//                   <Text style={styles.confirmButtonText}>
//                     {confirmationModal.type === 'approve' ? 'Approve' : 'Reject'}
//                   </Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>
//         </Modal>
//       </Animated.View>
//     </GestureHandlerRootView>
//   );
// };
//
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f8f9fa",
//   },
//   animatedContainer: {
//     flex: 1,
//   },
//   header: {
//     padding: 16,
//     backgroundColor: "white",
//     borderBottomWidth: 1,
//     borderBottomColor: "#e9ecef",
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#002957",
//     marginBottom: 4,
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     color: "#6c757d",
//   },
//   listContainer: {
//     padding: 16,
//   },
//   loaderContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   card: {
//     backgroundColor: "#ffffff",
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 16,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   processingCard: {
//     opacity: 0.8,
//   },
//   instructionContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#e9f0f7",
//     padding: 8,
//     borderRadius: 8,
//     marginBottom: 12,
//   },
//   instructionText: {
//     fontSize: 14,
//     color: "#002957",
//     marginLeft: 8,
//     fontWeight: "500",
//   },
//   cardHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   avatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "#e9f0f7",
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 12,
//   },
//   headerContent: {
//     flex: 1,
//   },
//   name: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#002957",
//     marginBottom: 4,
//   },
//   dateContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   date: {
//     fontSize: 14,
//     color: "#6c757d",
//     marginLeft: 4,
//   },
//   cardBody: {
//     marginBottom: 12,
//   },
//   detailRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   detailText: {
//     fontSize: 14,
//     color: "#495057",
//     marginLeft: 8,
//     flex: 1,
//   },
//   cardFooter: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   statusBadge: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//   },
//   pendingBadge: {
//     backgroundColor: "#fff3cd",
//   },
//   approvedBadge: {
//     backgroundColor: "#d4edda",
//   },
//   rejectedBadge: {
//     backgroundColor: "#f8d7da",
//   },
//   statusText: {
//     fontSize: 12,
//     fontWeight: "600",
//     color: "#002957",
//   },
//   applyDate: {
//     fontSize: 12,
//     color: "#6c757d",
//   },
//   actions: {
//     flexDirection: "column",
//     alignItems: "center",
//     height: "44%",
//     gap: 8,
//     paddingHorizontal: 10,
//   },
//   approve: {
//     backgroundColor: "#002957",
//     justifyContent: "center",
//     alignItems: "center",
//     width: 80,
//     height: "100%",
//     borderTopLeftRadius: 16,
//     borderBottomLeftRadius: 16,
//   },
//   reject: {
//     backgroundColor: "#1a4a7a",
//     justifyContent: "center",
//     alignItems: "center",
//     width: 80,
//     height: "100%",
//     borderTopRightRadius: 16,
//     borderBottomRightRadius: 16,
//   },
//   actionText: {
//     color: "#fff",
//     fontSize: 12,
//     fontWeight: "600",
//     marginTop: 4,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 40,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#6c757d",
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: "#adb5bd",
//     textAlign: "center",
//   },
//   processingContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 20,
//   },
//   processingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: "#002957",
//     fontWeight: "500",
//   },
//   // Modal styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//   },
//   modalContainer: {
//     backgroundColor: "white",
//     borderRadius: 16,
//     width: "100%",
//     maxWidth: 400,
//     overflow: "hidden",
//   },
//   modalHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#e9ecef",
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#002957",
//   },
//   closeButton: {
//     padding: 4,
//   },
//   modalBody: {
//     padding: 16,
//   },
//   modalMessage: {
//     fontSize: 16,
//     color: "#495057",
//     marginBottom: 16,
//   },
//   requestDetails: {
//     backgroundColor: "#f8f9fa",
//     borderRadius: 8,
//     padding: 12,
//   },
//   detailLabel: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#002957",
//     marginTop: 8,
//   },
//   detailValue: {
//     fontSize: 14,
//     color: "#495057",
//     marginBottom: 4,
//   },
//   modalFooter: {
//     flexDirection: "row",
//     justifyContent: "flex-end",
//     padding: 16,
//     borderTopWidth: 1,
//     borderTopColor: "#e9ecef",
//   },
//   cancelButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 8,
//     marginRight: 12,
//     backgroundColor: "#f8f9fa",
//   },
//   cancelButtonText: {
//     color: "#6c757d",
//     fontWeight: "600",
//   },
//   confirmButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 8,
//   },
//   approveButton: {
//     backgroundColor: "#002957",
//   },
//   rejectButton: {
//     backgroundColor: "#dc3545",
//   },
//   confirmButtonText: {
//     color: "white",
//     fontWeight: "600",
//   },
// });
//
// export default LeaveRequest;
