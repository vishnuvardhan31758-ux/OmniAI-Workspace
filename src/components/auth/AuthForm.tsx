import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { Sparkles } from 'lucide-react';

interface AuthFormProps {
  onSuccess: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const { signUp } = useAuth();

  // Handle cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const interval = setInterval(() => {
        setCooldownSeconds(prev => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [cooldownSeconds]);

  const parseCooldownFromError = (errorMessage: string): number => {
    // Extract seconds from messages like "you can only request this after 51 seconds"
    const match = errorMessage.match(/after (\d+) seconds/);
    return match ? parseInt(match[1], 10) : 60; // Default to 60 seconds if parsing fails
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signUp(email, password, fullName);

      if (result.error) {
        const errorMessage = result.error.message;
        setError(errorMessage);

        // Check if it's a rate limit error and set cooldown
        if (errorMessage.includes('over_email_send_rate_limit')) {
          const cooldownTime = parseCooldownFromError(errorMessage);
          setCooldownSeconds(cooldownTime);
        }
      } else {
        onSuccess();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || cooldownSeconds > 0;

  const getErrorMessage = () => {
    if (cooldownSeconds > 0) {
      return `Please wait ${cooldownSeconds} seconds before trying again due to rate limiting.`;
    }
    return error;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-bounce-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ContentAI</h1>
          <p className="text-gray-600">Create your account to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={fullName}
            onChange={setFullName}
            required
          />
          
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={setEmail}
            required
          />
          
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={setPassword}
            required
          />

          {(error || cooldownSeconds > 0) && (
            <div className={`p-3 border rounded-lg text-sm animate-fade-in ${
              cooldownSeconds > 0 
                ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                : 'bg-error-50 border-error-200 text-error-600'
            }`}>
              {getErrorMessage()}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={isDisabled}
          >
            {cooldownSeconds > 0 
              ? `Wait ${cooldownSeconds}s` 
              : 'Create Account'
            }
          </Button>
        </form>
      </Card>
    </div>
  );
}