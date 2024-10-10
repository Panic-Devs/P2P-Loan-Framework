import React, { useState } from 'react';
import { Button, Modal, message, Card } from 'antd';
import { Form, Input, TreeSelect, DatePicker, InputNumber } from 'antd';
import { auth, database } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { SendOutlined, DollarCircleOutlined } from '@ant-design/icons';

function Overview() {
  const [modal1Open, setModal1Open] = useState(false);
  const [modal2Open, setModal2Open] = useState(false);
  const [componentSize, setComponentSize] = useState('default');
  const [form] = Form.useForm();

  const onFormLayoutChange = ({ size }) => {
    setComponentSize(size);
  };

  const handleSendMoney = async (values) => {
    try {
      const user = auth.currentUser;

      if (user) {
        const senderId = user.uid;
        const transactionsRef = collection(database, `users/${senderId}/transactions`);

        await addDoc(transactionsRef, {
          name: values.name,
          email: values.email,
          accountType: values.account,
          returnDate: values.returnDate.toDate(),
          amount: values.amount,
          sendrecieve: 'Send',
          timestamp: new Date(),
        });

        const receiverRef = collection(database, 'notifications');
        const notification = {
          type: 'Send',
          senderId: senderId,
          senderEmail: user.email,
          receiverEmail: values.email,
          transactionInfo: {
            name: values.name,
            amount: values.amount,
            date: new Date().toISOString(),
          },
          read: false,
          timestamp: new Date(),
        };

        await addDoc(receiverRef, notification);

        message.success('Transaction saved and notification sent successfully!');
        form.resetFields();
        setModal1Open(false);
      } else {
        message.error('User not authenticated');
      }
    } catch (error) {
      message.error('Failed to save transaction and send notification');
      console.error('Error adding transaction: ', error);
    }
  };

  const handleRequestMoney = async (values) => {
    try {
      const user = auth.currentUser;

      if (user) {
        const requesterId = user.uid;

        const receiverRef = collection(database, 'notifications');
        const notification = {
          type: 'Request',
          requesterId: requesterId,
          requesterEmail: user.email,
          receiverEmail: values.email,
          requestInfo: {
            name: values.name,
            amount: values.amount,
            accountType: values.account,
            returnDate: values.returnDate.toDate(),
            date: new Date().toISOString(),
          },
          read: false,
          timestamp: new Date(),
        };

        await addDoc(receiverRef, notification);

        message.success('Money request sent successfully!');
        form.resetFields();
        setModal2Open(false);
      } else {
        message.error('User not authenticated');
      }
    } catch (error) {
      message.error('Failed to send money request');
      console.error('Error sending money request: ', error);
    }
  };

  return (
    <div style={{ paddingTop: '150px', textAlign: 'left', paddingRight: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '40px' }}>
        <div>
          <div style={{ marginBottom: '20px', fontSize: '16px', color: '#595959' }}>
            <strong>Instructions:</strong>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              <li>Click the "Send Money" button to initiate a money transfer. A form will appear where you can enter the recipient's details and transaction amount. Specify the return date by which you expect the money back.</li>
              <li>Click the "Request Money" button to request money from someone. A form will appear where you can enter your details, the recipient's email, and the amount you are requesting. Also, set the date by which you expect to receive the money.</li>
              <li>After filling out the form, the transaction will be added to the transaction page and a notification will be sent to the recipient.</li>
            </ul>
          </div>
          <Button type="primary" icon={<SendOutlined />} onClick={() => setModal1Open(true)}>
            Send Money
          </Button>
          <Modal
            title="Send Money"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
            open={modal1Open}
            onOk={() => form.submit()}
            onCancel={() => setModal1Open(false)}
          >
            <Card>
              <Form
                form={form}
                labelCol={{ span: 4 }}
                wrapperCol={{ span: 14 }}
                layout="horizontal"
                initialValues={{ size: componentSize }}
                onValuesChange={onFormLayoutChange}
                size={componentSize}
                onFinish={handleSendMoney}
                style={{ maxWidth: 600 }}
              >
                <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter the name' }]}>
                  <Input placeholder="Enter recipient's name" />
                </Form.Item>
                <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Please enter the email' }]}>
                  <Input placeholder="Enter recipient's email" />
                </Form.Item>
                <Form.Item label="Account" name="account" rules={[{ required: true, message: 'Please select an account type' }]}>
                  <TreeSelect
                    treeData={[
                      { title: 'Chequing', value: 'chequing' },
                      { title: 'Saving', value: 'saving' },
                    ]}
                    placeholder="Select account type"
                  />
                </Form.Item>
                <Form.Item label="Return" name="returnDate" rules={[{ required: true, message: 'Please select the return date' }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Amount" name="amount" rules={[{ required: true, message: 'Please enter the amount' }]}>
                  <InputNumber placeholder="Enter amount" style={{ width: '100%' }} />
                </Form.Item>
              </Form>
            </Card>
          </Modal>
        </div>
        <div>
          <div style={{ marginBottom: '20px', fontSize: '16px', color: '#595959' }}>
            <strong>Instructions:</strong>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              <li>Click the "Request Money" button to request money from someone. A form will appear where you can enter your details, the recipient's email, and the amount you are requesting. Also, set the date by which you expect to receive the money.</li>
              <li>Click the "Send Money" button to initiate a money transfer. A form will appear where you can enter the recipient's details and transaction amount. Specify the return date by which you expect the money back.</li>
              <li>After filling out the form, the transaction will be added to the transaction page and a notification will be sent to the recipient.</li>
            </ul>
          </div>
          <Button type="primary" icon={<DollarCircleOutlined />} onClick={() => setModal2Open(true)} style={{ marginLeft: 'auto' }}>
            Request Money
          </Button>
          <Modal
            title="Request Money"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
            open={modal2Open}
            onOk={() => form.submit()}
            onCancel={() => setModal2Open(false)}
          >
            <Card>
              <Form
                form={form}
                labelCol={{ span: 4 }}
                wrapperCol={{ span: 14 }}
                layout="horizontal"
                initialValues={{ size: componentSize }}
                onValuesChange={onFormLayoutChange}
                size={componentSize}
                onFinish={handleRequestMoney}
                style={{ maxWidth: 600 }}
              >
                <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter the name' }]}>
                  <Input placeholder="Enter your name" />
                </Form.Item>
                <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Please enter the email' }]}>
                  <Input placeholder="Enter your email" />
                </Form.Item>
                <Form.Item label="Account" name="account" rules={[{ required: true, message: 'Please select an account type' }]}>
                  <TreeSelect
                    treeData={[
                      { title: 'Chequing', value: 'chequing' },
                      { title: 'Saving', value: 'saving' },
                    ]}
                    placeholder="Select account type"
                  />
                </Form.Item>
                <Form.Item label="Return" name="returnDate" rules={[{ required: true, message: 'Please select the return date' }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Amount" name="amount" rules={[{ required: true, message: 'Please enter the amount' }]}>
                  <InputNumber placeholder="Enter amount" style={{ width: '100%' }} />
                </Form.Item>
              </Form>
            </Card>
          </Modal>
        </div>
      </div>
    </div>
  );
}

export default Overview;
