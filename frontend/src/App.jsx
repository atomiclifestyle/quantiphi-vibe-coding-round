import React, { useState, useEffect } from 'react';
import './index.css';
import {
  AlertTriangle,
  Upload,
  ImageUp,
  Trash2,
} from "lucide-react";
import ImageScanner from './ImageScanner';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

export default function App() {
  const [data, setData] = useState(null);
  const [foodName, setFoodName] = useState('');
  const [foodWeight, setFoodWeight] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/dashboard`)
      .then(res => res.json())
      .then(setData);
  }, []);

const handleUpdate = async (request) => {
    setErrorMsg(''); 
    
    try {
      const res = await request();
      if (!res.ok) {
        const errorData = await res.json();
        setErrorMsg(errorData.error || 'An error occurred.');
        return;
      }
      
      const newData = await res.json();
      
      if (newData.isExceeded && (!data || !data.isExceeded)) {
        setShowWarning(true);
      }
      setData(newData);
    } catch (err) {
      setErrorMsg('Network error. Is the server running?');
    }
  };

  const handleGoalChange = (goal) => {
    handleUpdate(() => fetch(`${API_BASE}/goal`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal })
    }));
  };

  const handleManualAdd = (e) => {
    e.preventDefault();
    handleUpdate(() => fetch(`${API_BASE}/meals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: foodName, weight: Number(foodWeight) })
    }));
    setFoodName(''); setFoodWeight('');
  };

  const handleScanImage = () => {
    handleUpdate(() => fetch(`${API_BASE}/meals/scan`, { method: 'POST' }));
  };

  const handleDelete = (id) => {
    handleUpdate(() => fetch(`${API_BASE}/meals/${id}`, { method: 'DELETE' }));
  };

  const handleAutofillFromScan = (scannedData) => {
    setFoodName(scannedData.name);
    setFoodWeight(scannedData.weight);
  };

  if (!data) return <div className="container">Loading dashboard...</div>;

  const getPercent = (consumed, budget) => Math.min((consumed / budget) * 100, 100);
  const calPercent = getPercent(data.consumed.calories, data.budget.calories);
  const barColor = data.isExceeded ? 'var(--danger-color)' : 'var(--safe-color)';

  return (
    <div className="container">
      
      <div className="goal-toggle">
        {['Weight Loss', 'Maintenance', 'Muscle Gain'].map(goal => (
          <button 
            key={goal}
            className={data.goal === goal ? 'active' : ''}
            onClick={() => handleGoalChange(goal)}
          >
            {goal}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="progress-header">
          <span>Daily Calories</span>
          <span style={{ color: data.isExceeded ? 'var(--danger-color)' : 'inherit' }}>
            {data.consumed.calories} / {data.budget.calories} kcal
          </span>
        </div>
        <div className="progress-track">
          <div 
            className="progress-fill" 
            style={{ width: `${calPercent}%`, backgroundColor: barColor }} 
          />
        </div>

        <div className="macros">
          <div>
            <div className="progress-header" style={{fontSize: '0.8rem'}}>Protein</div>
            <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{data.consumed.protein}g / {data.budget.protein}g</div>
            <div className="macro-track">
              <div className="progress-fill" style={{ width: `${getPercent(data.consumed.protein, data.budget.protein)}%`, backgroundColor: 'var(--macro-protein)' }} />
            </div>
          </div>
          <div>
            <div className="progress-header" style={{fontSize: '0.8rem'}}>Carbs</div>
            <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{data.consumed.carbs}g / {data.budget.carbs}g</div>
            <div className="macro-track">
              <div className="progress-fill" style={{ width: `${getPercent(data.consumed.carbs, data.budget.carbs)}%`, backgroundColor: 'var(--macro-carbs)' }} />
            </div>
          </div>
          <div>
            <div className="progress-header" style={{fontSize: '0.8rem'}}>Fats</div>
            <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{data.consumed.fats}g / {data.budget.fats}g</div>
            <div className="macro-track">
              <div className="progress-fill" style={{ width: `${getPercent(data.consumed.fats, data.budget.fats)}%`, backgroundColor: 'var(--macro-fats)' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{marginBottom: '1rem'}}>Log a Meal</h3>
        {errorMsg && (
          <div style={{ color: 'var(--danger-color)', fontSize: '0.9rem', marginBottom: '1rem', padding: '0.5rem', background: '#fee2e2', borderRadius: '6px' }}>
            {errorMsg} Try: chicken breast, white rice, broccoli, salmon, egg, or apple.
          </div>
        )}
        <form onSubmit={handleManualAdd} className="input-group">
          <input 
            type="text" 
            placeholder="Food (e.g., chicken breast)" 
            value={foodName} 
            onChange={(e) => setFoodName(e.target.value)} 
            required 
          />
          <input 
            type="number" 
            placeholder="Weight (g)" 
            style={{maxWidth: '120px'}}
            value={foodWeight} 
            onChange={(e) => setFoodWeight(e.target.value)} 
            required 
            min="1"
          />
          <button type="submit" className="primary">Add</button>
        </form>
        <ImageScanner onAutofill={handleAutofillFromScan} />
      </div>

      <div className="card">
        <h3 style={{marginBottom: '1rem'}}>Today's Meals</h3>
        {data.meals.length === 0 ? (
          <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>No meals logged yet.</p>
        ) : (
          data.meals.map(meal => (
            <div key={meal.id} className="meal-item">
              <div className="meal-info">
                <h4>{meal.name} <span style={{fontWeight: 'normal', color: 'var(--text-muted)'}}>({meal.weight}g)</span></h4>
                <p>{meal.calories} kcal • P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fats}g</p>
              </div>
              <button className="delete-btn" onClick={() => handleDelete(meal.id)}>
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>

      {showWarning && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2><AlertTriangle size={20} /> Alert</h2>
            <p>Daily Budget Exceeded!</p>
            <button className="primary" style={{width: '100%'}} onClick={() => setShowWarning(false)}>
              Acknowledge
            </button>
          </div>
        </div>
      )}

    </div>
  );
}