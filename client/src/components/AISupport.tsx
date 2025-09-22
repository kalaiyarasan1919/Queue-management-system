import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  User, 
  Send, 
  HelpCircle, 
  MessageCircle, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Lightbulb,
  ExternalLink
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  confidence?: number;
  category?: string;
  priority?: string;
  suggestedActions?: string[];
  requiresHuman?: boolean;
}

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

interface SupportCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export function AISupport() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [faq, setFaq] = useState<FAQItem[]>([]);
  const [categories, setCategories] = useState<SupportCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFAQ, setShowFAQ] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFAQ();
    loadCategories();
    addWelcomeMessage();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'ai',
      content: "Hello! I'm your AI assistant for eQueue. I can help you with booking appointments, technical issues, PwD support, and general questions. How can I assist you today?",
      timestamp: new Date(),
      confidence: 1,
      category: 'general',
      suggestedActions: [
        'How to book an appointment',
        'Check my booking status',
        'PwD priority service',
        'Technical support'
      ]
    };
    setMessages([welcomeMessage]);
  };

  const loadFAQ = async () => {
    try {
      const response = await apiRequest('GET', '/api/support/faq');
      setFaq(response);
    } catch (error) {
      console.error('Error loading FAQ:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiRequest('GET', '/api/support/categories');
      setCategories(response);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/support/chat', {
        query: inputValue
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.response,
        timestamp: new Date(),
        confidence: response.confidence,
        category: response.category,
        priority: response.priority,
        suggestedActions: response.suggestedActions,
        requiresHuman: response.requiresHuman
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again or contact our support team.",
        timestamp: new Date(),
        confidence: 0,
        category: 'technical',
        priority: 'high'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestedAction = (action: string) => {
    setInputValue(action);
  };

  const handleFAQClick = (question: string) => {
    setInputValue(question);
    setShowFAQ(false);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'booking': return '📅';
      case 'technical': return '⚙️';
      case 'pwd': return '♿';
      case 'general': return 'ℹ️';
      case 'refund': return '💳';
      default: return '🤖';
    }
  };

  const filteredFAQ = selectedCategory 
    ? faq.filter(item => item.category === selectedCategory)
    : faq;

  return (
    <div className="h-[600px] flex flex-col">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            AI Support Assistant
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFAQ(!showFAQ)}
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              FAQ
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessages([...messages, {
                id: 'clear',
                type: 'ai',
                content: "Chat cleared. How can I help you?",
                timestamp: new Date()
              }])}
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.type === 'ai' && (
                          <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        )}
                        {message.type === 'user' && (
                          <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          
                          {message.type === 'ai' && (
                            <div className="mt-2 space-y-2">
                              {/* AI Response Metadata */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {message.category && (
                                  <span className="flex items-center gap-1">
                                    {getCategoryIcon(message.category)}
                                    {message.category}
                                  </span>
                                )}
                                {message.priority && (
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-xs ${getPriorityColor(message.priority)}`}
                                  >
                                    {message.priority}
                                  </Badge>
                                )}
                                {message.confidence && (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    {Math.round(message.confidence * 100)}% confident
                                  </span>
                                )}
                                {message.requiresHuman && (
                                  <span className="flex items-center gap-1 text-orange-600">
                                    <AlertCircle className="w-3 h-3" />
                                    Human support needed
                                  </span>
                                )}
                              </div>

                              {/* Suggested Actions */}
                              {message.suggestedActions && message.suggestedActions.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground">Quick actions:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {message.suggestedActions.map((action, index) => (
                                      <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-6"
                                        onClick={() => handleSuggestedAction(action)}
                                      >
                                        {action}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about eQueue..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* FAQ Sidebar */}
        {showFAQ && (
          <div className="w-80 border-l bg-muted/50">
            <div className="p-4 border-b">
              <h3 className="font-semibold mb-2">Frequently Asked Questions</h3>
              
              {/* Category Filter */}
              <div className="flex flex-wrap gap-1 mb-3">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs"
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="text-xs"
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
            
            <ScrollArea className="h-full p-4">
              <div className="space-y-3">
                {filteredFAQ.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-background rounded-lg border cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleFAQClick(item.question)}
                  >
                    <p className="font-medium text-sm mb-1">{item.question}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
