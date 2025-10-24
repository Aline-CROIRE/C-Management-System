// client/src/components/restaurant/modals/POSPaymentModal.js
"use client";

import React, { useState, useEffect } from 'react'; // Added useEffect
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { FaMoneyBillAlt, FaCreditCard, FaMobileAlt, FaSave, FaTimes, FaDollarSign, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast'; // Added toast import

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const PaymentMethodGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  margin-bottom: ${(props) => props.theme.spacing?.lg || "1rem"};
`;

const PaymentMethodButton = styled(Button)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80px;
  background: ${props => props.$active ? props.theme.colors?.primary : props.theme.colors?.surface};
  color: ${props => props.$active ? 'white' : props.theme.colors?.text};
  border: 2px solid ${props => props.$active ? props.theme.colors?.primaryDark : props.theme.colors?.borderLight};

  &:hover {
    filter: brightness(1.05);
  }
  svg {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
  }
`;

const POSPaymentModal = ({ totalAmount, orderId, restaurantId, onClose, onPaymentSuccess }) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      amountPaid: totalAmount,
      paymentMethod: '',
      changeDue: 0,
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const amountPaid = watch('amountPaid');
  const paymentMethod = watch('paymentMethod');

  useEffect(() => { // useEffect is now imported
    const paid = parseFloat(amountPaid) || 0;
    const total = parseFloat(totalAmount) || 0;
    setValue('changeDue', Math.max(0, paid - total).toFixed(2));
  }, [amountPaid, totalAmount, setValue]);

  const onSubmit = async (data) => {
    if (!paymentMethod) {
      toast.error('Please select a payment method.'); // toast is now imported
      return;
    }
    if (parseFloat(data.amountPaid) < totalAmount) {
      toast.error(`Amount paid (${parseFloat(data.amountPaid).toFixed(2)}) is less than total (${parseFloat(totalAmount).toFixed(2)}).`);
      return;
    }

    setSubmitting(true);
    const payload = {
      orderId: orderId,
      amountPaid: parseFloat(data.amountPaid),
      paymentMethod: data.paymentMethod,
    };

    try {
      await onPaymentSuccess(payload);
      onClose();
    } catch (error) {
      // Error handling is already in onPaymentSuccess, so just reset submitting
    } finally {
      setSubmitting(false);
    }
  };

  const modalFooterActions = (
    <>
      <Button variant="secondary" onClick={onClose} type="button" disabled={submitting}><FaTimes /> Cancel</Button>
      <Button variant="success" type="submit" loading={submitting} disabled={submitting}>
        {submitting ? <><FaSpinner className="spin" /> Processing...</> : <><FaSave /> Complete Payment</>}
      </Button>
    </>
  );

  return (
    <Modal title={`Process Payment for Order Total: Rwf ${parseFloat(totalAmount).toFixed(2)}`} onClose={onClose} footerActions={modalFooterActions}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <h4>Select Payment Method</h4>
        <PaymentMethodGrid>
          <PaymentMethodButton
            type="button"
            $active={paymentMethod === 'cash'}
            onClick={() => setValue('paymentMethod', 'cash')}
          >
            <FaMoneyBillAlt /> Cash
          </PaymentMethodButton>
          <PaymentMethodButton
            type="button"
            $active={paymentMethod === 'card'}
            onClick={() => setValue('paymentMethod', 'card')}
          >
            <FaCreditCard /> Card
          </PaymentMethodButton>
          <PaymentMethodButton
            type="button"
            $active={paymentMethod === 'mobile_pay'}
            onClick={() => setValue('paymentMethod', 'mobile_pay')}
          >
            <FaMobileAlt /> Mobile Pay
          </PaymentMethodButton>
        </PaymentMethodGrid>
        {errors.paymentMethod && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.paymentMethod.message}</p>}

        <Input
          label="Amount Paid"
          type="number"
          step="0.01"
          placeholder={`Enter amount (e.g., ${parseFloat(totalAmount).toFixed(2)})`}
          {...register("amountPaid", { required: "Amount paid is required", min: { value: 0, message: "Amount cannot be negative" } })}
          error={errors.amountPaid?.message}
        />

        <Input
          label="Change Due"
          type="text"
          value={`Rwf ${watch('changeDue')}`}
          readOnly
          disabled
          style={{ cursor: 'default', opacity: 0.8 }}
        />
        {parseFloat(amountPaid) < totalAmount && (
            <p style={{ color: 'red', fontSize: '0.9rem', marginTop: '-0.5rem' }}>
                <FaDollarSign /> Amount paid is less than the total.
            </p>
        )}
      </Form>
    </Modal>
  );
};

export default POSPaymentModal;