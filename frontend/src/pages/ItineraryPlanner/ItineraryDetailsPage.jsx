import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useItinerary } from '../../context/ItineraryContext';
import ItineraryDay from '../../components/ItineraryPlanner/ItineraryDay';
import { FaCalendarAlt, FaMoneyBillWave, FaUsers, FaPrint, FaSave, FaEdit, FaPlusCircle, FaHotel, FaExternalLinkAlt } from 'react-icons/fa';
import axios from 'axios';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';
import './ItineraryDetailsPage.css';

const ItineraryDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchItinerary, saveItinerary } = useItinerary();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDay, setActiveDay] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [customName, setCustomName] = useState('');
  const [showCustomNameInput, setShowCustomNameInput] = useState(false);
  const [hotelLink, setHotelLink] = useState(null);

  // Handle saving the itinerary to user account
  const handleSaveItinerary = async () => {
    if (isSaving || !itinerary) return;
    
    try {
      setIsSaving(true);
      const name = customName || itinerary.name;
      const savedItinerary = await saveItinerary(itinerary._id, name);
      
      if (savedItinerary) {
      
        setShowCustomNameInput(false);
        setSaveSuccess(true);
        // Update the itinerary in state to reflect changes
        setItinerary(savedItinerary);
        // No navigation, just show success state
      }
    } catch (err) {
      setError('Failed to save itinerary');
    } finally {
      setIsSaving(false);
    }
  };
  
  useEffect(() => {
    const getItinerary = async () => {
      try {
        setLoading(true);
        const data = await fetchItinerary(id);
        if (data) {
          setItinerary(data);
          
          // Fetch hotel link if hotel data exists
          if (data.hotel && data.hotel.place) {
            findHotelLink(data.hotel.place);
          }
        } else {
          setError('Itinerary not found');
        }
      } catch (err) {
        setError('Failed to load itinerary');
      } finally {
        setLoading(false);
      }
    };

    getItinerary();
  }, [id, fetchItinerary]);
  
  // Helper function to find hotel ID by name
  const findHotelLink = async (hotelName) => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await axios.get(`${apiBaseUrl}/hotels/search?name=${encodeURIComponent(hotelName)}`);
      
      if (response.data.data && response.data.data.length > 0) {
        setHotelLink({
          id: response.data.data[0]._id,
          type: 'hotels'
        });
      }
    } catch (error) {
      console.error('Error fetching hotel details:', error);
    }
  };

  if (loading) {
    return (
      <div className="itinerary-loading">
        <div className="spinner"></div>
        <p>Loading your personalized itinerary...</p>
        <p className="loading-subtitle">Crafting your perfect adventure</p>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="itinerary-error">
        <div className="error-icon">😕</div>
        <h2>Oops! Something went wrong</h2>
        <p>{error || 'Unable to load itinerary'}</p>
        <Link to="/itinerary-planner" className="try-again-btn">
          <FaPlusCircle /> Create a New Itinerary
        </Link>
      </div>
    );
  }

  return (
    <div className="itinerary-details-page">
      <div className="itinerary-header">
        <div className="itinerary-title-wrapper">
          <h1>{itinerary.name}</h1>
          <div className="destination-badge">
            {itinerary.destination || 'Custom Trip'}
          </div>
        </div>
        
        <div className="itinerary-meta">
          <div className="meta-item">
            <FaCalendarAlt />
            <span>{itinerary.duration} days</span>
          </div>
          <div className="meta-item">
            <FaMoneyBillWave />
            <span>{itinerary.budget} budget</span>
          </div>
          <div className="meta-item">
            <FaUsers />
            <span>{itinerary.travelersType}</span>
          </div>
        </div>
      </div>
      
      {itinerary.hotel && (
        <div className="itinerary-hotel-section">
          <div className="section-header">
            <FaHotel className="section-icon" />
            <h2>Your Accommodation</h2>
          </div>
          <div className="hotel-card">
            <h3>
              {itinerary.hotel.place}
              {hotelLink && (
                <Link to={`/${hotelLink.type}/${hotelLink.id}`} className="item-link">
                  <FaExternalLinkAlt className="link-icon" />
                </Link>
              )}
            </h3>
            <p>{itinerary.hotel.description}</p>
            {hotelLink && (
              <div className="hotel-link-container">
                <Link to={`/${hotelLink.type}/${hotelLink.id}`} className="view-hotel-details">
                  View Hotel Details
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="day-navigation">
        <h2 className="section-title">Daily Schedule</h2>
        <div className="day-selector">
          {Array.from({ length: itinerary.duration }, (_, i) => (
            <button
              key={i + 1}
              className={`day-button ${activeDay === i + 1 ? 'active' : ''}`}
              onClick={() => setActiveDay(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
      
      <div className="itinerary-content">
        {itinerary.days.map((day) => (
          <div
            key={day.day}
            className={`day-content ${day.day === activeDay ? 'active' : ''}`}
          >
            {day.day === activeDay && <ItineraryDay day={day} />}
          </div>
        ))}
      </div>
      
      <div className="itinerary-actions-wrapper">
        <div className="itinerary-actions">
          <Link to="/itinerary-planner" className="new-itinerary-btn">
            <FaPlusCircle className="btn-icon" />
            <span>Create New Itinerary</span>
          </Link>
          
          {itinerary.isTemporary && (
            <div className="save-itinerary-container">
              {showCustomNameInput ? (
                <div className="custom-name-input">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter custom name (optional)"
                    maxLength={50}
                  />
                  <div className="input-actions">
                    <button 
                      className={`save-with-name-btn ${isSaving ? 'saving-btn' : ''}`}
                      onClick={handleSaveItinerary}
                      disabled={isSaving || saveSuccess}
                    >
                      <FaSave className="btn-icon" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button 
                      className="cancel-btn" 
                      onClick={() => setShowCustomNameInput(false)}
                      disabled={isSaving || saveSuccess}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="save-options">
                  <button 
                    className={`custom-name-btn ${saveSuccess ? 'saved-btn' : ''}`}
                    onClick={() => !saveSuccess && setShowCustomNameInput(true)}
                    disabled={isSaving || saveSuccess}
                  >
                    {saveSuccess ? (
                      <>
                        <FaSave className="btn-icon" />
                        Saved
                      </>
                    ) : (
                      <>
                        <FaEdit className="btn-icon" />
                        Save Itinerary
                      </>
                    )}
                  </button>
                  {saveSuccess && (
                    <div className="save-success-message">
                      <FaSave className="success-icon" />
                      Your itinerary has been saved successfully!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <button className="print-itinerary-btn" onClick={() => window.print()}>
            <FaPrint className="btn-icon" />
            <span>Print Itinerary</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItineraryDetailsPage;
