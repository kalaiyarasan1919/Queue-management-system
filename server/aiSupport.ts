import { z } from 'zod';

export interface SupportQuery {
  id: string;
  userId: string;
  query: string;
  response: string;
  category: 'booking' | 'technical' | 'general' | 'pwd' | 'refund';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'resolved' | 'escalated';
  createdAt: Date;
  resolvedAt?: Date;
  tags: string[];
}

export interface AIResponse {
  response: string;
  confidence: number;
  suggestedActions: string[];
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requiresHuman: boolean;
}

export class AISupportService {
  private knowledgeBase = {
    booking: {
      patterns: [
        'how to book', 'book appointment', 'booking process', 'schedule', 'time slot',
        'available slots', 'book again', 'reschedule', 'cancel booking', 'appointment',
        'book', 'booking', 'schedule appointment', 'make appointment', 'get appointment'
      ],
      responses: [
        'To book an appointment, select your department, choose a service, pick a date, and select from 3 available time slots.',
        'You can book appointments through our online portal. Select your preferred department and service, then choose from available time slots.',
        'Booking is simple: 1) Choose department 2) Select service 3) Pick date 4) Choose time slot 5) Submit booking.'
      ]
    },
    technical: {
      patterns: [
        'not working', 'error', 'bug', 'broken', 'issue', 'problem', 'login', 'password',
        'website down', 'slow', 'loading', 'crash', 'freeze'
      ],
      responses: [
        'I understand you\'re experiencing technical issues. Please try refreshing the page or clearing your browser cache.',
        'For technical problems, please try: 1) Refresh the page 2) Clear browser cache 3) Try a different browser 4) Check your internet connection.',
        'If the issue persists, please provide more details about the error message you\'re seeing.'
      ]
    },
    pwd: {
      patterns: [
        'disability', 'pwd', 'wheelchair', 'accessibility', 'special needs', 'certificate',
        'priority', 'disabled', 'handicap', 'mobility', 'pwd priority', 'disability priority'
      ],
      responses: [
        'For PwD (Persons with Disabilities) support, you can upload your disability certificate during booking to get priority service.',
        'PwD users get priority in the queue. Upload your disability certificate when booking to receive special treatment.',
        'We provide priority service for disabled citizens. Please upload your disability certificate for faster processing.'
      ]
    },
    general: {
      patterns: [
        'what is', 'how does', 'explain', 'information', 'help', 'support', 'contact',
        'office hours', 'location', 'address', 'phone', 'email'
      ],
      responses: [
        'eQueue is a smart token generator for government services. It helps you book appointments and manage your queue position digitally.',
        'Our system provides digital queue management for various government departments like RTO, Municipal, Aadhar, and more.',
        'You can track your appointment status, receive email notifications, and get priority service if you\'re a PwD citizen.'
      ]
    },
    refund: {
      patterns: [
        'refund', 'money back', 'payment', 'charge', 'billing', 'cost', 'fee', 'paid',
        'pay', 'money', 'cost', 'free', 'no fee', 'no charge', 'price', 'cost money'
      ],
      responses: [
        'Our services are free of charge. There are no fees for booking appointments through eQueue.',
        'eQueue is a free service provided by the government. No payment is required for booking appointments.',
        'All our services are completely free. You don\'t need to pay anything to book or use our services.'
      ]
    }
  };

  private escalationKeywords = [
    'urgent', 'emergency', 'immediately', 'asap', 'critical', 'serious',
    'complaint', 'unhappy', 'dissatisfied', 'angry', 'frustrated'
  ];

  analyzeQuery(query: string): AIResponse {
    const normalizedQuery = query.toLowerCase().trim();
    console.log('🤖 Analyzing query:', normalizedQuery);
    
    // Determine category
    let category = 'general';
    let confidence = 0.1;
    
    for (const [cat, data] of Object.entries(this.knowledgeBase)) {
      const matches = data.patterns.filter(pattern => 
        normalizedQuery.includes(pattern)
      ).length;
      
      console.log(`Category ${cat}: ${matches} matches out of ${data.patterns.length} patterns`);
      
      if (matches > 0) {
        const newConfidence = Math.max(0.6, matches / data.patterns.length);
        if (newConfidence > confidence) {
          category = cat;
          confidence = newConfidence;
          console.log(`✅ Selected category: ${cat} with confidence: ${newConfidence}`);
        }
      }
    }

    // Check for escalation keywords
    const hasEscalationKeywords = this.escalationKeywords.some(keyword => 
      normalizedQuery.includes(keyword)
    );

    // Determine priority
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    if (hasEscalationKeywords) {
      priority = 'urgent';
    } else if (confidence > 0.8) {
      priority = 'low';
    } else if (confidence > 0.6) {
      priority = 'medium';
    } else {
      priority = 'high';
    }

    // Generate response
    const categoryData = this.knowledgeBase[category as keyof typeof this.knowledgeBase];
    const response = this.generateResponse(normalizedQuery, categoryData, confidence);
    
    // Generate suggested actions
    const suggestedActions = this.generateSuggestedActions(category, normalizedQuery);

    return {
      response,
      confidence,
      suggestedActions,
      category,
      priority,
      requiresHuman: confidence < 0.3 || hasEscalationKeywords || priority === 'urgent'
    };
  }

