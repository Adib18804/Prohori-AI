"""
Optional ML Classifier for additional risk scoring
Provides lightweight ML signal alongside LLM-based analysis
"""

from typing import Dict, Any, Optional
import structlog
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import pickle
import os

logger = structlog.get_logger(__name__)


class MLClassifier:
    """
    Lightweight ML classifier for risk scoring
    
    Uses TF-IDF + Logistic Regression for fast predictions
    NOT meant to replace LLM agents, only to provide additional signal
    """
    
    def __init__(self, model_path: Optional[str] = None):
        self.vectorizer = None
        self.classifier = None
        self.trained = False
        self.model_path = model_path or "ml_model.pkl"
        
        # Try to load existing model
        self.load_model()
    
    def train(self, texts: list, labels: list):
        """
        Train classifier on labeled data
        
        Args:
            texts: List of prompts
            labels: List of labels (0=benign, 1=malicious)
        """
        logger.info("Training ML classifier", examples=len(texts))
        
        # Create TF-IDF vectorizer
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            ngram_range=(1, 3),
            stop_words='english'
        )
        
        # Transform texts
        X = self.vectorizer.fit_transform(texts)
        
        # Train classifier
        self.classifier = LogisticRegression(
            class_weight='balanced',
            max_iter=1000
        )
        self.classifier.fit(X, labels)
        
        self.trained = True
        
        # Save model
        self.save_model()
        
        logger.info("ML classifier trained successfully")
    
    def predict(self, text: str) -> Dict[str, Any]:
        """
        Predict risk score for text
        
        Returns:
            {
                "risk_score": float (0.0-1.0),
                "is_malicious": bool,
                "confidence": float
            }
        """
        if not self.trained:
            logger.warning("ML classifier not trained, returning neutral score")
            return {
                "risk_score": 0.5,
                "is_malicious": False,
                "confidence": 0.0,
                "model": "untrained"
            }
        
        try:
            # Vectorize input
            X = self.vectorizer.transform([text])
            
            # Get prediction probability
            proba = self.classifier.predict_proba(X)[0]
            risk_score = proba[1]  # Probability of malicious class
            
            # Get prediction
            prediction = self.classifier.predict(X)[0]
            
            return {
                "risk_score": float(risk_score),
                "is_malicious": bool(prediction),
                "confidence": float(max(proba)),
                "model": "tfidf_logistic_regression"
            }
        
        except Exception as e:
            logger.error("ML prediction failed", exc_info=e)
            return {
                "risk_score": 0.5,
                "is_malicious": False,
                "confidence": 0.0,
                "error": str(e)
            }
    
    def save_model(self):
        """Save trained model to disk"""
        try:
            with open(self.model_path, 'wb') as f:
                pickle.dump({
                    'vectorizer': self.vectorizer,
                    'classifier': self.classifier
                }, f)
            logger.info("ML model saved", path=self.model_path)
        except Exception as e:
            logger.error("Failed to save ML model", exc_info=e)
    
    def load_model(self):
        """Load trained model from disk"""
        if not os.path.exists(self.model_path):
            logger.info("No existing ML model found")
            return
        
        try:
            with open(self.model_path, 'rb') as f:
                data = pickle.load(f)
                self.vectorizer = data['vectorizer']
                self.classifier = data['classifier']
                self.trained = True
            logger.info("ML model loaded", path=self.model_path)
        except Exception as e:
            logger.error("Failed to load ML model", exc_info=e)


# Global classifier instance
_classifier_instance = None

def get_classifier() -> MLClassifier:
    """Get global ML classifier instance"""
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = MLClassifier()
    return _classifier_instance