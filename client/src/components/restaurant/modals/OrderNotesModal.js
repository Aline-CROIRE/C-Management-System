// client/src/components/restaurant/modals/OrderNotesModal.js
"use client";

import React, { useState } from 'react';
import styled from 'styled-components';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { FaSave, FaTimes, FaStickyNote } from 'react-icons/fa';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const OrderNotesModal = ({ initialNotes, onClose, onSave }) => {
  const [notes, setNotes] = useState(initialNotes);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    onSave(notes); // Pass notes back to parent component
    setSubmitting(false); // Reset submitting state
  };

  const modalFooterActions = (
    <>
      <Button variant="secondary" onClick={onClose} type="button" disabled={submitting}><FaTimes /> Cancel</Button>
      <Button variant="primary" type="submit" loading={submitting} disabled={submitting}><FaSave /> Save Notes</Button>
    </>
  );

  return (
    <Modal title="Add/Edit Notes" onClose={onClose} footerActions={modalFooterActions}>
      <Form onSubmit={handleSubmit}>
        <Input
          label={<><FaStickyNote /> Special Notes</>}
          placeholder="e.g., No onions, extra spicy, allergy to nuts"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          as="textarea"
          rows="5"
        />
      </Form>
    </Modal>
  );
};

export default OrderNotesModal;