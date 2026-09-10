import PublicExplorer from "@/components/public/PublicExplorer";
import SiteHeader from "@/components/layout/SiteHeader";

export default function PublicHome() {
  return <div className="shell"><SiteHeader active="public" /><PublicExplorer /></div>;
}
