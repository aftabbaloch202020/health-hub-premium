import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

const reviews = [
  { name: "Sarah M.", role: "Verified Customer", text: "Lightning-fast delivery and the medicines are 100% genuine. The pharmacist call before delivery was a delightful surprise!", rating: 5 },
  { name: "James L.", role: "Verified Customer", text: "I love the prescription upload feature — saves me an hour every month. Pricing beats every local pharmacy.", rating: 5 },
  { name: "Aisha K.", role: "Verified Customer", text: "Their vitamin selection is incredible and the website is so easy to use. The deals section is my new favorite habit.", rating: 5 },
  { name: "Michael R.", role: "Verified Customer", text: "Customer support helped me find the right diabetes monitor in 2 minutes. Premium experience all the way.", rating: 5 },
];

export default function Testimonials() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">What people say</span>
        <h2 className="text-3xl md:text-4xl font-extrabold mt-1">Trusted by 2 million+ patients</h2>
      </div>
      <Swiper modules={[Autoplay, Pagination]} pagination={{ clickable: true }} autoplay={{ delay: 4500 }}
        spaceBetween={20} slidesPerView={1} breakpoints={{ 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
        className="!pb-12">
        {reviews.map((r, i) => (
          <SwiperSlide key={i}>
            <div className="bg-card rounded-3xl p-7 shadow-card h-full flex flex-col">
              <div className="text-warning mb-3">{Array.from({ length: r.rating }).map((_, j) => <i key={j} className="fa-solid fa-star" />)}</div>
              <p className="text-sm leading-relaxed flex-1">"{r.text}"</p>
              <div className="flex items-center gap-3 pt-5 mt-4 border-t border-border">
                <div className="w-11 h-11 rounded-full bg-gradient-cta text-primary-foreground grid place-items-center font-bold">{r.name[0]}</div>
                <div>
                  <div className="font-semibold text-sm">{r.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><i className="fa-solid fa-circle-check text-primary" />{r.role}</div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
