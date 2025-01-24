import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Swipeable, GestureHandlerRootView } from "react-native-gesture-handler";
import { useSelector } from "react-redux";
import Icon from "react-native-vector-icons/MaterialIcons";
import { managerLeaveRequestClass } from "../../Services/LeaveRequest/LeaveRequest.service";

const LeaveRequest = () => {
  const userDetails = useSelector((state: any) => state.userDetails);
  const userID = userDetails?.user?.id;

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        const data = await managerLeaveRequestClass.LeaveRequestGet(userID);
        setLeaveRequests(data.data);
      } catch (error) {
        console.error("Failed to fetch leave requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRequests();
  }, [userID]);

  const handleApprove = async (requestId) => {
    try {
      console.log(`Approved request ID: ${requestId}`);
  
      // Call the API to approve
      await managerLeaveRequestClass.LeaveStatusUpdate(requestId, "Approve");
  
      // Update the local state to remove the approved request
      setLeaveRequests((prevRequests) =>
        prevRequests.filter((request) => request.id !== requestId)
      );
      console.log("Request approved and removed from the list.");
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };
  
  const handleReject = async (requestId) => {
    try {
      console.log(`Rejected request ID: ${requestId}`);
  
      // Call the API to reject
      await managerLeaveRequestClass.LeaveStatusUpdate(requestId, "Decline");
  
      // Update the local state to remove the rejected request
      setLeaveRequests((prevRequests) =>
        prevRequests.filter((request) => request.id !== requestId)
      );
      console.log("Request rejected and removed from the list.");
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };
  
  

  const renderRightActions = (requestId) => (
    <View style={styles.actions}>
      <TouchableOpacity
        style={styles.approve}
        onPress={() => handleApprove(requestId)}
      >
        <Text style={styles.actionText}>Approve</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.reject}
        onPress={() => handleReject(requestId)}
      >
        <Text style={styles.actionText}>Reject</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item.id)}
      overshootFriction={8}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="person" size={24} color="#0056b3" />
          <Text style={[styles.cardText, styles.boldName]}>
            Name: {item.user?.name || "N/A"}
          </Text>
        </View>
        <View style={styles.cardDetail}>
          <Icon name="event-note" size={20} color="#666" />
          <Text style={styles.reasonText}>
            Leave: {formatDate(item.leavestart)} to {formatDate(item.leaveend)}
          </Text>
        </View>
        <View style={styles.cardDetail}>
          <Icon name="category" size={20} color="#666" />
          <Text style={styles.reasonText}>
            Type: {item.leavetype} | Leave Part: {item.leavepart}
          </Text>
        </View>
        <View style={styles.cardDetail}>
          <Icon name="comment" size={20} color="#666" />
          <Text style={styles.reasonText}>Reason: {item.reason}</Text>
        </View>
        <View style={styles.cardDetail}>
          <Icon name="info" size={20} color="#666" />
          <Text style={styles.reasonText}>Status: {item.status || "Pending"}</Text>
        </View>
      </View>
    </Swipeable>
  );
  

  const formatDate = (date) => {
    if (!date) return "Invalid Date";
    const [day, month, year] = date.split("/");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${parseInt(day)} ${months[parseInt(month) - 1]}, ${year}`;
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {leaveRequests.length > 0 ? (
        <FlatList
          data={leaveRequests}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No leave requests available.</Text>
        </View>
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
  },
  listContainer: {
    padding: 15,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 20,
    marginBottom: 15,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  cardDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },
  cardText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 6,
  },
  boldName: {
    fontWeight: "700",
    color: "#0056b3",
  },
  reasonText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 10,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  approve: {
    backgroundColor: "#4caf50",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  reject: {
    backgroundColor: "#f44336",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
  },
});

export default LeaveRequest;
