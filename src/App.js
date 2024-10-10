import React, { useState, useEffect, createContext, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Overview from './Overview';
import Transactions from './Transactions';
import Settings from './Settings';
import './App.css';
import { Modal, Button, Input, Switch, Alert, List, Badge, message, Typography, Divider } from "antd";
import { BellOutlined } from '@ant-design/icons';
import { auth, database } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';

// Destructure Typography components for easy use
const { Title, Paragraph, Text } = Typography;

// Create and export the context for dark mode
export const DarkModeContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Apply dark mode class to the root element
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
      <Router>
        <div className="App">
          <LeftSection user={user} />
          <RightSection user={user} />
        </div>
      </Router>
    </DarkModeContext.Provider>
  );
}

function LeftSection({ user }) {
  return (
    <div className="left-section">
      <Link to="/" className="custom-button">P2P-LOAN</Link>
      {user ? (
        <>
          <Link to="/overview" className="custom-button">Overview</Link>
          <Link to="/transactions" className="custom-button">Transactions</Link>
          <Link to="/settings" className="custom-button">Settings</Link>
        </>
      ) : (
        <div className="left-section-text">
          <p>Please log in to access all features</p>
        </div>
      )}
      <div className="footer">
        <a href="https://panicdevs.com" target="_blank" rel="noopener noreferrer">
          Developed by PanicDevs
        </a>
      </div>
    </div>
  );
}

