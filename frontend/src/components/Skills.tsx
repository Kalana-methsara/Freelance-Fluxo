import { useEffect, useRef, useState, useCallback } from 'react';
import {
  SiHtml5, SiCss, SiJavascript, SiTypescript,
  SiReact, SiNextdotjs, SiTailwindcss,
  SiMongodb, SiMysql, SiPostgresql,
  SiGit, SiBootstrap, SiDocker,
  SiGo, SiFigma, SiFirebase, SiMui,
  SiNginx, SiStrapi, SiGraphql, SiRedis,
  SiPrisma, SiVercel, SiLinux, SiNodedotjs,
  SiPython, SiDjango, SiVuedotjs, SiAngular,
  SiExpress, SiNestjs, SiKubernetes, SiGithubactions,
  SiTerraform, SiRabbitmq,
} from 'react-icons/si';
import { FaAws } from 'react-icons/fa';


const techs = [
  { name: 'HTML',        icon: <SiHtml5       />, color: '#E34F26' },
  { name: 'CSS',         icon: <SiCss        />, color: '#1572B6' },
  { name: 'JavaScript',  icon: <SiJavascript  />, color: '#F7DF1E' },
  { name: 'TypeScript',  icon: <SiTypescript  />, color: '#3178C6' },
  { name: 'React',       icon: <SiReact       />, color: '#61DAFB' },
  { name: 'Next JS',     icon: <SiNextdotjs   />, color: '#FFFFFF' },
  { name: 'Node.js',     icon: <SiNodedotjs   />, color: '#339933' },
  { name: 'Tailwind',    icon: <SiTailwindcss />, color: '#38BDF8' },
  { name: 'Bootstrap',   icon: <SiBootstrap   />, color: '#7952B3' },
  { name: 'Material UI', icon: <SiMui         />, color: '#007FFF' },
  { name: 'MongoDB',     icon: <SiMongodb     />, color: '#47A248' },
  { name: 'MySQL',       icon: <SiMysql       />, color: '#4479A1' },
  { name: 'PostgreSQL',  icon: <SiPostgresql  />, color: '#4169E1' },
  { name: 'Redis',       icon: <SiRedis       />, color: '#DC382D' },
  { name: 'Prisma',      icon: <SiPrisma      />, color: '#FFFFFF' },
  { name: 'GraphQL',     icon: <SiGraphql     />, color: '#E10098' },
  { name: 'Firebase',    icon: <SiFirebase    />, color: '#FFCA28' },
  { name: 'Git',         icon: <SiGit         />, color: '#F05032' },
  { name: 'Docker',      icon: <SiDocker      />, color: '#2496ED' },
  { name: 'AWS',         icon: <FaAws         />, color: '#FF9900' },
  { name: 'Nginx',       icon: <SiNginx       />, color: '#009639' },
  { name: 'Linux',       icon: <SiLinux       />, color: '#FCC624' },
  { name: 'Vercel',      icon: <SiVercel      />, color: '#FFFFFF' },
  { name: 'Figma',       icon: <SiFigma       />, color: '#F24E1E' },
  { name: 'Go',          icon: <SiGo          />, color: '#00ADD8' },
  { name: 'Strapi',      icon: <SiStrapi      />, color: '#4945FF' },
  { name: 'Python',      icon: <SiPython      />, color: '#3776AB' },
  { name: 'Django',      icon: <SiDjango      />, color: '#092E20' },
  { name: 'Vue.js',      icon: <SiVuedotjs    />, color: '#4FC08D' },
  { name: 'Angular',     icon: <SiAngular     />, color: '#DD0031' },
  { name: 'Express',     icon: <SiExpress     />, color: '#FFFFFF' },
  { name: 'NestJS',      icon: <SiNestjs      />, color: '#E0234E' },
  { name: 'Kubernetes',  icon: <SiKubernetes  />, color: '#326CE5' },
  { name: 'GitHub Actions', icon: <SiGithubactions />, color: '#2088FF' },
  { name: 'Terraform',   icon: <SiTerraform   />, color: '#7B42BC' },
  { name: 'RabbitMQ',    icon: <SiRabbitmq    />, color: '#FF6600' },
];

