export function PublicHero({ routeCount, vehicleCount }: { routeCount: number; vehicleCount: number }) {
  return (
    <section className="container public-hero">
      <div>
        <div className="eyebrow">University shuttle / public tracking</div>
        <h1 className="hero-title">Move through campus <span>with clarity.</span></h1>
        <p className="hero-copy">เลือกเส้นทางรถรับส่งมหาวิทยาลัยเพื่อดูจุดจอดทั้งหมดตามลำดับ พร้อมข้อมูลภาษาไทยและภาษาอังกฤษในมุมมองเดียว</p>
        <div className="hero-actions"><a className="button button-primary" href="#routes">สำรวจเส้นทาง</a><span className="hero-meta"><i className="live-pulse" />ข้อมูลจากระบบ Shuttle Bus RSU</span></div>
        <div className="hero-stats" aria-label="สรุปข้อมูลระบบ"><div className="hero-stat"><strong>{routeCount}</strong><span>เส้นทางที่เปิดให้บริการ</span></div><div className="hero-stat"><strong>{vehicleCount}</strong><span>รถที่มีตำแหน่งล่าสุด</span></div></div>
      </div>
      <div className="hero-card"><div className="hero-card-art"><div className="map-grid" /><span className="art-badge"><i className="live-pulse" />LIVE CAMPUS NETWORK</span><div className="route-line" /><i className="route-dot one" /><i className="route-dot two" /><i className="route-dot three" /><i className="vehicle-beacon" /><div className="art-label"><strong>Campus in motion</strong><small>One connected shuttle network</small></div></div></div>
    </section>
  );
}
