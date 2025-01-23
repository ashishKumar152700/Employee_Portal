
import * as React from 'react';
import { ScrollView, StyleSheet, TextInput, View, Text } from 'react-native';
import { DataTable } from 'react-native-paper';

const MyTickets = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [itemsPerPage, setItemsPerPage] = React.useState(10); // Set default to 8 rows per page
  const [items] = React.useState([
    { key: 1, catgory: 'Laptop', ticket: '2024-12-01', status: 'Pending' },
    { key: 2, catgory: 'Mouse', ticket: '2024-12-02', status: 'Approved' },
    { key: 3, catgory: 'Headphone', ticket: '2024-12-03', status: 'Pending' },
    { key: 4, catgory: 'Printer', ticket: '2024-12-04', status: 'Approved' },
    { key: 5, catgory: 'Monitor', ticket: '2024-12-05', status: 'Pending' },
    { key: 6, catgory: 'Keyboard', ticket: '2024-12-06', status: 'Approved' },
    { key: 7, catgory: 'Tablet', ticket: '2024-12-07', status: 'Pending' },
    { key: 8, catgory: 'Speaker', ticket: '2024-12-08', status: 'Approved' },
    { key: 9, catgory: 'Camera', ticket: '2024-12-09', status: 'Pending' },
    { key: 10, catgory: 'Phone', ticket: '2024-12-10', status: 'Approved' },
    { key: 11, catgory: 'Charger', ticket: '2024-12-11', status: 'Pending' },
    { key: 12, catgory: 'Projector', ticket: '2024-12-12', status: 'Approved' },
  ]);

  const filteredItems = items.filter((item) =>
    item.catgory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, filteredItems.length);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by category..."
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
        />
      </View>

      <DataTable>
        <DataTable.Header style={styles.header}>
          <DataTable.Title style={styles.title}>
            <Text style={styles.headerText}>Category</Text>
          </DataTable.Title>
          <DataTable.Title numeric style={styles.title}>
            <Text style={styles.headerText}>Ticket raised on</Text>
          </DataTable.Title>
          <DataTable.Title style={styles.title}>
            <Text style={styles.headerText}>Status</Text>
          </DataTable.Title>
        </DataTable.Header>



        {filteredItems.slice(from, to).map((item) => (
          <DataTable.Row key={item.key}>
            <DataTable.Cell>{item.catgory}</DataTable.Cell>
            <DataTable.Cell numeric style={styles.ticketDateCell}>{item.ticket}</DataTable.Cell>
            <DataTable.Cell style={styles.statusCell}>
              <Text style={item.status === 'Pending' ? styles.pendingText : styles.approvedText}>
                {item.status}
              </Text>
            </DataTable.Cell>


          </DataTable.Row>
        ))}

        {filteredItems.length > itemsPerPage && (
          <DataTable.Pagination
            page={page}
            numberOfPages={Math.ceil(filteredItems.length / itemsPerPage)}
            onPageChange={(page) => setPage(page)}
            label={`${from + 1}-${to} of ${filteredItems.length}`}
            showFastPaginationControls
          />
        )}
      </DataTable>
    </ScrollView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'white'
  },
  searchContainer: {
    padding: 15,
    backgroundColor: 'white',
  },
  searchInput: {
    height: 40,
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
  },
  title: {
    flex: 1,
    justifyContent: 'space-around',
  },
  header: {
    // backgroundColor: 'rgb(0,47,81)',
    paddingHorizontal: 0,

  },
  headerText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 14,
  },
  ticketDateCell: {
    paddingRight: 10, // Adds space between the "Ticket Date" and "Status" columns
  },
  statusCell: {
    paddingLeft: 15,
    justifyContent: 'center'
  },
  pendingText: {
    color: '#ff4d4d', // Red text color for Pending status
  },
  approvedText: {
    color: '#4CAF50', // Green text color for Approved status
  },
});

export default MyTickets;

