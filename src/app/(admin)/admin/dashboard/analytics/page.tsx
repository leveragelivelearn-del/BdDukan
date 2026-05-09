"use client"

import * as React from "react"
import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  Bar, 
  BarChart, 
  Cell, 
  Pie, 
  PieChart, 
  Legend,
  Label
} from "recharts"
import { 
  Search, 
  MousePointer2, 
  Eye, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Globe, 
  Smartphone, 
  Laptop, 
  Tablet,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
  Info,
  MapPin,
  Activity,
  Share2,
  UserPlus
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

// --- Chart Configurations ---

const visitorChartConfig = {
  visitors: { label: "Total Visitors", color: "var(--chart-1)" },
  sessions: { label: "Sessions", color: "var(--chart-2)" }
} satisfies ChartConfig

const searchChartConfig = {
  clicks: { label: "Clicks", color: "var(--chart-1)" },
  impressions: { label: "Impressions", color: "var(--chart-3)" }
} satisfies ChartConfig

const deviceChartConfig = {
  visitors: { label: "Visitors" },
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
  tablet: { label: "Tablet", color: "var(--chart-3)" },
} satisfies ChartConfig

const retentionChartConfig = {
  value: { label: "Users" },
  new: { label: "New Users", color: "var(--chart-1)" },
  returning: { label: "Returning", color: "var(--chart-2)" },
} satisfies ChartConfig

// --- Main Component ---

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = React.useState("30d")
  const [isLoading, setIsLoading] = React.useState(true)
  const [data, setData] = React.useState<any>(null)

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error('Failed to fetch analytics data')
      }
      
      const text = await response.text()
      if (!text) {
        throw new Error('Empty response received from server')
      }
      
      const result = JSON.parse(text)
      setData(result)
    } catch (error) {
      console.error('Analytics Fetch Error:', error)
      toast.error("Failed to load data.")
      setData(getMockData())
    } finally {
      setIsLoading(false)
    }
  }, [timeRange])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  if (isLoading && !data) return <AnalyticsLoadingSkeleton />

  const safeData = (data && data.stats) ? data : getMockData()
  const { stats, visitorTrends, searchTrends, topPages, topQueries, deviceData, countryData, sourceData, retentionData } = safeData

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-muted/20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">Business Analytics</h2>
          </div>
          <p className="text-muted-foreground mt-1">Real-time performance from Google Analytics & Search Console.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v || '30d')}>
            <SelectTrigger className="w-[180px] bg-background shadow-sm"><SelectValue placeholder="Select range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <button onClick={fetchData} className="p-2.5 bg-background border shadow-sm hover:bg-muted rounded-lg transition-all" title="Refresh Data">
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* --- Key Metrics --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Visitors" value={stats.visitors} change={stats.visitorsChange} icon={<Users />} description="Unique users" />
        <MetricCard title="Search Clicks" value={stats.clicks} change={stats.clicksChange} icon={<MousePointer2 />} description="From Google Search" />
        <MetricCard title="Avg. Duration" value={stats.avgDuration} change={stats.durationChange} icon={<Clock />} description="Engagement time" />
        <MetricCard title="Avg. Search Pos." value={(stats?.avgPosition ?? 0).toFixed(1)} change={stats?.positionChange} icon={<TrendingUp />} description="Ranking position" inverseChange />
      </div>

      {/* --- Visitor Trends --- */}
      <Card className="shadow-sm border-muted-foreground/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Visitor Growth</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground opacity-50" />
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-[350px] w-full">
            <ChartContainer config={visitorChartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={visitorTrends} margin={{ left: 10, right: 10 }}>
                  <defs>
                    <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-visitors)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--color-visitors)" stopOpacity={0}/></linearGradient>
                    <linearGradient id="fillSessions" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-sessions)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--color-sessions)" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Area dataKey="visitors" type="monotone" fill="url(#fillVisitors)" stroke="var(--color-visitors)" strokeWidth={2} />
                  <Area dataKey="sessions" type="monotone" fill="url(#fillSessions)" stroke="var(--color-sessions)" strokeWidth={2} />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* --- Devices --- */}
        <Card className="shadow-sm border-muted-foreground/10">
          <CardHeader className="pb-2"><CardTitle>Devices</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ChartContainer config={deviceChartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Pie data={deviceData} dataKey="visitors" nameKey="device" innerRadius={45} strokeWidth={5}>
                      {deviceData.map((e: any, i: number) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {deviceData.map((d: any) => (
                <div key={d.device} className="text-center">
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">{d.device}</p>
                  <p className="text-sm font-bold">{Math.round((d.visitors / (stats.visitors || 1)) * 100)}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* --- Traffic Sources --- */}
        <Card className="shadow-sm border-muted-foreground/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Traffic Sources</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ChartContainer config={{ value: { label: "Users" } }} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Pie data={sourceData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} strokeWidth={5}>
                      {sourceData.map((e: any, i: number) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* --- Top Countries --- */}
        <Card className="shadow-sm border-muted-foreground/10">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><Globe className="h-4 w-4" /> Top Countries</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {countryData?.map((c: any) => (
              <div key={c.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" /><span className="text-xs font-medium group-hover:text-primary transition-colors">{c.name}</span></div>
                <span className="text-xs font-bold bg-muted px-1.5 py-0.5 rounded">{c.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* --- New vs Returning --- */}
        <Card className="shadow-sm border-muted-foreground/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>User Retention</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ChartContainer config={retentionChartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={retentionData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.1} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="type" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                      {retentionData.map((e: any, i: number) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- Search Performance --- */}
      <div className="grid gap-6 md:grid-cols-1">
        <Card className="shadow-sm border-muted-foreground/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Search Performance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ChartContainer config={searchChartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={searchTrends}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} />
                    <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                    <Bar dataKey="clicks" fill="var(--color-clicks)" radius={4} />
                    <Bar dataKey="impressions" fill="var(--color-impressions)" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* --- Top Content --- */}
        <Card className="shadow-sm border-muted-foreground/10">
          <CardHeader><CardTitle>Top Content</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {topPages.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-muted text-[10px] font-bold">{i+1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{p.url}</p>
                </div>
                <div className="text-right"><p className="text-sm font-bold">{p.views.toLocaleString()}</p><p className="text-[10px] text-muted-foreground uppercase">Views</p></div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* --- Top Queries --- */}
        <Card className="shadow-sm border-muted-foreground/10">
          <CardHeader><CardTitle>Search Keywords</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {topQueries.map((q: any, i: number) => (
              <div key={i} className="flex items-center gap-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{q.term}</p>
                  <div className="flex items-center gap-2 mt-0.5"><Badge variant="secondary" className="text-[9px] h-3.5">Pos: {(q.position ?? 0).toFixed(1)}</Badge><span className="text-[10px] text-muted-foreground">{(q.ctr ?? 0).toFixed(1)}% CTR</span></div>
                </div>
                <div className="text-right"><p className="text-sm font-bold">{q.clicks}</p><p className="text-[10px] text-muted-foreground uppercase">Clicks</p></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ title, value, change, icon, description, inverseChange = false }: any) {
  const isPositive = change >= 0
  const isGood = inverseChange ? !isPositive : isPositive
  return (
    <Card className="shadow-sm border-muted-foreground/10">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">{title}</CardTitle>
        <div className="text-primary opacity-70">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        <div className="flex items-center gap-1 mt-1 text-[10px]">
          <span className={isGood ? 'text-emerald-500' : 'text-rose-500'}>{isPositive ? '+' : ''}{change}%</span>
          <span className="text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function AnalyticsLoadingSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      <div className="grid gap-6 md:grid-cols-7"><Skeleton className="col-span-4 h-[400px]" /><Skeleton className="col-span-3 h-[400px]" /></div>
    </div>
  )
}

function getMockData() {
  return {
    stats: { visitors: 0, visitorsChange: 0, clicks: 0, clicksChange: 0, avgDuration: "0s", durationChange: 0, avgPosition: 0, positionChange: 0, activeUsersNow: 0 },
    visitorTrends: [], searchTrends: [], topPages: [], topQueries: [], deviceData: [], countryData: [], sourceData: [], retentionData: []
  }
}
