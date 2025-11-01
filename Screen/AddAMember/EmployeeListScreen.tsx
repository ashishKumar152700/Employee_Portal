// src/screens/EmployeeListScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  IconButton,
  Searchbar,
  FAB,
  Avatar,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';

import { BiometricUserService } from '../../Services/BiometricService/BiometricUserService';
import { BiometricUser } from '../../Global/BiometricUser';
import EditUserModal from '../../Component/EditUserModal/EditUserModal';

export default function EmployeeListScreen() {
  const [users, setUsers] = useState<BiometricUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<BiometricUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<BiometricUser | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await BiometricUserService.getAllUsers();
      if (response.success) {
        setUsers(response.users);
        setFilteredUsers(response.users);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.error,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load users',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [])
  );

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(
        user =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.userId.toString().includes(searchQuery)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const handleDeleteUser = async (user: BiometricUser) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await BiometricUserService.deleteUser(user.uid);
              if (response.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: 'User deleted successfully',
                });
                loadUsers();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: response.error,
                });
              }
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete user',
              });
            }
          },
        },
      ]
    );
  };

  const handleEditUser = (user: BiometricUser) => {
    setSelectedUser(user);
    setEditModalVisible(true);
  };

  const handleUpdateUser = async (updatedUser: BiometricUser) => {
    try {
      const response = await BiometricUserService.updateUser(updatedUser);
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'User updated successfully',
        });
        setEditModalVisible(false);
        loadUsers();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.error,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update user',
      });
    }
  };

  const renderUserCard = ({ item: user }: { item: BiometricUser }) => (
    <Card style={styles.userCard}>
      <Card.Content>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Avatar.Text 
              size={50} 
              label={user.name.substring(0, 2).toUpperCase()}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text variant="titleMedium" style={styles.userName}>
                {user.name}
              </Text>
              <Text variant="bodySmall" style={styles.userId}>
                ID: {user.userId}
              </Text>
              <Chip 
                mode="outlined" 
                style={[
                  styles.roleChip,
                  user.role === 'Super Admin' && styles.adminChip
                ]}
                textStyle={styles.chipText}
              >
                {user.role}
              </Chip>
            </View>
          </View>
          <View style={styles.actions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => handleEditUser(user)}
              style={styles.actionButton}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor="#f44336"
              onPress={() => handleDeleteUser(user)}
              style={styles.actionButton}
            />
          </View>
        </View>
        
        <View style={styles.biometricInfo}>
          <Text variant="bodySmall" style={styles.sectionTitle}>
            Enrolled Biometrics:
          </Text>
          <View style={styles.biometricChips}>
            {user.hasFingerprint && (
              <Chip icon="fingerprint" style={styles.biometricChip}>
                Fingerprint
              </Chip>
            )}
            {user.hasFace && (
              <Chip icon="face" style={styles.biometricChip}>
                Face
              </Chip>
            )}
            {user.hasPassword && (
              <Chip icon="lock" style={styles.biometricChip}>
                Password
              </Chip>
            )}
            {user.badgeNumber && (
              <Chip icon="card" style={styles.biometricChip}>
                Badge
              </Chip>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search by name or ID"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.uid.toString()}
        renderItem={renderUserCard}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No users found
            </Text>
          </View>
        }
      />

      <EditUserModal
        visible={editModalVisible}
        user={selectedUser}
        onClose={() => setEditModalVisible(false)}
        onUpdate={handleUpdateUser}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    margin: 16,
    elevation: 0,
    backgroundColor: 'white',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  userCard: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: 'white',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    backgroundColor: '#2196F3',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userId: {
    color: '#666',
    marginBottom: 8,
  },
  roleChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2fd',
  },
  adminChip: {
    backgroundColor: '#fff3e0',
  },
  chipText: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    margin: 0,
  },
  biometricInfo: {
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  biometricChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  biometricChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#e8f5e8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: '#666',
  },
});
