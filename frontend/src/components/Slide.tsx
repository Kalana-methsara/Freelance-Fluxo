import React from "react";

interface SlideProps {
  children: React.ReactNode;
  slidesToShow?: number;
  arrowsScroll?: number;
}

const Slide: React.FC<SlideProps> = ({
  children,
  slidesToShow = 1,
  arrowsScroll = 1,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const childArray = React.Children.toArray(children);
  const total = childArray.length;

  // On mobile always show 1 slide
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const visibleCount = isMobile ? 1 : slidesToShow;
  const scrollCount = isMobile ? 1 : arrowsScroll;

  const prev = () => {
    setCurrentIndex((i) => (i - scrollCount + total) % total);
  };

  const next = () => {
    setCurrentIndex((i) => (i + scrollCount) % total);
  };

  const visibleSlides = Array.from({ length: visibleCount }, (_, i) =>
    childArray[(currentIndex + i) % total]
  );

  return (
    <div className="flex justify-center py-12 md:py-24 px-4">
      <div className="relative w-full max-w-[1400px]">
        {/* Prev Button */}
        <button
          onClick={prev}
          className="absolute left-0 md:left-[-25px] top-1/2 -translate-y-1/2 z-10 w-[36px] h-[36px] md:w-[50px] md:h-[50px] rounded-full bg-[#f3f3f3] hover:bg-gray-200 transition-colors flex items-center justify-center shadow-sm"
          aria-label="Previous"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 md:w-5 md:h-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Slides */}
        <div className="overflow-hidden mx-10 md:mx-0">
          <div className="flex transition-transform duration-500 ease-in-out">
            {visibleSlides.map((child, i) => (
              <div
                key={i}
                className="flex-shrink-0 px-2"
                style={{ width: `${100 / visibleCount}%` }}
              >
                {child}
              </div>
            ))}
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={next}
          className="absolute right-0 md:right-[-25px] top-1/2 -translate-y-1/2 z-10 w-[36px] h-[36px] md:w-[50px] md:h-[50px] rounded-full bg-[#f3f3f3] hover:bg-gray-200 transition-colors flex items-center justify-center shadow-sm"
          aria-label="Next"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 md:w-5 md:h-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dot indicators on mobile */}
        <div className="flex justify-center gap-2 mt-4 md:hidden">
          {childArray.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex ? "bg-[#1dbf73]" : "bg-gray-300"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Slide;