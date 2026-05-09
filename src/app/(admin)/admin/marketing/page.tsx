import { MarketingForm } from "@/components/admin/MarketingForm";

export const metadata = {
  title: "Marketing Dashboard | Janopriyo Shop",
  description: "Manage SEO, Google Tag Manager, Search Console, and Meta Pixel settings",
};

export default function MarketingPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Marketing Dashboard</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl">
          <MarketingForm />
        </div>
        
        <div className="col-span-3">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="font-semibold leading-none tracking-tight">Installation Guide</h3>
              <p className="text-sm text-muted-foreground">
                How tracking IDs are implemented.
              </p>
            </div>
            <div className="p-6 pt-0 space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">Google Tag Manager (GTM)</h4>
                <p className="text-muted-foreground">
                  The GTM container will be injected into the `&lt;head&gt;` of all public pages. This enables Analytics, Ads Conversion tracking, and more.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Google Search Console</h4>
                <p className="text-muted-foreground">
                  Provides the verification meta tag required to prove ownership of the site when setting up Search Console.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Meta Pixel</h4>
                <p className="text-muted-foreground">
                  Standard page view tracking is initialized. Purchase events are sent upon successful checkout completion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
