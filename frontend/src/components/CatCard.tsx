import React from "react";
import { Link } from "react-router-dom";

interface CardProps {
  img: string;
  desc: string;
  title: string;
}

interface CatCardProps {
  card: CardProps;
}

function CatCard({ card }: CatCardProps) {
  return (
    <Link to="/gigs?cat=design">
      <div className="w-full max-w-[252px] mx-auto h-[220px] md:h-[344px] text-white rounded-[5px] relative cursor-pointer overflow-hidden">
        <img
          src={card.img}
          alt=""
          className="w-full h-full object-cover"
        />
        {/* dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />
        <span className="font-light absolute top-[12px] left-[12px] md:top-[15px] md:left-[15px] text-xs md:text-sm z-10">
          {card.desc}
        </span>
        <span className="absolute top-[30px] left-[12px] md:top-[40px] md:left-[15px] text-lg md:text-2xl font-medium z-10">
          {card.title}
        </span>
      </div>
    </Link>
  );
}

export default CatCard;