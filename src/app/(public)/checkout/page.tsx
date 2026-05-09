'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart, removeFromCart, clearCart } from '@/store/slices/cartSlice';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, CreditCard, Truck, ShoppingBag, CheckCircle2, Plus, Minus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { divisions, bdDivisions, bdLocations } from '@/lib/bd-locations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(11, 'Invalid phone number'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  street: z.string().min(5, 'Street address is required'),
  division: z.string().min(1, 'Division is required'),
  district: z.string().min(1, 'District is required'),
  thana: z.string().min(1, 'Thana is required'),
  paymentMethod: z.enum(['COD', 'Online', 'Manual'], {
    message: 'Select a payment method'
  }),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, totalAmount, isHydrated } = useAppSelector((state) => state.cart);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [useWallet, setUseWallet] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [manualDetails, setManualDetails] = useState({
    senderNumber: '',
    transactionId: ''
  });

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      street: '',
      division: '',
      district: '',
      thana: '',
      paymentMethod: 'COD',
    },
  });

  // Reset manual payment details if payment method changes away from Manual
  useEffect(() => {
    const method = form.watch('paymentMethod');
    if (method !== 'Manual') {
      setSelectedMethod(null);
      setManualDetails({ senderNumber: '', transactionId: '' });
    }
  }, [form.watch('paymentMethod')]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedDivision = form.watch('division');
  const selectedDistrict = form.watch('district');

  const availableDistricts = selectedDivision ? bdDivisions[selectedDivision] : [];
  const availableThanas = selectedDistrict ? bdLocations[selectedDistrict] : [];

  useEffect(() => {
    async function fetchLoyaltyData() {
      try {
        const [profileRes, settingsRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/settings')
        ]);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
          
          // Pre-fill form if user is logged in
          if (profileData) {
            form.reset({
              fullName: profileData.name || '',
              phone: profileData.phone || '',
              email: profileData.email || '',
              street: profileData.address || '',
              division: profileData.division || '',
              district: profileData.district || '',
              thana: profileData.thana || '',
              paymentMethod: 'COD',
            });
          }
        }
        if (settingsRes.ok) setSettings(await settingsRes.json());
      } catch (error) {
        console.error('Failed to fetch loyalty data');
      }
    }
    fetchLoyaltyData();
  }, [form]);

  const submissionSucceededRef = useRef(false);

  const [canRedirect, setCanRedirect] = useState(false);

  // Delay the redirect permission to allow Redux state to fully settle
  useEffect(() => {
    if (isHydrated) {
      const timer = setTimeout(() => setCanRedirect(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isHydrated]);

  useEffect(() => {
    // Only redirect if hydration is complete, the grace period (canRedirect) has passed, 
    // and the cart is still truly empty.
    if (canRedirect && isHydrated && items.length === 0 && !loading && !submissionSucceededRef.current) {
      router.push('/shop');
    }
  }, [canRedirect, isHydrated, items.length, router, loading]);

  const onSubmit = async (values: CheckoutValues) => {
    setLoading(true);
    try {
      const orderData = {
        items: items.map(item => ({
            product: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image,
            color: item.color,
            size: item.size
        })),
        shippingAddress: {
            fullName: values.fullName,
            phone: values.phone,
            email: values.email,
            street: values.street,
            city: values.thana,
            state: values.district,
            division: values.division,
            zipCode: '0000',
            country: 'Bangladesh'
        },
        paymentMethod: values.paymentMethod,
        deliveryCharge: deliveryCharge,
        useWallet: useWallet,
        couponCode: appliedCoupon || undefined,
        manualPaymentDetails: values.paymentMethod === 'Manual' ? {
          methodName: selectedMethod?.id,
          senderNumber: manualDetails.senderNumber,
          transactionId: manualDetails.transactionId
        } : undefined
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const order = await response.json();
        submissionSucceededRef.current = true;
        
        if (values.paymentMethod === 'Online') {
          // Initialize SSLCommerz Payment
          const initRes = await fetch('/api/payment/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: order._id }),
          });

          if (initRes.ok) {
            const { url } = await initRes.json();
            // Clear cart ONLY after successful payment initialization
            dispatch(clearCart());
            // Redirect to SSLCommerz Gateway
            window.location.href = url;
            return; // Stop further execution
          } else {
            const initError = await initRes.json();
            toast.error(initError.message || 'Failed to initialize payment gateway. Please try paying from your dashboard.');
            // Still clear cart if the order was created successfully
            dispatch(clearCart());
            router.push(`/checkout/success?id=${order._id}`);
          }
        } else {
          // COD Success - Clear cart and redirect
          dispatch(clearCart());
          toast.success('Order placed successfully!');
          router.push(`/checkout/success?id=${order._id}`);
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to place order');
      }
    } catch (error) {
      toast.error('An error occurred while placing your order');
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async (codeToUse?: string) => {
    const code = codeToUse || couponCode;
    if (!code.trim()) return;
    
    setApplyingCoupon(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code, totalAmount })
      });
      const data = await res.json();
      if (res.ok) {
        setCouponDiscount(data.discountAmount);
        setAppliedCoupon(data.code);
        if (!codeToUse) toast.success(`Coupon "${data.code}" applied!`);
      } else {
        // If re-validating an already applied coupon, remove it
        if (codeToUse) {
          removeCoupon();
          toast.info(data.message || 'Coupon removed due to cart changes');
        } else {
          toast.error(data.message || 'Invalid coupon');
        }
      }
    } catch (error) {
      if (!codeToUse) toast.error('Failed to validate coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Re-validate coupon when cart total changes
  useEffect(() => {
    if (appliedCoupon && totalAmount > 0) {
      applyCoupon(appliedCoupon);
    }
  }, [totalAmount]); // eslint-disable-line react-hooks/exhaustive-deps

  const removeCoupon = () => {
    setCouponDiscount(0);
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Coupon removed');
  };

  const division = form.watch('division');
  const district = form.watch('district');
  const isDhaka = division?.toLowerCase().includes('dhaka') || district?.toLowerCase().includes('dhaka');
  
  const freeDeliveryThreshold = settings?.freeDeliveryThreshold || 0;
  const isFreeDelivery = freeDeliveryThreshold > 0 && totalAmount >= freeDeliveryThreshold;
  
  const chargeInsideDhaka = settings?.deliveryChargeInsideDhaka || 60;
  const chargeOutsideDhaka = settings?.deliveryChargeOutsideDhaka || 120;
  
  const totalProductDiscount = items.reduce((sum, item) => {
    const itemBasePrice = item.basePrice || item.price;
    return sum + Math.max(0, itemBasePrice - item.price) * item.quantity;
  }, 0);

  const deliveryCharge = items.length > 0 ? (isFreeDelivery ? 0 : (isDhaka ? chargeInsideDhaka : chargeOutsideDhaka)) : 0;

  const totalAfterCoupon = Math.max(0, totalAmount + deliveryCharge - couponDiscount);

  const walletAmountToUse = useWallet && profile?.walletBalance 
    ? Math.min(profile.walletBalance, totalAfterCoupon) 
    : 0;

  const finalTotal = totalAfterCoupon - walletAmountToUse;

  // Validation check for mandatory fields to show/hide the order button
  const watchedFields = form.watch();
  const isFormValid = !!(
    watchedFields.fullName?.trim() && 
    watchedFields.phone?.trim() && 
    watchedFields.email?.trim() && 
    watchedFields.street?.trim() && 
    watchedFields.division && 
    watchedFields.district && 
    watchedFields.thana &&
    (watchedFields.paymentMethod !== 'Manual' || (selectedMethod?.id && manualDetails.senderNumber && manualDetails.transactionId))
  );

  const potentialReward = (profile?.isSubscriptionActive && settings?.subscriptionConfig)
    ? Math.floor(finalTotal * (settings.subscriptionConfig.rewardPercentage / 100))
    : 0;

  const handleUpdateQuantity = (item: any, delta: number) => {
      if (item.quantity + delta === 0) {
          dispatch(removeFromCart({ productId: item.productId, color: item.color, size: item.size }));
          toast.info(`${item.name} removed from cart`);
      } else {
          dispatch(addToCart({ ...item, quantity: delta }));
      }
  };

  // Show loading state or nothing while hydrating to prevent flash of "empty cart" redirect
  if (!isHydrated) return (
    <div className="container min-h-[60vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (items.length === 0) return null;

  return (
    <div className="container px-4 md:px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Left Side: Order Summary */}
        <div className="hidden lg:block sticky top-24 self-start space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Items</CardTitle>
              <CardDescription>Items you are about to purchase.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2 -mr-2">
                {items.map((item, index) => (
                  <div key={item.productId ? `${item.productId}-${item.color ?? ''}-${item.size ?? ''}` : index} className="flex gap-4 items-start relative group">
                    <div className="h-16 w-16 rounded-md border bg-muted flex-shrink-0 relative overflow-hidden">
                      {item.image && <img src={item.image} alt={item.name || 'Product'} className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-bold truncate pr-4">{item.name}</p>
                        <button 
                          onClick={() => {
                            dispatch(removeFromCart({ productId: item.productId, color: item.color, size: item.size }));
                            toast.info(`${item.name} removed from cart`);
                          }}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 -mt-1 -mr-1"
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border rounded-full bg-muted/50 scale-90 -ml-2">
                          <button 
                            type="button" 
                            onClick={() => handleUpdateQuantity(item, -1)}
                            className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                          <button 
                            type="button"
                            onClick={() => handleUpdateQuantity(item, 1)}
                            className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-primary">৳{Math.round(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between items-center pt-2">
                <span className="text-base font-bold">Items Total</span>
                <span className="text-xl font-black text-primary">৳{Math.round(totalAmount)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Delivery & Payment */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
            <p className="text-muted-foreground mt-2">Complete your order by filling in the details below.</p>
          </div>

          <Form {...form}>
            <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} className="h-11 focus-visible:ring-primary/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <Input placeholder="017XXXXXXXX" {...field} className="h-11 focus-visible:ring-primary/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="example@mail.com" {...field} className="h-11 focus-visible:ring-primary/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line</FormLabel>
                        <FormControl>
                          <Input placeholder="House #, Road #, Area" {...field} className="h-11 focus-visible:ring-primary/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="division"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Division</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue('district', '');
                              form.setValue('thana', '');
                            }} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 focus:ring-primary/20">
                                <SelectValue placeholder="Select division" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {divisions.map((division) => (
                                <SelectItem key={division} value={division}>
                                  {division}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>District</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue('thana', '');
                            }} 
                            value={field.value}
                            disabled={!selectedDivision}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 focus:ring-primary/20">
                                <SelectValue placeholder="Select district" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableDistricts?.map((district) => (
                                <SelectItem key={district} value={district}>
                                  {district}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="thana"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Thana</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={!selectedDistrict}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 focus:ring-primary/20">
                                <SelectValue placeholder="Select thana" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableThanas?.map((thana) => (
                                <SelectItem key={thana} value={thana}>
                                  {thana}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Coupon Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input 
                        placeholder="Coupon Code" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        disabled={!!appliedCoupon || applyingCoupon}
                        className="h-10 text-xs"
                      />
                      {appliedCoupon ? (
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm" 
                          onClick={removeCoupon}
                          className="h-10 px-3"
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button 
                          type="button" 
                          size="sm" 
                          onClick={() => applyCoupon()} 
                          disabled={applyingCoupon || !couponCode}
                          className="h-10 px-4"
                        >
                          {applyingCoupon ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                        </Button>
                      )}
                    </div>
                    {appliedCoupon && (
                      <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Coupon "{appliedCoupon}" active!
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>৳{Math.round(totalAmount + totalProductDiscount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Product Discount</span>
                      <span>- ৳{Math.round(totalProductDiscount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Coupon Discount</span>
                      <span className={couponDiscount > 0 ? "text-green-600 font-bold" : ""}>
                        - ৳{Math.round(couponDiscount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className={isFreeDelivery ? "text-green-600 font-black" : "text-primary font-bold"}>
                        {isFreeDelivery ? 'FREE' : `৳${deliveryCharge}`}
                      </span>
                    </div>
                    {isFreeDelivery && (
                      <p className="text-[10px] text-green-600 font-bold text-right -mt-1">
                        Free shipping applied (Order ≥ ৳{freeDeliveryThreshold})
                      </p>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Loyalty Discount</span>
                      <span className={walletAmountToUse > 0 ? "text-primary font-bold" : ""}>
                        - ৳{Math.round(walletAmountToUse)}
                      </span>
                    </div>
                    <Separator className="mt-4" />
                    <div className="flex justify-between text-lg font-black pt-2">
                      <span>Final Total</span>
                      <span className="text-primary">৳{Math.round(finalTotal)}</span>
                    </div>
                    {potentialReward > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Loyalty Perk</p>
                        <p className="text-xs font-bold">You will earn <span className="text-primary">৳{potentialReward}</span> tokens from this order!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-2"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                              <FormControl>
                                <RadioGroupItem value="COD" />
                              </FormControl>
                              <FormLabel className="font-bold flex-1 cursor-pointer">
                                Cash on Delivery (COD)
                                <p className="text-xs font-normal text-muted-foreground mt-1">Pay when you receive the product.</p>
                              </FormLabel>
                            </FormItem>
                            {settings?.paymentConfig?.activeMethod === 'sslcommerz' && (
                              <FormItem className="flex items-center space-x-3 space-y-0 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                <FormControl>
                                  <RadioGroupItem value="Online" />
                                </FormControl>
                                <FormLabel className="font-bold flex-1 cursor-pointer">
                                  Online Payment (SSLCommerz)
                                  <p className="text-xs font-normal text-muted-foreground mt-1">Pay securely via Credit Card, bKash, or Rocket.</p>
                                  <Badge variant="secondary" className="mt-2 text-[10px]">Recommended</Badge>
                                </FormLabel>
                              </FormItem>
                            )}

                            {(settings?.manualPaymentConfig?.bkash?.active || 
                              settings?.manualPaymentConfig?.nagad?.active || 
                              settings?.manualPaymentConfig?.rocket?.active) && (
                              <FormItem className="flex items-center space-x-3 space-y-0 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                <FormControl>
                                  <RadioGroupItem value="Manual" />
                                </FormControl>
                                <FormLabel className="font-bold flex-1 cursor-pointer">
                                  Manual Payment (bKash/Nagad/Rocket)
                                  <p className="text-xs font-normal text-muted-foreground mt-1">Send money manually and provide transaction details.</p>
                                </FormLabel>
                              </FormItem>
                            )}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Manual Payment Option Selection (Cards) */}
                  {form.watch('paymentMethod') === 'Manual' && settings?.manualPaymentConfig && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top duration-300">
                      {['bkash', 'nagad', 'rocket'].map((method) => {
                        const config = settings.manualPaymentConfig[method];
                        if (!config?.active) return null;
                        const isSelected = selectedMethod?.id === method;
                        return (
                          <div 
                            key={method} 
                            onClick={() => {
                              setSelectedMethod({ id: method, ...config });
                              setShowPaymentModal(true);
                            }}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2 hover:bg-muted/50 ${
                              isSelected ? 'border-primary bg-primary/5' : 'border-muted'
                            }`}
                          >
                            <img src={`/assets/${method}logo.webp`} alt={method} className="h-8 w-auto" />
                            <p className="text-[10px] font-bold uppercase">{method}</p>
                            {isSelected && (
                              <div className="text-[8px] font-bold text-primary flex items-center gap-1 mt-1">
                                <CheckCircle2 className="h-2 w-2" /> Details Added
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Validation Message for Manual Payment */}
                  {form.watch('paymentMethod') === 'Manual' && !selectedMethod?.id && (
                    <p className="text-[10px] text-destructive font-bold text-center mt-2 animate-pulse">
                      Please select a provider and provide payment details!
                    </p>
                  )}

                  {profile && profile.walletBalance > 0 && (
                    <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            id="use-wallet" 
                            checked={useWallet}
                            onChange={(e) => setUseWallet(e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor="use-wallet" className="font-bold cursor-pointer">
                            Use Token Balance
                            <p className="text-xs font-normal text-muted-foreground">Available: ৳{profile.walletBalance}</p>
                          </label>
                        </div>
                        {useWallet && <span className="text-sm font-black text-primary">-৳{walletAmountToUse}</span>}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2 border-t flex flex-col gap-3">
                  <Button 
                    type="submit"
                    className={`w-full h-14 rounded-full font-black uppercase tracking-widest text-sm transition-all ${
                      isFormValid 
                      ? 'bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95' 
                      : 'bg-muted text-muted-foreground cursor-not-allowed opacity-70'
                    }`}
                    disabled={loading || !isFormValid}
                  >
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                    Place Order Now
                  </Button>
                  {!isFormValid && (
                    <p className="text-[10px] font-bold text-muted-foreground text-center w-full uppercase tracking-widest">
                      Please fill all delivery details to proceed
                    </p>
                  )}
                </CardFooter>
              </Card>
            </form>
          </Form>
        </div>
      </div>

      {/* Manual Payment Verification Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-gradient-to-br from-primary to-primary/80 text-white relative">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-white rounded-2xl p-2 shadow-lg flex items-center justify-center">
                <img src={`/assets/${selectedMethod?.id}logo.webp`} alt={selectedMethod?.id} className="h-full w-auto object-contain" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Pay via {selectedMethod?.id}</DialogTitle>
                <DialogDescription className="text-white/80 text-xs font-bold">Follow the steps below to complete payment.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-6">
            {/* Payment Info */}
            <div className="bg-primary/5 rounded-2xl p-6 border-2 border-primary/10 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Send Money To</span>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">Personal Number</Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-2xl font-black tracking-widest text-primary">{selectedMethod?.number}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 rounded-full text-[10px] font-bold border-2"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedMethod?.number);
                    toast.success('Number copied to clipboard!');
                  }}
                >
                  Copy
                </Button>
              </div>
              
              {selectedMethod?.qrCode && (
                <div className="flex flex-col items-center gap-2 pt-2 border-t border-primary/10">
                  <p className="text-[10px] font-bold uppercase opacity-40">Or Scan QR Code</p>
                  <div className="p-2 bg-white rounded-xl shadow-sm border">
                    <img src={selectedMethod.qrCode} alt="QR" className="h-32 w-32 object-contain" />
                  </div>
                </div>
              )}
            </div>

            {/* Verification Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase opacity-60">Your Mobile Number</Label>
                <Input 
                  placeholder="The number you paid from" 
                  value={manualDetails.senderNumber}
                  onChange={(e) => setManualDetails({...manualDetails, senderNumber: e.target.value})}
                  className="h-12 rounded-xl focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase opacity-60">Transaction ID (TrxID)</Label>
                <Input 
                  placeholder="e.g. 8N7A6D5C" 
                  value={manualDetails.transactionId}
                  onChange={(e) => setManualDetails({...manualDetails, transactionId: e.target.value.toUpperCase()})}
                  className="h-12 rounded-xl focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-xl">
                <p className="text-[10px] leading-relaxed text-muted-foreground italic">
                   <strong>Instructions:</strong> {settings?.manualPaymentConfig?.instructions || 'Please send the exact order amount.'}
                </p>
            </div>
          </div>

          <DialogFooter className="p-8 bg-muted/20 border-t flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="rounded-full h-12 flex-1 font-bold">Cancel</Button>
            <Button 
              disabled={!manualDetails.senderNumber || !manualDetails.transactionId}
              onClick={() => {
                setShowPaymentModal(false);
                toast.success(`${selectedMethod?.id.toUpperCase()} details saved!`);
              }} 
              className="rounded-full h-12 flex-1 font-black uppercase tracking-widest shadow-lg shadow-primary/20"
            >
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
