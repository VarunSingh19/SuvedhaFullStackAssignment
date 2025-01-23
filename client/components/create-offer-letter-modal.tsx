'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const domains = [
  'Web Development',
  'Mobile Development',
  'Data Science',
  'DevOps',
  'UI/UX Design',
  'Product Management',
];

export default function CreateOfferLetterModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    candidate_name: '',
    email: '',
    joining_date: '',
    end_date: '',
    domain: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error('Auth Error:', authError);
        throw authError;
      }

      if (!user) {
        console.error('No user found');
        throw new Error('No user found');
      }

      // Get the profile ID - note im using the user's ID directly since
      // that's what's referenced in the profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id) // Changed from auth_user_id to id
        .single();

      if (profileError) {
        console.error('Profile Error:', profileError);
        throw profileError;
      }

      const refNo = `OL${Date.now().toString().slice(-6)}`;

      const { data: insertData, error: insertError } = await supabase
        .from('offer_letters')
        .insert([
          {
            ref_no: refNo,
            candidate_name: formData.candidate_name,
            candidate_email: formData.email,
            joining_date: formData.joining_date,
            end_date: formData.end_date,
            domain: formData.domain,
            status: 'draft',
            created_by: user.id, // Using user.id directly since profiles.id matches auth.users.id
          },
        ])
        .select();

      if (insertError) {
        console.error('Insert Error:', insertError);
        throw insertError;
      }

      toast({
        title: 'Success',
        description: 'Offer letter created successfully',
      });

      onSuccess();
      onClose();
      setFormData({
        candidate_name: '',
        email: '',
        joining_date: '',
        end_date: '',
        domain: '',
      });
    } catch (error: any) {
      console.error('Detailed error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      toast({
        title: 'Error',
        description: error.message || 'Failed to create offer letter',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Offer Letter</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="candidate_name">Candidate Name</Label>
            <Input
              id="candidate_name"
              value={formData.candidate_name}
              onChange={(e) =>
                setFormData({ ...formData, candidate_name: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="joining_date">Joining Date</Label>
            <Input
              id="joining_date"
              type="date"
              value={formData.joining_date}
              onChange={(e) =>
                setFormData({ ...formData, joining_date: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">End Date</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) =>
                setFormData({ ...formData, end_date: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Select
              value={formData.domain}
              onValueChange={(value) =>
                setFormData({ ...formData, domain: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select domain" />
              </SelectTrigger>
              <SelectContent>
                {domains.map((domain) => (
                  <SelectItem key={domain} value={domain}>
                    {domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
