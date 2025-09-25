// src/components/sales/RecordPaymentModal.js
"use client";
import React, { useState } from 'react';
import styled from 'styled-components';
import { FaTimes, FaMoneyBillWave, FaCheck } from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import toast from 'react-hot-toast';
import { salesAPI } from '../../services/api';

const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1012; display: grid; place-items: center; padding: 1rem;
`;
const ModalContent = styled.div`
  background: white; border-radius: 1rem; width: 100%; max-width: 500px; max-height: 90vh; display: flex; flex-direction: column;
`;
const ModalHeader = styled.div`
  padding: 1.5rem; border-bottom: 1px solid #e2e8f0; h2 { margin: 0; font-size: 1.25rem; }
`;
const ModalBody = styled.div`
  padding: 1.5rem; flex-grow: 1; overflow-y: auto;
`;
const FormGroup = styled.div` display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; `;
const Label = styled.label` font-weight: 600; font-size: 0.875rem; color: #4a5568; margin-bottom: 0.5rem; display: block; `;
const ModalFooter = styled.div`
  padding: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 1rem;
`;

const RecordPaymentModal = ({ sale, onClose, onPaymentSuccess }) => {
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [loading, setLoading] = useState(false);

    const remainingBalance = sale.totalAmount - sale.amountPaid;

    const handleSubmit = async () => {
        const paymentAmount = Number(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            return toast.error("Please enter a valid amount.");
        }
        if (paymentAmount > remainingBalance) {
            return toast.error(`Payment amount (Rwf ${paymentAmount.toLocaleString()}) cannot exceed the remaining balance of Rwf ${remainingBalance.toLocaleString()}.`);
        }

        setLoading(true);
        try {
            // Use salesAPI to record payment for a specific sale
            await salesAPI.recordPayment(sale._id, { amount: paymentAmount, paymentMethod });
            toast.success("Payment recorded successfully!");
            onPaymentSuccess(); // Callback to notify parent (e.g., refresh sales list)
            onClose();
        } catch (error) {
            // toast.error is handled by API interceptor
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <ModalHeader>
                    <h2>Record Payment for Sale #{sale.receiptNumber}</h2>
                </ModalHeader>
                <ModalBody>
                    <p>
                        <strong>Total Sale Amount:</strong> Rwf {sale.totalAmount.toLocaleString()}
                    </p>
                    <p>
                        <strong>Amount Paid:</strong> Rwf {sale.amountPaid?.toLocaleString() || '0'}
                    </p>
                    <p style={{marginBottom: '1.5rem'}}>
                        <strong>Remaining Balance:</strong> <span style={{color: '#c53030', fontWeight: 'bold'}}>Rwf {remainingBalance.toLocaleString()}</span>
                    </p>

                    <FormGroup>
                        <Label htmlFor="paymentAmount">Payment Amount (RWF)</Label>
                        <Input
                            id="paymentAmount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="0.01"
                            max={remainingBalance}
                            placeholder={`Enter amount (max: ${remainingBalance.toLocaleString()})`}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select
                            id="paymentMethod"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                            <option value="Cash">Cash</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="Mobile Money">Mobile Money</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                        </Select>
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button variant="secondary" onClick={onClose} disabled={loading}><FaTimes/> Cancel</Button>
                    <Button variant="primary" onClick={handleSubmit} loading={loading} disabled={!amount || Number(amount) <= 0}><FaCheck/> Record Payment</Button>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>
    );
};

export default RecordPaymentModal;