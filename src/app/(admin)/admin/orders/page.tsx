'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import OrderDetailsDialog from '@/components/admin/OrderDetailsDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Eye,
  Package,
  Truck,
  CheckCircle,
  Trash2,
  XCircle,
  Download,
  MoreHorizontal,
  ChevronDown,
  Printer,
  FileText,
  Filter as FilterIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import PrintableInvoice from '@/components/admin/PrintableInvoice';


export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: '',
  });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [printingOrders, setPrintingOrders] = useState<any[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = (ids: string[]) => {
    const toPrint = orders.filter(o => ids.includes(o._id));
    if (toPrint.length === 0) {
      toast.error('No orders found to print');
      return;
    }

    setPrintingOrders(toPrint);
    setIsPrinting(true);

    toast.info('Preparing invoices...');

    // Use requestAnimationFrame to ensure rendering is complete
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
        setIsPrinting(false);
        setPrintingOrders([]);
      });
    });
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders?all=true');
      if (!res.ok) {
        throw new Error(`Failed to load orders: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setOrders(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const search = searchTerm.toLowerCase();

    // 1. Search matching
    const matchesSearch =
      (order._id?.toLowerCase() || '').includes(search) ||
      (order.user?.email?.toLowerCase() || '').includes(search) ||
      (order.user?.name?.toLowerCase() || '').includes(search) ||
      (order.shippingAddress?.fullName?.toLowerCase() || '').includes(search) ||
      (order.shippingAddress?.phone?.toLowerCase() || '').includes(search);

    // 2. Status matching
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;

    // 3. Date matching
    let matchesDate = true;
    if (dateFilter.from && dateFilter.to) {
      const orderDate = new Date(order.createdAt);
      const fromDate = new Date(dateFilter.from);
      const toDate = new Date(dateFilter.to);
      toDate.setHours(23, 59, 59, 999);
      matchesDate = orderDate >= fromDate && orderDate <= toDate;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const toggleSelectAll = () => {
    const filteredIds = filteredOrders.map(o => o._id);
    const areAllSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.includes(id));

    if (areAllSelected) {
      // Unselect only the filtered ones
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Add missing filtered ones to selection
      setSelectedIds(prev => [...prev, ...filteredIds.filter(id => !prev.includes(id))]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const updateStatus = async (id: string, status: string, extraData: any = {}) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...extraData }),
      });

      if (res.ok) {
        toast.success(`Order updated successfully`);
        fetchOrders();
      } else {
        toast.error('Failed to update order');
      }
    } catch (error) {
      toast.error('Error updating order');
    }
  };

  const handleBulkUpdate = async (status: string) => {
    if (selectedIds.length === 0) return;

    const result = await Swal.fire({
      title: 'Bulk Update?',
      text: `Are you sure you want to update ${selectedIds.length} orders to "${status}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#00D1B2',
      confirmButtonText: 'Yes, update them!'
    });

    if (!result.isConfirmed) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, status }),
      });

      if (res.ok) {
        toast.success(`Bulk update completed successfully`);
        setSelectedIds([]);
        fetchOrders();
      } else {
        toast.error('Bulk update failed');
      }
    } catch (error) {
      toast.error('Error in bulk update');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const result = await Swal.fire({
      title: 'Bulk Delete?',
      text: `Are you sure you want to permanently delete ${selectedIds.length} orders? This cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete all!'
    });

    if (!result.isConfirmed) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (res.ok) {
        toast.success(`Orders deleted successfully`);
        setSelectedIds([]);
        fetchOrders();
      } else {
        toast.error('Bulk delete failed');
      }
    } catch (error) {
      toast.error('Error in bulk delete');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const exportToCSV = () => {
    const ordersToExport = selectedIds.length > 0
      ? orders.filter(o => selectedIds.includes(o._id))
      : filteredOrders;

    if (ordersToExport.length === 0) {
      toast.error('No orders to export');
      return;
    }

    const headers = [
      'Order ID',
      'Date',
      'Customer',
      'Email',
      'Phone',
      'Address',
      'Division/State',
      'Items',
      'Shipping Charge',
      'Discount',
      'Total Amount',
      'Purchase Cost',
      'Profit',
      'Payment Status',
      'Order Status'
    ];

    const rows = ordersToExport.map(o => {
      const shipping = o.shippingAddress || {};
      const fullAddress = `${shipping.street || ''}, ${shipping.city || ''}`;
      const itemsList = o.items.map((i: any) => `• ${i.quantity} x ${i.name} (@৳${i.price})`).join('\n');

      // Profit Calculation: Total - COGS - DeliveryCharge
      const totalPurchaseCost = o.items.reduce((acc: number, i: any) => acc + ((i.purchasePrice || 0) * i.quantity), 0);
      const profit = o.totalAmount - totalPurchaseCost - (o.deliveryCharge || 0);

      return [
        o._id.toUpperCase(),
        format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm'),
        shipping.fullName || o.user?.name || 'Guest',
        o.user?.email || 'Guest',
        shipping.phone || 'N/A',
        fullAddress,
        shipping.division || shipping.state || 'N/A',
        itemsList,
        o.deliveryCharge || 0,
        o.couponDiscountAmount || 0,
        o.totalAmount,
        totalPurchaseCost,
        Math.round(profit),
        o.paymentStatus,
        o.status
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Excel/CSV export started');
  };

  const deleteOrder = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This order will be permanently deleted from the database!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00D1B2',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/orders/${id}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          toast.success('Order deleted successfully');
          fetchOrders();
        } else {
          toast.error('Failed to delete order');
        }
      } catch (error) {
        toast.error('Error deleting order');
      }
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const result = await Swal.fire({
      title: 'Cancel Order?',
      text: "Are you sure you want to cancel this order?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Yes, cancel it!',
    });

    if (result.isConfirmed) {
      await updateStatus(orderId, 'Cancelled');
    }
  };

  const openDetails = (id: string) => {
    setSelectedOrderId(id);
    setIsDetailsOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Order Placed': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-none">Placed</Badge>;
      case 'Confirmed': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-none">Confirmed</Badge>;
      case 'Paid': return <Badge variant="secondary" className="bg-green-100 text-green-800 border-none text-[10px]">Paid</Badge>;
      case 'Ready for Delivery': return <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-none text-[10px]">Ready</Badge>;
      case 'Released for Delivery': return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-none text-[10px]">Released</Badge>;
      case 'Delivered': return <Badge variant="default" className="bg-green-600 text-white border-none">Delivered</Badge>;
      case 'Cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Order Management</h2>
          <p className="text-muted-foreground text-sm">Review, fulfillment and track shop orders.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Input
            placeholder="Search name, phone, email or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-72"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10">
                <FilterIcon className="mr-2 h-4 w-4" />
                {statusFilter === 'All' ? 'All Status' : statusFilter}
                <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  'All',
                  'Order Placed',
                  'Confirmed',
                  'Paid',
                  'Ready for Delivery',
                  'Released for Delivery',
                  'Delivered',
                  'Cancelled'
                ].map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={statusFilter === status ? "bg-accent font-bold" : ""}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{status}</span>
                      <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                        {status === 'All'
                          ? orders.length
                          : orders.filter(o => o.status === status).length
                        }
                      </Badge>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md border">
            <Input
              type="date"
              className="h-8 w-36 border-none bg-transparent focus-visible:ring-0"
              value={dateFilter.from}
              onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
            />
            <span className="text-muted-foreground text-xs">to</span>
            <Input
              type="date"
              className="h-8 w-36 border-none bg-transparent focus-visible:ring-0"
              value={dateFilter.to}
              onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
            />
          </div>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          {(statusFilter !== 'All' || dateFilter.from || dateFilter.to || searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter('All');
                setDateFilter({ from: '', to: '' });
                setSearchTerm('');
              }}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border bg-background overflow-hidden relative">
        {/* Bulk Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className="sticky top-0 z-20 w-full bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-4 text-sm font-medium">
              <span>{selectedIds.length} orders selected</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-white/10"
                onClick={() => setSelectedIds([])}
              >
                Deselect All
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white text-primary hover:bg-white/90"
                onClick={() => handlePrint(selectedIds)}
              >
                <Printer className="mr-2 h-3 w-3" /> Print Invoices
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white text-primary hover:bg-white/90">
                    Update Status <ChevronDown className="ml-2 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Change Status to:</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkUpdate('Confirmed')}>Confirmed</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkUpdate('Paid')}>Paid</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkUpdate('Ready for Delivery')}>Ready for Delivery</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkUpdate('Released for Delivery')}>Released for Delivery</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkUpdate('Delivered')}>Delivered</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Order Info</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order._id} className={selectedIds.includes(order._id) ? "bg-muted/50" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(order._id)}
                      onCheckedChange={() => toggleSelect(order._id)}
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="flex flex-col cursor-pointer text-left hover:opacity-80 transition-opacity"
                      onClick={() => openDetails(order._id)}
                    >
                      <span className="font-bold text-primary hover:underline">#{order._id.slice(-8).toUpperCase()}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">
                        {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, p') : 'N/A'}
                      </span>
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span className="font-semibold">{order.user?.name || 'Guest User'}</span>
                      <span className="text-muted-foreground truncate max-w-[150px]">{order.user?.email || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">৳{Math.round(order.totalAmount ?? 0)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700 border-none' : 'bg-yellow-100 text-yellow-700 border-none'}
                    >
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => openDetails(order._id)}>
                        <Eye className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handlePrint([order._id])}>
                              <FileText className="mr-2 h-4 w-4 text-primary" /> Download Invoice
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => updateStatus(order._id, 'Confirmed')}>Confirm</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(order._id, 'Paid', { paymentStatus: 'Paid' })}>Mark Paid</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(order._id, 'Ready for Delivery')}>Ready for Delivery</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(order._id, 'Released for Delivery')}>Release for Delivery</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(order._id, 'Delivered')}>Mark Delivered</DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleCancelOrder(order._id)}>Cancel Order</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive font-bold" onClick={() => deleteOrder(order._id)}>Delete Order</DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <OrderDetailsDialog
        orderId={selectedOrderId}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onUpdate={fetchOrders}
      />

      {/* Loading Overlay for Bulk Actions */}
      {/* Hidden Printable Area */}
      <div className="hidden print:block fixed inset-0 z-[9999] bg-white overflow-auto">
        {printingOrders.map((order) => (
          <PrintableInvoice key={order._id} order={order} />
        ))}
      </div>

      {bulkActionLoading && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="font-bold">Processing bulk action...</p>
          </div>
        </div>
      )}
    </div>
  );
}
