'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2, Mail, User, MessageSquare, Send, Lock, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface ContactUsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactUsModal({ open, onOpenChange }: ContactUsModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; email?: string; reason?: string }>({})

  const validate = () => {
    const newErrors: { name?: string; email?: string; reason?: string } = {}
    if (!name.trim()) newErrors.name = 'Name is required'
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address'
    }
    if (!reason.trim()) newErrors.reason = 'Reason is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, reason }),
      })

      if (!res.ok) throw new Error('Failed to send message')

      toast.success('Your message has been sent successfully. Our support team will contact you soon.')
      onOpenChange(false)
      setName('')
      setEmail('')
      setReason('')
      setErrors({})
    } catch (err) {
      toast.error('Unable to send your message. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!loading) onOpenChange(val)
    }}>
      <DialogContent className="sm:max-w-[500px] p-0 rounded-[24px] overflow-hidden bg-card border-none shadow-[0_12px_40px_rgba(0,0,0,0.12)]" showCloseButton={!loading}>
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Header Area */}
          <div className="flex items-start gap-3 p-4 sm:p-5 border-b border-border/60">
            <div className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center relative overflow-hidden bg-primary/10 text-primary">
              <Mail size={20} strokeWidth={1.5} />
              <Sparkles size={10} className="absolute top-2 right-2 opacity-80" strokeWidth={2} />
            </div>
            <div className="pt-0.5">
              <DialogTitle style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1.125rem', color: 'var(--foreground)', marginBottom: '2px' }}>
                Contact Us
              </DialogTitle>
              <DialogDescription style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
                Have a question or feedback? Send us a message and we'll get back to you shortly.
              </DialogDescription>
            </div>
          </div>

          {/* Form Body */}
          <div className="flex flex-col gap-3 p-4 sm:p-5 pt-4">
            
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-[0.875rem] font-semibold text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                Full Name <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none">
                  <User size={16} strokeWidth={1.5} />
                </div>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors({ ...errors, name: undefined })
                  }}
                  disabled={loading}
                  className={`pl-[36px] h-11 rounded-xl border-border/80 bg-background text-[0.875rem] transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary ${errors.name ? 'border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive' : ''}`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
              {errors.name && <p className="text-[0.8125rem] font-medium text-destructive mt-0.5">{errors.name}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[0.875rem] font-semibold text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                Email Address <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none">
                  <Mail size={16} strokeWidth={1.5} />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors({ ...errors, email: undefined })
                  }}
                  disabled={loading}
                  className={`pl-[36px] h-11 rounded-xl border-border/80 bg-background text-[0.875rem] transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary ${errors.email ? 'border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive' : ''}`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
              {errors.email && <p className="text-[0.8125rem] font-medium text-destructive mt-0.5">{errors.email}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="reason" className="text-[0.875rem] font-semibold text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                Reason <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-3 text-muted-foreground/70 pointer-events-none">
                  <MessageSquare size={16} strokeWidth={1.5} />
                </div>
                <Textarea
                  id="reason"
                  placeholder="Tell us how we can help you..."
                  value={reason}
                  maxLength={500}
                  onChange={(e) => {
                    setReason(e.target.value)
                    if (errors.reason) setErrors({ ...errors, reason: undefined })
                  }}
                  disabled={loading}
                  className={`pl-[36px] py-2.5 h-[80px] min-h-[80px] rounded-xl border-border/80 bg-background text-[0.875rem] transition-colors resize-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary ${errors.reason ? 'border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive' : ''}`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
                <div className="absolute bottom-3 right-4 text-[0.75rem] font-medium text-muted-foreground/60 pointer-events-none select-none">
                  {reason.length} / 500
                </div>
              </div>
              {errors.reason && <p className="text-[0.8125rem] font-medium text-destructive mt-0.5">{errors.reason}</p>}
            </div>

          </div>

          {/* Footer Area */}
          <div className="flex flex-col gap-1.5 px-4 sm:px-5 pb-5">
            <Button 
              type="submit" 
              disabled={loading} 
              fullWidth
              variant="primary"
              size="md"
              className="h-11 rounded-xl text-[0.875rem]"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Message
              {!loading && <Send size={16} className="ml-2" strokeWidth={2} />}
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              size="md"
              className="h-11 rounded-xl text-[0.875rem]"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            
            <div className="flex items-center justify-center gap-1.5 mt-3 text-muted-foreground/80">
              <Lock size={12} strokeWidth={2} />
              <p className="text-[0.75rem]" style={{ fontFamily: 'Inter, sans-serif' }}>
                Your information is secure and will only be used to respond to your message.
              </p>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