// Duplicate for seamless infinite loop
const doubled = [...techs, ...techs];

const TechStack = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const positionRef = useRef<number>(0);
  const halfWidthRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  const [isHovered, setIsHovered] = useState(false);
  
  // Speed in pixels per second (consistent across all devices)
  const SCROLL_SPEED = 100;

  // Update halfWidth on resize
  const updateDimensions = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    
    // Get current scrollWidth (total width of all elements)
    const scrollWidth = track.scrollWidth;
    halfWidthRef.current = scrollWidth / 2;
    
    // Ensure position stays within bounds after resize
    if (positionRef.current >= halfWidthRef.current) {
      positionRef.current = positionRef.current % halfWidthRef.current;
      track.style.transform = `translateX(-${positionRef.current}px)`;
    }
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Initialize dimensions
    updateDimensions();

    // Resize observer for responsive adjustments
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    resizeObserver.observe(track);

    // Animation loop with delta time for consistent speed
    const animate = (timestamp: number) => {
      if (!trackRef.current) return;
      
      // Initialize last timestamp on first frame
      if (lastTimestampRef.current === 0) {
        lastTimestampRef.current = timestamp;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      // Calculate delta time in seconds (capped to 16ms to avoid large jumps)
      let delta = Math.min(0.033, (timestamp - lastTimestampRef.current) / 1000);
      lastTimestampRef.current = timestamp;
      
      // Only update if not hovered and delta is valid
      if (!isHovered && delta > 0 && delta < 0.1) {
        // Move position based on scroll speed and delta time
        positionRef.current += SCROLL_SPEED * delta;
        
        // Seamless reset: when we've scrolled half the total width, subtract halfWidth
        if (halfWidthRef.current > 0 && positionRef.current >= halfWidthRef.current) {
          positionRef.current -= halfWidthRef.current;
        }
        
        // Apply transform
        trackRef.current.style.transform = `translateX(-${positionRef.current}px)`;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
      lastTimestampRef.current = 0;
    };
  }, [isHovered, updateDimensions]);

  return (
    <section className="relative bg-linear-to-br from-[#001a00] via-[#002400] to-[#001e00] py-15 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ 
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }} />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with modern accent */}
        <div className="text-center mb-14">
          <div className="inline-block">
            <h2 className="text-transparent text-4xl md:text-5xl font-bold tracking-tight mb-3 bg-linear-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
              Tech Stack
            </h2>
            <div className="h-1 w-20 bg-linear-to-r from-purple-500 to-cyan-500 mx-auto rounded-full" />
          </div>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto text-sm md:text-base">
            Modern tools & technologies I work with to build exceptional digital experiences
          </p>
        </div>
      </div>

      {/* Carousel container with fade edges */}
      <div
        className="relative mt-8"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          ref={trackRef}
          className="flex gap-4 md:gap-5 w-max px-2"
          style={{ willChange: 'transform' }}
        >
          {doubled.map((tech, index) => (
            <div
              key={index}
              className="group relative flex flex-col items-center justify-center gap-3
                         w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36
                         bg-linear-to-br from-[#0a2a0a] to-[#052205]
                         border border-gray-600
                         rounded-2xl
                         hover:border-[#00c951]
                         hover:shadow-lg hover:shadow-cyan-500/20
                         transition-all duration-300 ease-out cursor-pointer
                         backdrop-blur-sm"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-purple-500/10 to-cyan-500/10" />
              </div>
              
              {/* Icon container with scale animation */}
              <div
                className="text-3xl sm:text-4xl md:text-5xl transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg"
                style={{ color: tech.color }}
              >
                {tech.icon}
              </div>
              
              {/* Tech name with better typography */}
              <span className="text-gray-300 group-hover:text-white font-medium text-xs sm:text-sm text-center transition-colors duration-300 tracking-wide">
                {tech.name}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Pause indicator (appears on hover) */}
      <div className={`text-center mt-8 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <span className="inline-flex items-center gap-2 text-xs text-gray-400 bg-gray-800/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Paused • Hover to explore
        </span>
      </div>
    </section>
  );
};

export default TechStack;