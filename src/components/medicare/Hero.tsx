import { useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules";
import gsap from "gsap";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import h1 from "@/assets/hero-1.jpg";
import h2 from "@/assets/hero-2.jpg";
import h3 from "@/assets/hero-3.jpg";

const slides = [
  { img: h1, eyebrow: "Trusted Online Pharmacy", title: "Your health, delivered in 30 minutes", desc: "Genuine medicines, vitamins & wellness essentials. Free delivery on orders above $30.", cta: "Shop Medicines", tag: "Save up to 40%" },
  { img: h2, eyebrow: "Verified Pharmacists", title: "Talk to a doctor, anytime, anywhere", desc: "Free 24/7 consultations with licensed medical professionals when you order.", cta: "Consult Now", tag: "24/7 Support" },
  { img: h3, eyebrow: "Daily Wellness", title: "Premium vitamins & supplements", desc: "Lab-tested, certified-organic supplements from world-class brands.", cta: "Browse Vitamins", tag: "Up to 50% off" },
];

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.fromTo(el.querySelectorAll(".hero-stat"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.15, duration: 0.8, delay: 0.4 });
  }, []);

  return (
    <section ref={ref} className="relative bg-gradient-hero overflow-hidden">
      <div className="container mx-auto px-4 py-6 md:py-10">
        <Swiper
          modules={[Autoplay, Pagination, Navigation, EffectFade]}
          effect="fade"
          autoplay={{ delay: 5500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation
          loop
          className="rounded-3xl overflow-hidden shadow-elegant"
        >
          {slides.map((s, i) => (
            <SwiperSlide key={i}>
              <div className="relative grid md:grid-cols-2 min-h-[420px] md:min-h-[520px] bg-card">
                <div className="p-8 md:p-14 flex flex-col justify-center gap-5 z-10">
                  <span className="inline-flex items-center gap-2 self-start glass px-4 py-1.5 rounded-full text-xs font-semibold text-primary">
                    <i className="fa-solid fa-shield-heart" />{s.eyebrow}
                  </span>
                  <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight">
                    {s.title.split(" ").slice(0, -2).join(" ")}{" "}
                    <span className="gradient-text">{s.title.split(" ").slice(-2).join(" ")}</span>
                  </h1>
                  <p className="text-muted-foreground text-base md:text-lg max-w-md">{s.desc}</p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button className="px-7 py-3.5 rounded-full bg-gradient-cta text-primary-foreground font-semibold shadow-glow hover-lift">
                      {s.cta}<i className="fa-solid fa-arrow-right ml-2" />
                    </button>
                    <button className="px-7 py-3.5 rounded-full glass font-semibold hover-lift">
                      <i className="fa-solid fa-prescription mr-2" />Upload Prescription
                    </button>
                  </div>
                  <div className="flex items-center gap-6 pt-4 text-xs text-muted-foreground">
                    <div className="hero-stat"><b className="text-foreground text-xl">2M+</b><div>Happy Customers</div></div>
                    <div className="hero-stat"><b className="text-foreground text-xl">50K+</b><div>Products</div></div>
                    <div className="hero-stat"><b className="text-foreground text-xl">4.9★</b><div>Rated</div></div>
                  </div>
                </div>
                <div className="relative hidden md:block">
                  <img src={s.img} alt="" className="absolute inset-0 w-full h-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
                  <div className="absolute top-6 right-6 glass px-4 py-2 rounded-full text-sm font-bold text-destructive shadow-soft animate-float">
                    <i className="fa-solid fa-tag mr-2" />{s.tag}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style>{`
        .swiper-button-prev, .swiper-button-next { color: var(--color-primary); background: var(--color-card); width: 44px; height: 44px; border-radius: 9999px; box-shadow: var(--shadow-soft); }
        .swiper-button-prev:after, .swiper-button-next:after { font-size: 16px; font-weight: 800; }
        .swiper-pagination-bullet { background: var(--color-card); opacity: .9; width: 10px; height: 10px; }
        .swiper-pagination-bullet-active { background: var(--color-primary); width: 28px; border-radius: 5px; }
      `}</style>
    </section>
  );
}
