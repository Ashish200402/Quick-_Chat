import React from "react";

const TypingIndicator = ({ userName }) => {
  return (
    <div className="typing-indicator-container">
      <div className="typing-indicator">
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
      </div>
      <span className="typing-text">
        {userName ? `${userName} is typing` : "typing"}
      </span>
    </div>
  );
};

export default TypingIndicator;
