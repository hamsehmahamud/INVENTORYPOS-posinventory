'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
    role: 'user' | 'model';
    content: string;
}

export default function AISupportPage() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', content: 'Hello! I am your Maareye AI Support Assistant. How can I help you today?' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            // Call the Genkit flow via the API route
            // Note: The path depends on how Genkit is mounted. Usually /api/genkit/flowName
            const response = await fetch('/api/genkit/supportFlow', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: { question: userMessage } }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch response');
            }

            const result = await response.json();
            // Genkit response structure: { result: "Answer text" }
            const aiResponse = result.result;

            setMessages(prev => [...prev, { role: 'model', content: aiResponse }]);
        } catch (error) {
            console.error('Error calling AI:', error);
            setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I encountered an error. Please try again later.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4 md:p-8 max-w-4xl mx-auto w-full">
            <Card className="flex-1 flex flex-col shadow-lg border-primary/10">
                <CardHeader className="border-b bg-muted/30">
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="w-6 h-6 text-primary" />
                        AI Support Assistant
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''
                                        }`}
                                >
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                            }`}
                                    >
                                        {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                    </div>
                                    <div
                                        className={`p-3 rounded-lg max-w-[80%] text-sm ${msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted/50 border'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/50 border">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>
                    <div className="p-4 border-t bg-background">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask a question about the system..."
                                disabled={isLoading}
                                className="flex-1"
                            />
                            <Button type="submit" disabled={isLoading || !input.trim()}>
                                <Send className="w-4 h-4" />
                                <span className="sr-only">Send</span>
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