function RightSection({ user }) {
  const location = useLocation();
  
  return (
    <div className="right-section">
      <Overlay user={user} />
      {location.pathname === '/' ? (
        <Introduction />
      ) : (
        <Routes>
          <Route path="/overview" element={<Overview />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      )}
    </div>
  );
}

function Introduction() {
  return (
    <div style={{ padding: '40px' }}>
      <Title level={2}>Welcome to the P2P Loan App</Title>
      <Paragraph>
        The P2P Loan App is designed to facilitate easy and secure peer-to-peer loans. 
        Users can send money, request loans, and manage their transactions seamlessly through this platform.
        Whether you are looking to lend money to others or borrow funds quickly, our application provides a streamlined experience.
      </Paragraph>

      <Divider />

      <Title level={4}>Overview Page</Title>
      <Paragraph>
        The <Text strong>Overview</Text> page is where you can <Text strong>send or receive money</Text>. 
        You can initiate money transfers to other users or request funds directly. 
        It's the central hub for managing all your peer-to-peer transactions efficiently.
      </Paragraph>

      <Title level={4}>Transactions Page</Title>
      <Paragraph>
        The <Text strong>Transactions</Text> page displays all your past and current transactions, including money sent, received, 
        and any loan requests that have been accepted or declined. You can filter transactions, view detailed information, and 
        manage each transaction easily.
      </Paragraph>

      <Paragraph>
        Explore these pages to manage your loans effectively and stay on top of your financial engagements.
      </Paragraph>
    </div>
  );
}

function Overlay({ user }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();  // Use navigate for programmatic navigation

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notificationsRef = collection(database, 'notifications');
        const q = query(notificationsRef, where('receiverEmail', '==', user.email), where('read', '==', false));
        const querySnapshot = await getDocs(q);
        const fetchedNotifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(fetchedNotifications);
        setUnreadCount(fetchedNotifications.length); // Set the unread notifications count
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    if (user) {
      fetchNotifications();
    }
  }, [user]);  // No more missing dependency, as `fetchNotifications` is defined inside `useEffect`

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      setError(null);
      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: name,
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setIsModalVisible(false);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');  // Redirect to the main page after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const toggleSignup = (checked) => {
    setIsSignup(checked);
  };

  const handleNotificationClick = () => {
    setIsNotificationModalVisible(true);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const notificationDoc = doc(database, 'notifications', notificationId);
      await updateDoc(notificationDoc, { read: true });
      setNotifications(notifications.filter(notification => notification.id !== notificationId));
      setUnreadCount(unreadCount - 1); // Decrease the unread count
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleAcceptRequest = async (notification) => {
    try {
      // Add transaction to the receiver's transactions collection
      const receiverTransactionsRef = collection(database, `users/${user.uid}/transactions`);
      await addDoc(receiverTransactionsRef, {
        name: notification.requestInfo.name,
        email: notification.requesterEmail,
        accountType: notification.requestInfo.accountType,
        returnDate: notification.requestInfo.returnDate,
        amount: notification.requestInfo.amount,
        sendrecieve: 'Send', // Mark as a sent transaction for the receiver
        timestamp: new Date(),
      });

      // Add transaction to the requester's transactions collection
      const requesterTransactionsRef = collection(database, `users/${notification.requesterId}/transactions`);
      await addDoc(requesterTransactionsRef, {
        name: notification.requestInfo.name,
        email: user.email,
        accountType: notification.requestInfo.accountType,
        returnDate: notification.requestInfo.returnDate,
        amount: notification.requestInfo.amount,
        sendrecieve: 'Receive', // Mark as a received transaction for the requester
        timestamp: new Date(),
      });

      // Mark the notification as read
      await handleMarkAsRead(notification.id);
      message.success('Request accepted and transaction added for both users!');
    } catch (error) {
      message.error('Failed to accept request');
      console.error('Error accepting request: ', error);
    }
  };

  const handleDeclineRequest = async (notificationId) => {
    // Simply mark the request as read (declined)
    await handleMarkAsRead(notificationId);
    message.info('Request declined');
  };

  return (
    <div className="overlay">
      <div className="login-signup">
        {user ? (
          <>
            <h3>Welcome, {user.displayName || user.email}</h3>
            <div className="action-buttons">
              <Button type="primary" onClick={handleLogout}>Logout</Button>
              <Badge count={unreadCount} overflowCount={9}>
                <BellOutlined style={{ fontSize: '20px', marginLeft: '10px', cursor: 'pointer' }} onClick={handleNotificationClick} />
              </Badge>
            </div>
          </>
        ) : (
          <>
            <Button type="primary" onClick={showModal}>Login/Signup</Button>
            <Badge count={unreadCount} overflowCount={9}>
              <BellOutlined style={{ fontSize: '20px', marginLeft: '10px', cursor: 'pointer' }} onClick={handleNotificationClick} />
            </Badge>
          </>
        )}
      </div>
      <Modal title={isSignup ? "Sign Up" : "Login"} visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '10px' }} />}
        {isSignup && (
          <Input 
            placeholder="Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            style={{ marginBottom: '10px' }}
          />
        )}
        <Input 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          style={{ marginBottom: '10px' }}
        />
        <Input.Password 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
        <div style={{ marginTop: '10px' }}>
          <span>{isSignup ? "Already have an account?" : "Don't have an account?"}</span>
          <Switch 
            checked={isSignup} 
            onChange={toggleSignup} 
            style={{ marginLeft: '10px' }} 
            checkedChildren="Sign Up" 
            unCheckedChildren="Login"
          />
        </div>
      </Modal>

      <Modal title="Notifications" visible={isNotificationModalVisible} onCancel={() => setIsNotificationModalVisible(false)} footer={null}>
        <List
          dataSource={notifications}
          renderItem={item => (
            <List.Item
              actions={[
                item.type === 'Request' ? (
                  <>
                    <Button type="link" onClick={() => handleAcceptRequest(item)}>Accept</Button>
                    <Button type="link" onClick={() => handleDeclineRequest(item.id)}>Decline</Button>
                  </>
                ) : (
                  <Button type="link" onClick={() => handleMarkAsRead(item.id)}>Mark as Read</Button>
                )
              ]}
            >
              <List.Item.Meta
                title={`Transaction from ${item.senderEmail || item.requesterEmail}`}
                description={`Amount: $${item.transactionInfo?.amount || item.requestInfo?.amount} on ${new Date(item.transactionInfo?.date || item.requestInfo?.date).toLocaleDateString()}`}
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
}

export default App;

