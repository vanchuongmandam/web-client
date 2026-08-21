// src/stores/checkout.store.ts
import { create } from 'zustand';
import {
  getDocumentBySlug,
  getProfile,
  updateProfile,
  createOrder,
  getOrderByCode,
  validateCoupon,
} from '@/lib/api';
import type { MarketDocument, Order, BillingAddress } from '@/lib/types';

export type CheckoutStep = 'billing' | 'confirm' | 'payment' | 'success';

const EMPTY_BILLING: BillingAddress = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  province: '',
  postalCode: '',
  country: 'VN',
};

interface CheckoutState {
  step: CheckoutStep;
  doc: MarketDocument | null;
  order: Order | null;
  billingForm: BillingAddress;
  balance: number;
  useBalance: boolean;
  couponCode: string;
  appliedCoupon: string | null;
  discountAmount: number;
  couponError: string | null;
  isValidatingCoupon: boolean;
  submitting: boolean;
  remainingSeconds: number | null;

  initCheckout: (doc: MarketDocument, balance: number, savedBilling?: BillingAddress) => void;
  setStep: (step: CheckoutStep) => void;
  setBillingForm: (data: Partial<BillingAddress>) => void;
  saveBillingAddress: (token: string) => Promise<boolean>;
  setUseBalance: (useBalance: boolean) => void;
  setCouponCode: (code: string) => void;
  applyCoupon: (token: string) => Promise<boolean>;
  removeCoupon: () => void;
  submitOrder: (token: string) => Promise<Order | null>;
  pollOrderStatus: (token: string) => Promise<'paid' | 'expired' | 'pending'>;
  tickCountdown: () => void;
  resetCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>()((set, get) => ({
  step: 'billing',
  doc: null,
  order: null,
  billingForm: EMPTY_BILLING,
  balance: 0,
  useBalance: false,
  couponCode: '',
  appliedCoupon: null,
  discountAmount: 0,
  couponError: null,
  isValidatingCoupon: false,
  submitting: false,
  remainingSeconds: null,

  initCheckout: (doc, balance, savedBilling) =>
    set({
      doc,
      balance,
      billingForm: savedBilling?.fullName ? { ...EMPTY_BILLING, ...savedBilling } : EMPTY_BILLING,
      step: savedBilling?.fullName ? 'confirm' : 'billing',
      order: null,
      couponCode: '',
      appliedCoupon: null,
      discountAmount: 0,
      couponError: null,
      remainingSeconds: null,
    }),

  setStep: (step) => set({ step }),

  setBillingForm: (data) =>
    set((state) => ({ billingForm: { ...state.billingForm, ...data } })),

  saveBillingAddress: async (token) => {
    const { billingForm } = get();
    set({ submitting: true });
    try {
      await updateProfile({ billingAddress: billingForm }, token);
      set({ step: 'confirm' });
      return true;
    } catch {
      return false;
    } finally {
      set({ submitting: false });
    }
  },

  setUseBalance: (useBalance) => set({ useBalance }),

  setCouponCode: (code) =>
    set((state) =>
      state.appliedCoupon
        ? {
            couponCode: code,
            appliedCoupon: null,
            discountAmount: 0,
            couponError: null,
          }
        : { couponCode: code }
    ),

  applyCoupon: async (token) => {
    const { couponCode, doc } = get();
    if (!couponCode.trim() || !doc) return false;

    set({ isValidatingCoupon: true, couponError: null });
    try {
      const res = await validateCoupon(couponCode.toUpperCase(), [doc._id], token);
      if (res && res.coupon) {
        set({
          discountAmount: res.discountAmount,
          appliedCoupon: couponCode.toUpperCase(),
        });
        return true;
      }
      set({
        couponError: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.',
        discountAmount: 0,
        appliedCoupon: null,
      });
      return false;
    } catch (err: unknown) {
      set({
        couponError: err instanceof Error ? err.message : 'Mã giảm giá không hợp lệ.',
        discountAmount: 0,
        appliedCoupon: null,
      });
      return false;
    } finally {
      set({ isValidatingCoupon: false });
    }
  },

  removeCoupon: () =>
    set({ appliedCoupon: null, discountAmount: 0, couponError: null }),

  submitOrder: async (token) => {
    const { doc, useBalance, appliedCoupon, couponCode } = get();
    if (!doc) return null;

    set({ submitting: true });
    try {
      const activeCoupon = appliedCoupon
        ? appliedCoupon
        : couponCode
          ? couponCode.toUpperCase()
          : undefined;
      const newOrder = await createOrder([doc._id], token, useBalance, activeCoupon);
      const isComplete =
        newOrder.status === 'paid' ||
        newOrder.status === 'confirmed' ||
        newOrder.totalAmount === 0;
      set({
        order: newOrder,
        step: isComplete ? 'success' : 'payment',
        remainingSeconds: null,
      });
      return newOrder;
    } catch {
      return null;
    } finally {
      set({ submitting: false });
    }
  },

  pollOrderStatus: async (token) => {
    const order = get().order;
    if (!order) return 'pending';
    try {
      const updated = await getOrderByCode(order.orderCode, token);
      if (updated.status === 'paid' || updated.status === 'confirmed') {
        set({ order: updated, step: 'success', remainingSeconds: null });
        return 'paid';
      }
      if (updated.status === 'expired' || updated.status === 'cancelled') {
        set({ order: updated });
        return 'expired';
      }
      set({ order: updated });
      return 'pending';
    } catch {
      return 'pending';
    }
  },

  tickCountdown: () => {
    const order = get().order;
    if (!order) {
      set({ remainingSeconds: null });
      return;
    }
    const remain = Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000);
    set({ remainingSeconds: Math.max(0, remain) });
  },

  resetCheckout: () =>
    set({
      step: 'billing',
      doc: null,
      order: null,
      billingForm: EMPTY_BILLING,
      balance: 0,
      useBalance: false,
      couponCode: '',
      appliedCoupon: null,
      discountAmount: 0,
      couponError: null,
      isValidatingCoupon: false,
      submitting: false,
      remainingSeconds: null,
    }),
}));