  private generateResponse(query: string, categoryData: any, confidence: number): string {
    if (confidence < 0.3) {
      return "I'm not sure I understand your question completely. Could you please provide more details? I'm here to help with booking appointments, technical issues, or general questions about our services.";
    }

    // Select appropriate response
    const responses = categoryData.responses;
    const responseIndex = Math.floor(Math.random() * responses.length);
    let response = responses[responseIndex];

    // Add personalized touches based on query content
    if (query.includes('thank') || query.includes('thanks')) {
      response = "You're welcome! " + response;
    }

    if (query.includes('urgent') || query.includes('asap')) {
      response = "I understand this is urgent. " + response + " If you need immediate assistance, please contact our support team directly.";
    }

    return response;
  }

  private generateSuggestedActions(category: string, query: string): string[] {
    const actions: string[] = [];

    switch (category) {
      case 'booking':
        actions.push('View available time slots', 'Check booking status', 'Reschedule appointment');
        if (query.includes('pwd') || query.includes('disability')) {
          actions.push('Upload disability certificate', 'Learn about PwD priority');
        }
        break;
      case 'technical':
        actions.push('Clear browser cache', 'Try different browser', 'Check internet connection');
        actions.push('Report technical issue', 'Contact technical support');
        break;
      case 'pwd':
        actions.push('Upload disability certificate', 'Learn about priority service', 'Contact PwD support');
        break;
      case 'general':
        actions.push('Browse departments', 'View services', 'Check office hours', 'Contact support');
        break;
      case 'refund':
        actions.push('Learn about free services', 'Contact billing support', 'Check payment history');
        break;
    }

    // Add common actions
    actions.push('View FAQ', 'Contact human support', 'Submit feedback');

    return actions.slice(0, 4); // Limit to 4 actions
  }

  generateFAQ(): Array<{question: string, answer: string, category: string}> {
    return [
      {
        question: "How do I book an appointment?",
        answer: "Select your department, choose a service, pick a date, and select from 3 available time slots. The system will show you the best available options.",
        category: "booking"
      },
      {
        question: "Is there a fee for booking appointments?",
        answer: "No, all our services are completely free. eQueue is a free government service.",
        category: "refund"
      },
      {
        question: "How do I get priority service as a disabled person?",
        answer: "Upload your disability certificate during booking. PwD citizens get priority in the queue and faster service.",
        category: "pwd"
      },
      {
        question: "Can I reschedule my appointment?",
        answer: "Yes, you can reschedule through your dashboard. Look for the 'Reschedule' option next to your appointment.",
        category: "booking"
      },
      {
        question: "What if I miss my appointment?",
        answer: "If you miss your appointment, you'll need to book a new slot. We recommend arriving 10 minutes early.",
        category: "booking"
      },
      {
        question: "How do I know when my turn is coming?",
        answer: "You'll receive email notifications 15 minutes before your turn. You can also check the live queue status on our website.",
        category: "general"
      },
      {
        question: "What documents do I need to bring?",
        answer: "Bring a valid ID proof and any documents specific to your service. Check the service description for detailed requirements.",
        category: "general"
      },
      {
        question: "The website is not working properly",
        answer: "Try refreshing the page, clearing your browser cache, or using a different browser. If the problem persists, contact our technical support.",
        category: "technical"
      }
    ];
  }

  generateEscalationMessage(query: string, priority: string): string {
    const templates = {
      urgent: "🚨 URGENT SUPPORT REQUEST\n\nQuery: {query}\nPriority: {priority}\n\nThis requires immediate human attention. Please respond within 15 minutes.",
      high: "⚠️ HIGH PRIORITY SUPPORT REQUEST\n\nQuery: {query}\nPriority: {priority}\n\nPlease respond within 1 hour.",
      medium: "📋 SUPPORT REQUEST\n\nQuery: {query}\nPriority: {priority}\n\nPlease respond within 4 hours."
    };

    const template = templates[priority as keyof typeof templates] || templates.medium;
    return template.replace('{query}', query).replace('{priority}', priority);
  }
}

export const aiSupportService = new AISupportService();

// Schema for support queries
export const supportQuerySchema = z.object({
  query: z.string().min(1, "Query is required"),
  userId: z.string().optional(),
  category: z.enum(['booking', 'technical', 'general', 'pwd', 'refund']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

export type SupportQueryData = z.infer<typeof supportQuerySchema>;
