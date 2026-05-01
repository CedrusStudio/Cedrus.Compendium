'use client';

import { useState } from 'react';
import { Settings, Key, X, Check } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/common/components/ui/dialog';
import { Input } from '@/common/components/ui/input';
import { Label } from '@/common/components/ui/label';
import { useApiKey } from '@/common/hooks/useApiKey';

export function ApiKeySettings() 
{
  const { apiKey, hasApiKey, saveApiKey, removeApiKey } = useApiKey();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => 
  {
    if (inputValue.trim()) 
    {
      saveApiKey(inputValue);
      setInputValue('');
      setOpen(false);
    }
  };

  const handleRemove = () =>
  {
    removeApiKey();
    setInputValue('');
    setShowKey(false);
  };

  const handleOpenChange = (newOpen: boolean) => 
  {
    setOpen(newOpen);
    if (newOpen && apiKey) 
    {
      setInputValue(apiKey);
    } 
    else if (!newOpen) 
    {
      setInputValue('');
      setShowKey(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>

      <DialogTrigger asChild>
        <Button 
          variant={hasApiKey ? "default" : "outline"}
          className="gap-2"
        >
          {
            hasApiKey ? (
              <>
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">API Key Set</span>
              </>
            ) : (
              <>
                <Key className="h-4 w-4" />
                <span className="hidden sm:inline">Set API Key</span>
              </>
            )
          }
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            API Key Settings
          </DialogTitle>
          
          <DialogDescription>
            Configure your API key for write operations.
            Read operations (GET, POST search) do not require authentication.
          </DialogDescription>

        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            
            <Label htmlFor="api-key">API Key</Label>

            <div className="flex gap-2">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                placeholder="Enter your API key..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1"
              />

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? '🙈' : '👁️'}
              </Button>

            </div>

            {
              hasApiKey && (
                <p className="text-xs text-green-600 dark:text-green-400">
                    ✓ API key is currently set
                </p>
              )
            }
          </div>

          {
            hasApiKey && (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 p-3 text-sm">
                <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">⚠️ Security Note</p>

                <p className="text-yellow-700 dark:text-yellow-300">
                  Your API key is stored in browser localStorage. Clear it if you&apos;re on a shared computer.
                </p>
              </div>
            )
          } 
        </div>

        <DialogFooter className="gap-2">
          {
            hasApiKey && (
              <Button type="button" variant="destructive" onClick={handleRemove}>
                <X className="h-4 w-4 mr-2" />
                Remove Key
              </Button>
            )
          }
          
          <Button type="button" onClick={handleSave} disabled={!inputValue.trim()}>
            <Check className="h-4 w-4 mr-2" />
            Save Key
          </Button>

        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
