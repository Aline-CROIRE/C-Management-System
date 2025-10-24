// client/src/components/restaurant/modals/FeedbackModal.js
"use client";

import React, { useState, useEffect } from 'react'; // Imported useEffect and useState
import styled from 'styled-components';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import {
  FaStar, FaUser, FaEnvelope, FaPhone, FaTable, FaCalendarAlt, FaCommentDots,
  FaCheckCircle, FaExclamationCircle, FaTimes, FaTrash, FaSpinner,FaStickyNote
} from 'react-icons/fa'; // Added FaPhone
import toast from 'react-hot-toast'; // Imported toast

const FeedbackDetailContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  padding: ${(props) => props.theme.spacing?.sm || "0.5rem"} 0;
`;

const DetailRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  font-size: ${(props) => props.theme.typography?.fontSize?.md || "1rem"};
  color: ${(props) => props.theme.colors?.text};

  svg {
    color: ${(props) => props.theme.colors?.primary};
    margin-top: 0.2rem;
    min-width: 18px;
  }
  span {
      font-weight: ${(props) => props.theme.typography?.fontWeight?.medium};
  }
  p {
      margin: 0;
  }
`;

const RatingDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  color: ${(props) => props.theme.colors?.warningDark};
  font-size: ${(props) => props.theme.typography?.fontSize?.xl || "1.25rem"};
  margin-top: ${(props) => props.theme.spacing?.sm || "0.5rem"};

  svg {
      margin-right: 0.1rem;
      color: #FFC107; /* Consistent star color */
  }
  span {
      font-weight: ${(props) => props.theme.typography?.fontWeight?.bold};
      color: ${(props) => props.theme.colors?.heading};
  }
`;

const StatusUpdateSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  margin-top: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  padding-top: ${(props) => props.theme.spacing?.md || "1rem"};
  border-top: 1px dashed ${(props) => props.theme.colors?.borderLight};

  h5 {
      margin: 0 0 ${(props) => props.theme.spacing?.xs || "0.25rem"} 0;
      font-size: ${(props) => props.theme.typography?.fontSize?.md || "1rem"};
      color: ${(props) => props.theme.colors?.heading};
  }
  div {
      display: flex;
      gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
      flex-wrap: wrap;
  }
`;

const FeedbackModal = ({ restaurantId, feedbackEntry, onClose, onUpdateStatus, onDelete }) => {
  const [currentStatus, setCurrentStatus] = useState(feedbackEntry?.status);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setCurrentStatus(feedbackEntry?.status);
  }, [feedbackEntry?.status]);

  const handleStatusChange = async (newStatus) => {
    if (currentStatus === newStatus) return; // No change
    setUpdatingStatus(true);
    try {
      await onUpdateStatus(feedbackEntry._id, newStatus);
      setCurrentStatus(newStatus);
    } catch (err) {
      toast.error('Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this feedback entry?')) {
      setDeleting(true);
      try {
        await onDelete(feedbackEntry._id);
        onClose(); // Close modal after successful deletion
      } catch (err) {
        toast.error('Failed to delete feedback.');
      } finally {
        setDeleting(false);
      }
    }
  };

  const modalFooterActions = (
    <>
      <Button variant="danger" onClick={handleDelete} disabled={deleting}><FaTrash /> {deleting ? 'Deleting...' : 'Delete'}</Button>
      <Button variant="secondary" onClick={onClose}><FaTimes /> Close</Button>
    </>
  );

  if (!feedbackEntry) return null;

  // Helper function for button content to simplify JSX
  const getButtonContent = (statusToCheck) => {
    if (currentStatus === statusToCheck) {
      return <><FaCheckCircle /> {statusToCheck.charAt(0).toUpperCase() + statusToCheck.slice(1)} (Current)</>;
    }
    if (updatingStatus) {
      return <><FaSpinner className="spin" /> Updating</>;
    }
    return `Mark ${statusToCheck.charAt(0).toUpperCase() + statusToCheck.slice(1)}`;
  };


  return (
    <Modal title={`Feedback from ${feedbackEntry.customerName || 'Anonymous'}`} onClose={onClose} footerActions={modalFooterActions}>
      <FeedbackDetailContainer>
        <DetailRow>
          <FaUser /> <span>Customer:</span> <p>{feedbackEntry.customerName || 'Anonymous'}</p>
        </DetailRow>
        {feedbackEntry.customerEmail && (
          <DetailRow>
            <FaEnvelope /> <span>Email:</span> <p>{feedbackEntry.customerEmail}</p>
          </DetailRow>
        )}
        {feedbackEntry.customerPhone && (
          <DetailRow>
            <FaPhone /> <span>Phone:</span> <p>{feedbackEntry.customerPhone}</p>
          </DetailRow>
        )}
        {feedbackEntry.tableNumber && (
          <DetailRow>
            <FaTable /> <span>Table:</span> <p>{feedbackEntry.tableNumber}</p>
          </DetailRow>
        )}
        <DetailRow>
          <FaCalendarAlt /> <span>Submitted:</span> <p>{new Date(feedbackEntry.createdAt).toLocaleString()}</p>
        </DetailRow>

        <RatingDisplay>
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} color={i < feedbackEntry.rating ? '#FFC107' : '#e4e5e9'} />
          ))} <span>({feedbackEntry.rating} / 5 Stars)</span>
        </RatingDisplay>

        {feedbackEntry.comment && (
          <DetailRow>
            <FaCommentDots /> <span>Comment:</span> <p>{feedbackEntry.comment}</p>
          </DetailRow>
        )}
        {feedbackEntry.notes && (
          <DetailRow>
            <FaStickyNote /> <span>Internal Notes:</span> <p>{feedbackEntry.notes}</p>
          </DetailRow>
        )}

        <StatusUpdateSection>
          <h5>Update Status:</h5>
          <div>
            <Button
              variant="warning"
              size="sm"
              onClick={() => handleStatusChange('new')}
              disabled={currentStatus === 'new' || updatingStatus}
            >
              {getButtonContent('new')}
            </Button>
            <Button
              variant="info"
              size="sm"
              onClick={() => handleStatusChange('reviewed')}
              disabled={currentStatus === 'reviewed' || updatingStatus}
            >
              {getButtonContent('reviewed')}
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={() => handleStatusChange('resolved')}
              disabled={currentStatus === 'resolved' || updatingStatus}
            >
              {getButtonContent('resolved')}
            </Button>
          </div>
        </StatusUpdateSection>
      </FeedbackDetailContainer>
    </Modal>
  );
};

export default FeedbackModal;