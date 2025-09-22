import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  User, 
  Send, 
  X, 
  Minimize2, 
  MessageCircle,
  CheckCircle,
  AlertCircle
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

export function FloatingAISupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  const quickQuestions = [
    "How to book appointment?",
    "What is PwD priority?",
    "How to reschedule?",
    "Is it free?"
  ];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 bg-primary hover:bg-primary/90"
          size="lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-96 z-50">
          <Card className="h-full flex flex-col shadow-2xl border-2">
            <CardHeader className="pb-3 bg-primary text-primary-foreground rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Bot className="w-4 h-4" />
                  AI Support
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
                  >
                    <Minimize2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {!isMinimized && (
              <>
                <CardContent className="flex-1 p-0 flex flex-col">
                  <ScrollArea className="flex-1 p-3">
                    <div className="space-y-3">
                      {messages.length === 0 && (
                        <div className="text-center py-4">
                          <Bot className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-3">
                            Hi! I'm your AI assistant. How can I help you today?
                          </p>
                          <div className="space-y-2">
                            {quickQuestions.map((question, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="w-full text-xs h-8"
                                onClick={() => setInputValue(question)}
                              >
                                {question}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg p-2 text-xs ${
                              message.type === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <div className="flex items-start gap-1">
                              {message.type === 'ai' && (
                                <Bot className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              )}
                              {message.type === 'user' && (
                                <User className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <p className="text-xs leading-relaxed">{message.content}</p>
                                
                                {message.type === 'ai' && (
                                  <div className="mt-1 space-y-1">
                                    {/* AI Response Metadata */}
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      {message.category && (
                                        <span className="flex items-center gap-1">
                                          {getCategoryIcon(message.category)}
                                        </span>
                                      )}
                                      {message.priority && (
                                        <Badge 
                                          variant="secondary" 
                                          className={`text-xs px-1 py-0 ${getPriorityColor(message.priority)}`}
                                        >
                                          {message.priority}
                                        </Badge>
                                      )}
                                      {message.confidence && (
                                        <span className="flex items-center gap-1">
                                          <CheckCircle className="w-2 h-2" />
                                          {Math.round(message.confidence * 100)}%
                                        </span>
                                      )}
                                      {message.requiresHuman && (
                                        <span className="flex items-center gap-1 text-orange-600">
                                          <AlertCircle className="w-2 h-2" />
                                          Human needed
                                        </span>
                                      )}
                                    </div>

                                    {/* Suggested Actions */}
                                    {message.suggestedActions && message.suggestedActions.length > 0 && (
                                      <div className="space-y-1">
                                        <div className="flex flex-wrap gap-1">
                                          {message.suggestedActions.slice(0, 2).map((action, index) => (
                                            <Button
                                              key={index}
                                              variant="outline"
                                              size="sm"
                                              className="text-xs h-5 px-2"
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
                          <div className="bg-muted rounded-lg p-2">
                            <div className="flex items-center gap-1">
                              <Bot className="w-3 h-3" />
                              <div className="flex space-x-1">
                                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"></div>
                                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="p-3 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything..."
                        disabled={isLoading}
                        className="flex-1 text-xs h-8"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Send className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
