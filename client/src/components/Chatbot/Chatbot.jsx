import React, { useState, useEffect, useRef } from 'react';
import './Chatbot.css';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Xin chào! Tôi là Trợ lý ảo FX Fitness. Tôi có thể hỗ trợ gì cho hành trình rèn luyện sức khỏe của bạn hôm nay?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when new message arrives or typing state changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userMessageText = inputText.trim();
    setInputText('');

    // Add user message to list
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userMessageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Map message history to send to backend (limit to last 6 messages)
      const chatHistory = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessageText,
          history: chatHistory
        })
      });

      const data = await response.json();
      setIsTyping(false);

      if (response.ok && data.response) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: data.response,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: 'Xin lỗi, tôi gặp chút trục trặc khi kết nối hệ thống. Bạn vui lòng thử lại sau nhé!',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (error) {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra đường truyền mạng!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to format bot responses supporting **bold** text and linebreaks
  const renderMessageText = (text) => {
    return text.split('\n').map((line, index) => {
      let formattedLine = line;
      // Convert Markdown **bold** to HTML <strong>
      const boldRegex = /\*\*(.*?)\*\*/g;
      formattedLine = line.replace(boldRegex, '<strong>$1</strong>');
      return (
        <div key={index} dangerouslySetInnerHTML={{ __html: formattedLine }} className="message-line" />
      );
    });
  };

  return (
    <div className="chatbot-wrapper">
      {/* FLOATING ACTION BUTTON (FAB) */}
      <button 
        className={`chatbot-fab ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Trò chuyện với Trợ lý ảo"
      >
        <img 
          src="/iconchatbot.png" 
          alt="Chatbot Icon" 
          className="chatbot-fab-img" 
        />
        {!isOpen && <span className="chatbot-tooltip">Trợ lý AI</span>}
      </button>

      {/* CHAT WINDOW */}
      <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar-container">
              <img src="/iconchatbot.png" alt="Bot Avatar" className="chatbot-header-avatar" />
              <span className="chatbot-online-indicator"></span>
            </div>
            <div className="chatbot-header-text">
              <h3>Trợ lý ảo FX AI</h3>
              <p>Sẵn sàng hỗ trợ 24/7</p>
            </div>
          </div>
          <button 
            className="chatbot-close-btn" 
            onClick={() => setIsOpen(false)}
            title="Đóng chat"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Message List */}
        <div className="chatbot-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chatbot-message-bubble ${msg.sender}`}>
              <div className="message-content">
                {msg.sender === 'bot' ? renderMessageText(msg.text) : msg.text}
              </div>
              <span className="message-time">{msg.time}</span>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="chatbot-message-bubble bot typing">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="chatbot-input-area">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Nhập câu hỏi của bạn tại đây..."
            rows="1"
            required
          />
          <button type="submit" className="chatbot-send-btn" disabled={!inputText.trim()}>
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chatbot;
