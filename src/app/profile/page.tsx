// src/app/profile/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getProfile, updateProfile } from '@/lib/api';
import type { UserProfile, BillingAddress } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, MapPin, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    displayName: '',
    email: '',
    phone: '',
    bio: '',
  });

  const [billingForm, setBillingForm] = useState<BillingAddress>({
    fullName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', province: '', postalCode: '', country: 'VN',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.push('/login'); return; }

    getProfile(token)
      .then((p) => {
        setProfile(p);
        setForm({
          displayName: p.displayName || '',
          email: p.email || '',
          phone: p.phone || '',
          bio: p.bio || '',
        });
        if (p.billingAddress) {
          setBillingForm(p.billingAddress);
        }
      })
      .catch(() => toast({ title: 'Loi', description: 'Khong the tai thong tin', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [authLoading, token, router, toast]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const updated = await updateProfile({
        ...form,
        billingAddress: billingForm,
      }, token);
      setProfile(updated);
      toast({ title: 'Da luu', description: 'Cap nhat thong tin thanh cong' });
    } catch (err: unknown) {
      toast({ title: 'Loi', description: err instanceof Error ? err.message : 'Khong the luu', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Ho so ca nhan</h1>

      {/* Profile Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Thong tin ca nhan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Ten nguoi dung</Label>
              <Input value={profile?.username || ''} disabled />
            </div>
            <div>
              <Label>Ten hien thi</Label>
              <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>So dien thoai</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Gioi thieu</Label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={500} rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" /> Dia chi thanh toan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Ho va ten</Label>
              <Input value={billingForm.fullName || ''} onChange={(e) => setBillingForm({ ...billingForm, fullName: e.target.value })} />
            </div>
            <div>
              <Label>So dien thoai</Label>
              <Input value={billingForm.phone || ''} onChange={(e) => setBillingForm({ ...billingForm, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Dia chi (So nha, duong)</Label>
            <Input value={billingForm.addressLine1 || ''} onChange={(e) => setBillingForm({ ...billingForm, addressLine1: e.target.value })} />
          </div>
          <div>
            <Label>Phuong/Xa</Label>
            <Input value={billingForm.addressLine2 || ''} onChange={(e) => setBillingForm({ ...billingForm, addressLine2: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Quan/Huyen</Label>
              <Input value={billingForm.city || ''} onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })} />
            </div>
            <div>
              <Label>Tinh/Thanh pho</Label>
              <Input value={billingForm.province || ''} onChange={(e) => setBillingForm({ ...billingForm, province: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Luu thay doi
      </Button>
    </div>
  );
}
