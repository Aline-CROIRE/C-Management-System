// client/src/components/restaurant/FeedbackManagement.js
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  FaEdit, FaTrash, FaSearch, FaSync, FaStar, FaCalendarAlt, FaCommentDots,
  FaCheckCircle, FaExclamationCircle, FaTable, FaEnvelope, FaSpinner,  // Added FaSpinner for loading state
} from 'react-icons/fa';
import { feedbackAPI } from '../../services/api'; // feedbackAPI is now correctly exported
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

import FeedbackModal from './modals/FeedbackModal';

const spinAnimation = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};

  @media (max-width: 768px) {
    margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
    flex-direction: column;
    align-items: stretch;
    gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  flex-wrap: wrap;
  align-items: center;

  select {
    padding: 0.6rem 1rem;
    border-radius: 8px;
    border: 1px solid ${(props) => props.theme.colors?.border};
    background: white;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 250px;
  max-width: 450px;

  @media (max-width: 480px) {
    min-width: unset;
    max-width: unset;
    width: 100%;
  }
`;
const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${(props) => props.theme.colors.textSecondary};
  z-index: 2;
  pointer-events: none;
`;
const SearchInput = styled(Input)`
  padding-left: 3rem;
  border-radius: ${(props) => props.theme.borderRadius.lg};
  border: 1px solid ${(props) => props.theme.colors.border};

  @media (max-width: 480px) {
    padding: 0.85rem 1rem;
    padding-left: 2.85rem;
  }
`;

const FeedbackManagementContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`;

const FeedbackGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const FeedbackCard = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => {
        switch (props.$status) {
            case 'new': return props.theme.colors?.warning;
            case 'reviewed': return props.theme.colors?.info;
            case 'resolved': return props.theme.colors?.success;
            default: return props.theme.colors?.border;
        }
    }};
  }

  h4 {
    font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
    margin: 0 0 ${(props) => props.theme.spacing?.xs || "0.25rem"} 0;
    color: ${(props) => props.theme.colors?.heading};
  }
  .feedback-meta {
    font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
    color: ${(props) => props.theme.colors?.textSecondary || "#666"};
    margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    span {
      display: flex;
      align-items: center;
      gap: 0.2rem;
    }
  }
  .rating {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    color: ${(props) => props.theme.colors?.warningDark};
    font-size: ${(props) => props.theme.typography?.fontSize?.md || "1rem"};
    margin-top: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  }
  .comment {
      font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
      color: ${(props) => props.theme.colors?.text};
      flex-grow: 1;
      margin-top: ${(props) => props.theme.spacing?.sm || "0.5rem"};
      max-height: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
  }
  .status-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: ${props => {
        switch (props.$status) {
            case 'new': return props.theme.colors?.warningLight;
            case 'reviewed': return props.theme.colors?.infoLight;
            case 'resolved': return props.theme.colors?.successLight;
            default: return props.theme.colors?.surfaceLight;
        }
    }};
    color: ${props => {
        switch (props.$status) {
            case 'new': return props.theme.colors?.warningDark;
            case 'reviewed': return props.theme.colors?.infoDark;
            case 'resolved': return props.theme.colors?.successDark;
            default: return props.theme.colors?.textSecondary;
        }
    }};
    padding: 0.2rem 0.5rem;
    border-radius: ${(props) => props.theme.borderRadius?.sm};
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: capitalize;
  }
  .actions {
    display: flex;
    gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
    margin-top: ${(props) => props.theme.spacing?.md || "1rem"};
    justify-content: flex-end;
    width: 100%;
  }
`;

const SpinningFaSync = styled(FaSync)`
  animation: ${spinAnimation} 1s linear infinite;
`;

const FeedbackManagement = ({ restaurantId }) => {
  const [feedbackEntries, setFeedbackEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingFeedback, setViewingFeedback] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchFeedbackEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: filterStatus, rating: filterRating, search: debouncedSearchQuery };
      const response = await feedbackAPI.getRestaurantFeedback(restaurantId, params);
      if (response?.success) {
        setFeedbackEntries(response.data);
      } else {
        setError(response?.message || 'Failed to fetch feedback entries.');
        toast.error(response?.message || 'Failed to fetch feedback entries.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred fetching feedback entries.');
      toast.error(err.message || 'An error occurred fetching feedback entries.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, filterStatus, filterRating, debouncedSearchQuery]);

  useEffect(() => {
    fetchFeedbackEntries();
  }, [fetchFeedbackEntries]);

  const handleOpenModal = (feedback = null) => {
    setViewingFeedback(feedback);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setViewingFeedback(null);
    setIsModalOpen(false);
  };

  const handleUpdateFeedbackStatus = async (feedbackId, newStatus) => {
    try {
      await feedbackAPI.updateFeedbackStatus(restaurantId, feedbackId, newStatus);
      toast.success(`Feedback status updated to ${newStatus}!`);
      fetchFeedbackEntries();
      if (viewingFeedback?._id === feedbackId) {
          setViewingFeedback(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update feedback status.');
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (window.confirm('Are you sure you want to delete this feedback entry? This action cannot be undone.')) {
      try {
        await feedbackAPI.deleteFeedback(restaurantId, feedbackId);
        toast.success('Feedback entry deleted successfully!');
        fetchFeedbackEntries();
      } catch (err) {
        toast.error(err.message || 'Failed to delete feedback entry.');
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <FeedbackManagementContainer>
      <ActionBar>
        <h3>Customer Feedback</h3>
        <SearchContainer>
          <SearchIcon><FaSearch /></SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search feedback by customer name or comment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchContainer>
        <FilterGroup>
            <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                title="Filter by Status"
            >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
            </select>
            <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                title="Filter by Rating"
            >
                <option value="">All Ratings</option>
                {[1, 2, 3, 4, 5].map(rating => <option key={rating} value={rating}>{rating} Stars</option>)}
            </select>
            <Button variant="outline" onClick={fetchFeedbackEntries} disabled={loading}><SpinningFaSync /> Refresh</Button>
        </FilterGroup>
      </ActionBar>

      <FeedbackGrid>
        {feedbackEntries.length > 0 ? (
          feedbackEntries.map((feedback) => (
            <FeedbackCard key={feedback._id} $status={feedback.status}>
              <span className="status-badge" $status={feedback.status}>{feedback.status}</span>
              <h4>Feedback from {feedback.customerName || 'Anonymous'}</h4>
              <div className="feedback-meta">
                <span><FaCalendarAlt /> {new Date(feedback.createdAt).toLocaleDateString()}</span>
                {feedback.tableNumber && <span><FaTable /> Table {feedback.tableNumber}</span>}
                {feedback.customerEmail && <span><FaEnvelope /> {feedback.customerEmail}</span>}
              </div>
              <div className="rating">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} color={i < feedback.rating ? '#FFC107' : '#e4e5e9'} />
                ))} ({feedback.rating})
              </div>
              {feedback.comment && <p className="comment">{feedback.comment}</p>}
              <div className="actions">
                <Button variant="secondary" size="sm" onClick={() => handleOpenModal(feedback)}><FaCommentDots /> View</Button>
                <Button variant="danger" size="sm" onClick={() => handleDeleteFeedback(feedback._id)}><FaTrash /></Button>
              </div>
            </FeedbackCard>
          ))
        ) : (
          <p>No feedback entries found. Encourage your customers to share their thoughts!</p>
        )}
      </FeedbackGrid>

      {isModalOpen && (
        <FeedbackModal
          restaurantId={restaurantId}
          feedbackEntry={viewingFeedback}
          onClose={handleCloseModal}
          onUpdateStatus={handleUpdateFeedbackStatus}
          onDelete={handleDeleteFeedback}
        />
      )}
    </FeedbackManagementContainer>
  );
};

export default FeedbackManagement;