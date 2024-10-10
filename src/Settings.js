import React, { useState } from 'react';
import { Input, Button, Form, Alert } from 'antd';
import { auth } from './firebase';
import { updateProfile, updatePassword } from 'firebase/auth';

function Settings() {
  const [name, setName] = useState(auth.currentUser?.displayName || '');
  const [email, setEmail] = useState(auth.currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleProfileUpdate = async () => {
    try {
      setErrorMessage(null);
      await updateProfile(auth.currentUser, { displayName: name });
      setSuccessMessage('Profile updated successfully!');
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setErrorMessage(null);
      if (password) {
        await updatePassword(auth.currentUser, password);
        setSuccessMessage('Password updated successfully!');
      } else {
        setErrorMessage('Please enter a new password.');
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };



  return (
    <div>
      <h2>Settings</h2>

      {successMessage && <Alert message={successMessage} type="success" showIcon />}
      {errorMessage && <Alert message={errorMessage} type="error" showIcon />}

      <Form layout="vertical">
        <Form.Item label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Form.Item>
        <Form.Item label="Email">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled />
        </Form.Item>
        <Form.Item label="Password">
          <Input.Password value={password} onChange={(e) => setPassword(e.target.value)} />
        </Form.Item>
        <Button type="primary" onClick={handleProfileUpdate}>
          Update Profile
        </Button>
        <Button type="primary" onClick={handlePasswordChange}>
          Change Password
        </Button>
      </Form>
    </div>
  );
}

export default Settings;
