import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "./hover-img.css";

export interface ProjectItem {
  title: string;
  label: string;
  imageSrc: string;
  tag?: string;
}

export interface HoverImgProps {
  projects: ProjectItem[];
  className?: string;
  isContained?: boolean;
  compact?: boolean;
}

export function HoverImg({
  projects,
  className = "",
  isContained = false,
  compact = false,
}: HoverImgProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const xToRef = useRef<gsap.QuickToFunc | null>(null);
  const yToRef = useRef<gsap.QuickToFunc | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    const projectThumbnail = thumbnailRef.current;
    const projectsContainer = containerRef.current?.querySelector(
      ".hover-img-projects"
    ) as HTMLElement | null;

    if (!projectThumbnail || !projectsContainer) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const projectElements = gsap.utils.toArray(
      ".hover-img-project",
      projectsContainer
    ) as HTMLElement[];
    const thumbnails = gsap.utils.toArray(
      ".hover-img-thumbnail",
      projectThumbnail
    ) as HTMLElement[];

    gsap.set(projectThumbnail, {
      scale: 0,
      xPercent: -50,
      yPercent: -50,
      autoAlpha: 0,
    });

    if (!prefersReducedMotion) {
      xToRef.current = gsap.quickTo(projectThumbnail, "x", {
        duration: 0.35,
        ease: "power3.out",
      });
      yToRef.current = gsap.quickTo(projectThumbnail, "y", {
        duration: 0.35,
        ease: "power3.out",
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      let x = e.clientX;
      let y = e.clientY;

      if (isContained && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const halfWidth = projectThumbnail.offsetWidth / 2;
        const halfHeight = projectThumbnail.offsetHeight / 2;
        const inset = 16;
        x = Math.max(
          halfWidth + inset,
          Math.min(rect.width - halfWidth - inset, e.clientX - rect.left)
        );
        y = Math.max(
          halfHeight + inset,
          Math.min(rect.height - halfHeight - inset, e.clientY - rect.top)
        );
      }

      xToRef.current?.(x);
      yToRef.current?.(y);
    };

    const handleMouseLeave = () => {
      gsap.to(projectThumbnail, {
        scale: 0,
        autoAlpha: 0,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    projectsContainer.addEventListener("mousemove", handleMouseMove);
    projectsContainer.addEventListener("mouseleave", handleMouseLeave);

    const projectListeners: Array<() => void> = [];

    projectElements.forEach((project, index) => {
      const handleMouseEnter = () => {
        setActiveIndex(index);
        gsap.to(projectThumbnail, {
          scale: 1,
          autoAlpha: 1,
          duration: prefersReducedMotion ? 0 : 0.35,
          ease: "back.out(1.4)",
          overwrite: "auto",
        });

        gsap.to(thumbnails, {
          yPercent: -100 * index,
          duration: prefersReducedMotion ? 0 : 0.4,
          ease: "power3.out",
          overwrite: "auto",
        });
      };

      project.addEventListener("mouseenter", handleMouseEnter);
      projectListeners.push(() =>
        project.removeEventListener("mouseenter", handleMouseEnter)
      );
    });

    return () => {
      projectsContainer.removeEventListener("mousemove", handleMouseMove);
      projectsContainer.removeEventListener("mouseleave", handleMouseLeave);
      projectListeners.forEach((cleanup) => cleanup());
    };
  }, [projects, isContained]);

  return (
    <div
      className={`hover-img-container ${
        compact ? "hover-img-compact" : ""
      } ${className}`}
      ref={containerRef}
    >
      <div className="hover-img-projects">
        {projects.map((project, index) => (
          <div
            className={`hover-img-project ${
              activeIndex === index ? "is-active" : ""
            }`}
            key={index}
            tabIndex={0}
            role="button"
            aria-label={`${project.title}: ${project.label}`}
            onFocus={() => {
              setActiveIndex(index);
              const projectThumbnail = thumbnailRef.current;
              if (projectThumbnail) {
                const thumbnails = gsap.utils.toArray(
                  ".hover-img-thumbnail",
                  projectThumbnail
                );
                gsap.to(thumbnails, {
                  yPercent: -100 * index,
                  duration: 0.3,
                  ease: "power2.out",
                });
              }
            }}
          >
            <div className="hover-img-title-group">
              <span className="hover-img-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2>{project.title}</h2>
              {project.tag && (
                <span className="hover-img-pill">{project.tag}</span>
              )}
            </div>
            <p>{project.label}</p>
          </div>
        ))}
      </div>

      <div
        className="hover-img-thumbnail-wrapper"
        ref={thumbnailRef}
        style={isContained ? { position: "absolute" } : undefined}
        aria-hidden="true"
      >
        {projects.map((project, index) => (
          <div className="hover-img-thumbnail" key={index}>
            <img
              src={project.imageSrc}
              alt={project.title}
              loading="lazy"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default HoverImg;
