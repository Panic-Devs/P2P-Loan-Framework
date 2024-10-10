import React, { useState, useEffect } from 'react';
import { Layout, Table, message } from 'antd';
import { collection, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { auth, database } from './firebase';

const { Content } = Layout;

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      const user = auth.currentUser;

      if (user) {
        const userId = user.uid;
        const transactionsRef = collection(database, `users/${userId}/transactions`);
        const q = query(transactionsRef);

        // Real-time listener for transactions
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const transactionsData = [];
          querySnapshot.forEach((doc) => {
            // Include the timestamp in the transaction data
            const data = doc.data();
            const timestamp = data.timestamp ? data.timestamp.toDate().toLocaleString() : ''; // Assuming timestamp is stored as Firestore Timestamp
            transactionsData.push({ key: doc.id, ...data, timestamp });
          });
          setTransactions(transactionsData);
        });

        // Cleanup listener on unmount
        return () => unsubscribe();
      }
    };

    fetchTransactions();
  }, []);

  const handleDelete = async (key) => {
    try {
      const user = auth.currentUser;

      if (user) {
        const userId = user.uid;
        const transactionDocRef = doc(database, `users/${userId}/transactions`, key);
        
        await deleteDoc(transactionDocRef);
        message.success('Transaction deleted successfully!');
      }
    } catch (error) {
      message.error('Failed to delete transaction');
      console.error('Error deleting transaction: ', error);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
    },
    {
      title: 'Send / Receive',
      dataIndex: 'sendrecieve',
      key: 'sendrecieve',
    },
    {
      title: 'Timestamp', // New column for the timestamp
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <button onClick={() => handleDelete(record.key)}>Delete</button>
      ),
    },
  ];

  return (
    <Content style={{ padding: '100px 80px', minHeight: 900 }}>
      <Table
        columns={columns}
        dataSource={transactions}
      />
    </Content>
  );
};

export default Transactions;
